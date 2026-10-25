<?php
// Sdílené funkce katalogu. HTML vždy escapujeme, SQL hodnoty předáváme přes parametry.
$cfg = require __DIR__ . '/../config.php';
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_set_cookie_params(['httponly'=>true,'samesite'=>'Lax','secure'=>!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off']);
    session_start();
}
if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
function h($v) { return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); }
function csrf() { return '<input type="hidden" name="csrf" value="'.h($_SESSION['csrf']).'">
'; }
function verify_csrf() {
    if (!is_string($_POST['csrf'] ?? null) || !hash_equals($_SESSION['csrf'], $_POST['csrf'])) { http_response_code(403); exit('Platnost formuláře vypršela. Obnovte stránku.'); }
}
function db() {
    global $cfg; static $db;
    if (!$db) {
        if (!extension_loaded('mysqli')) throw new RuntimeException('mysqli není dostupné');
        mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
        $db = mysqli_connect($cfg['db_host'], $cfg['db_user'], $cfg['db_pass'], $cfg['db_name']);
        mysqli_set_charset($db,'utf8mb4');
    } return $db;
}
function query($sql, $types='', $params=[]) {
    $st = mysqli_prepare(db(),$sql);
    if ($types) mysqli_stmt_bind_param($st,$types,...$params);
    mysqli_stmt_execute($st); return $st;
}
function rows($sql,$types='',$params=[]) { return mysqli_fetch_all(mysqli_stmt_get_result(query($sql,$types,$params)),MYSQLI_ASSOC); }
function safe_url($s) {
    $s=trim((string)$s);
    if ($s==='' || preg_match('/[\x00-\x20\\\\]/',$s)) return '';
    if (preg_match('~^https?://~i',$s)) return filter_var($s,FILTER_VALIDATE_URL) ? $s : '';
    return preg_match('~^[a-zA-Z0-9_./-]+$~',$s) && !str_starts_with($s,'//') && !str_contains($s,'..') ? $s : '';
}
function status_label($s) {
    return ['in_progress'=>'In progress','canceled'=>'Canceled','finished'=>'Ready / finished'][$s] ?? 'In progress';
}

function page_top($title) { ?>
    <!doctype html>
    <html lang="cs">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title><?=h($title)?> — JEVi production</title>

        <link rel="stylesheet" href="css/films.css?v=<?= filemtime(__DIR__ . '/css/films.css') ?>">
    </head>

    <body>
        <header>
            <a href="index.php">
                <img src="sources/JEVi-production-A.svg" alt="JEVi production">
            </a>

            <a href="films.php">Filmové příběhy ↗</a>
        </header>

    <main>

<?php 
}

function page_bottom() {
    echo '</main><footer>JEVi production · Od nápadu k poslednímu záběru.</footer></body></html>';
}

function unavailable() {
    http_response_code(503);
    page_top('Filmy');
    echo '<h1>Za chvíli zpět.</h1><p>Filmové projekty právě připravujeme. Zkuste to prosím později.</p>';
    page_bottom();
    exit;
}
