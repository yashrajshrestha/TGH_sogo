<?php
// Thamel Grand Hotel — lightweight PHP/MySQL API.
// Mirrors the Strapi response shapes ({data:...} / {error:...}) and the same
// /api/* paths, so the existing frontend works by only changing its base URL.

require __DIR__ . '/db.php';

$cfg = config();
header('Access-Control-Allow-Origin: ' . ($cfg['cors_origin'] ?? '*'));
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'OPTIONS') { http_response_code(204); exit; }

// Route on the path after "/api" so it works at the domain root or in a subfolder.
$uri  = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = preg_match('#/api(/.*)$#', $uri, $m) ? rtrim($m[1], '/') : rtrim($uri, '/');
if ($path === '') $path = '/';

function out($code, $payload) { http_response_code($code); echo json_encode($payload); exit; }
function err($code, $name, $msg, $details = null) {
    out($code, ['error' => array_filter(['status' => $code, 'name' => $name, 'message' => $msg, 'details' => $details], fn($v) => $v !== null)]);
}
// Shape a blog row like Strapi (nested media) so the frontend renders it unchanged.
function blog_entry($r) {
    return ['id' => (int)$r['id'], 'attributes' => [
        'title'        => $r['title'],
        'introduction' => $r['introduction'],
        'description'  => $r['description'],
        'createdAt'    => $r['created_at'],
        'publishedAt'  => $r['published_at'],
        'header_img'   => ['data' => ['attributes' => ['url' => $r['header_img']]]],
        'images'       => ['data' => []],
    ]];
}

// Email the hotel a plain-text summary when a booking comes in. Best-effort:
// a mail failure must never break the booking (it's already saved to the DB).
function notify_booking($cfg, $roomTitle, $d, $id, $ci, $co) {
    // Fall back to the hotel inbox so notifications work even if the server's
    // config.php hasn't been updated with the notify_email key yet.
    $to = $cfg['notify_email'] ?? 'Thamelgrandhotel@gmail.com';
    if (!$to) return;
    $from  = $cfg['mail_from'] ?? ('bookings@' . ($_SERVER['HTTP_HOST'] ?? 'localhost'));
    $name  = trim($d['name'] ?? '') ?: '(no name given)';
    $phone = trim($d['phone'] ?? '') ?: '—';
    $email = trim($d['email'] ?? '') ?: '';
    $lines = [
        "New booking #$id — Thamel Grand Hotel",
        str_repeat('-', 40),
        "Room:      $roomTitle",
        "Guest:     $name",
        "Phone:     $phone",
        "Email:     " . ($email ?: '—'),
        "Check-in:  $ci",
        "Check-out: $co",
        "Adults:    " . (int)($d['adult'] ?? 0),
        "Children:  " . (int)($d['children'] ?? 0),
        "Notes:     " . (trim($d['description'] ?? '') ?: '—'),
        str_repeat('-', 40),
        "This booking is already saved in your database.",
    ];
    $subject = "New booking #$id: $roomTitle ($ci \xE2\x86\x92 $co)";
    $headers = [
        'From: Thamel Grand Hotel <' . $from . '>',
        'Content-Type: text/plain; charset=UTF-8',
        'X-Mailer: TGH-API',
    ];
    // Let the hotel hit Reply and answer the guest directly.
    if ($email && filter_var($email, FILTER_VALIDATE_EMAIL)) $headers[] = 'Reply-To: ' . $name . ' <' . $email . '>';
    @mail($to, $subject, implode("\r\n", $lines), implode("\r\n", $headers));
}

try {
    if ($method === 'GET' && $path === '/rooms') {
        $rows = db()->query("SELECT id,title,price,rating,isdisplay,discription,units FROM rooms WHERE isdisplay=1 ORDER BY price ASC")->fetchAll();
        out(200, ['data' => array_map(function ($r) {
            return ['id' => (int)$r['id'], 'attributes' => [
                'title'       => $r['title'],
                'price'       => (string)$r['price'],   // string to mirror Strapi biginteger
                'rating'      => (int)$r['rating'],
                'isdisplay'   => (bool)$r['isdisplay'],
                'discription' => $r['discription'],
                'units'       => (int)$r['units'],
                'img'         => ['data' => null],       // frontend falls back to a local photo
            ]];
        }, $rows)]);
    }

    if ($method === 'GET' && preg_match('#^/rooms/(\d+)/availability$#', $path, $mm)) {
        $roomId = (int)$mm[1];
        $ci = $_GET['check_in'] ?? ''; $co = $_GET['check_out'] ?? '';
        if (!$ci || !$co) err(400, 'ValidationError', 'check_in and check_out are required.');
        if (strtotime($co) <= strtotime($ci)) err(400, 'ValidationError', 'check_out must be after check_in.');
        $st = db()->prepare("SELECT title,units FROM rooms WHERE id=?"); $st->execute([$roomId]);
        $room = $st->fetch();
        if (!$room) err(404, 'NotFound', 'Room not found.');
        $st = db()->prepare("SELECT COUNT(*) FROM bookings WHERE room_id=? AND status='confirmed' AND check_in < ? AND check_out > ?");
        $st->execute([$roomId, $co, $ci]);
        $booked = (int)$st->fetchColumn();
        $units  = (int)$room['units'];
        $avail  = max(0, $units - $booked);
        out(200, ['data' => ['roomId' => $roomId, 'title' => $room['title'], 'units' => $units, 'booked' => $booked, 'available' => $avail, 'isAvailable' => $avail > 0]]);
    }

    if ($method === 'POST' && $path === '/bookings') {
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $d = $input['data'] ?? [];
        $roomId = (int)($d['room'] ?? 0);
        $ci = $d['check_in'] ?? ''; $co = $d['check_out'] ?? '';
        if (!$roomId) err(400, 'ValidationError', 'A room is required to make a reservation.');
        if (!$ci || !$co) err(400, 'ValidationError', 'check_in and check_out are required.');
        if (strtotime($co) <= strtotime($ci)) err(400, 'ValidationError', 'check_out must be after check_in.');

        $pdo = db();
        $pdo->beginTransaction();
        try {
            // Lock the room row. Every booker for THIS room must take this same
            // lock first, so the overlap count below can't be stale — this is
            // what makes concurrent bookings for the last unit resolve to one
            // winner, safely across processes (unlike an in-app mutex).
            $st = $pdo->prepare("SELECT id,title,units FROM rooms WHERE id=? FOR UPDATE");
            $st->execute([$roomId]);
            $room = $st->fetch();
            if (!$room) { $pdo->rollBack(); err(404, 'NotFound', 'Room not found.'); }

            $st = $pdo->prepare("SELECT COUNT(*) FROM bookings WHERE room_id=? AND status='confirmed' AND check_in < ? AND check_out > ?");
            $st->execute([$roomId, $co, $ci]);
            $booked = (int)$st->fetchColumn();
            $units  = (int)$room['units'];

            if ($booked >= $units) {
                $pdo->rollBack();
                err(409, 'NoAvailability', "Sorry — \"{$room['title']}\" is fully booked for those dates. All {$units} unit(s) are taken.", ['units' => $units, 'booked' => $booked]);
            }

            $st = $pdo->prepare("INSERT INTO bookings (room_id,name,phone,email,check_in,check_out,adult,children,description,status,created_at)
                                 VALUES (?,?,?,?,?,?,?,?,?,'confirmed',NOW())");
            $st->execute([
                $roomId, $d['name'] ?? null, $d['phone'] ?? null, $d['email'] ?? null,
                $ci, $co, (int)($d['adult'] ?? 0), (int)($d['children'] ?? 0), $d['description'] ?? null,
            ]);
            $id = (int)$pdo->lastInsertId();
            $pdo->commit();
            // Notify the hotel by email (after commit, so a mail hiccup can't
            // roll back a confirmed booking).
            notify_booking($cfg, $room['title'], $d, $id, $ci, $co);
            out(201, ['data' => ['id' => $id, 'attributes' => [
                'room' => $roomId, 'check_in' => $ci, 'check_out' => $co, 'status' => 'confirmed',
            ]]]);
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            throw $e;
        }
    }

    if ($method === 'GET' && $path === '/reviews') {
        $rows = db()->query("SELECT id,full_name,description,rating FROM reviews ORDER BY id DESC")->fetchAll();
        out(200, ['data' => array_map(fn($r) => ['id' => (int)$r['id'], 'attributes' => [
            'full_name' => $r['full_name'], 'description' => $r['description'], 'rating' => (int)$r['rating'],
        ]], $rows)]);
    }

    if ($method === 'GET' && $path === '/blogs') {
        $rows = db()->query("SELECT id,title,introduction,description,header_img,created_at,published_at FROM blogs ORDER BY id DESC")->fetchAll();
        out(200, ['data' => array_map('blog_entry', $rows)]);
    }

    if ($method === 'GET' && preg_match('#^/blogs/(\d+)$#', $path, $mb)) {
        $st = db()->prepare("SELECT id,title,introduction,description,header_img,created_at,published_at FROM blogs WHERE id=?");
        $st->execute([(int)$mb[1]]);
        $row = $st->fetch();
        if (!$row) err(404, 'NotFound', 'Blog not found.');
        out(200, ['data' => blog_entry($row)]);
    }

    err(404, 'NotFound', "No such endpoint: {$method} {$path}");
} catch (Throwable $e) {
    err(500, 'ServerError', $e->getMessage());
}
