<?php
/* Prázdné = index v aktuální složce. Při přepisu URL lze nastavit např. '/JEVi'. */
$assetBase = rtrim($assetBase ?? '.', '/');
$asset = static function ($relative) use ($assetBase) {
    $path = __DIR__ . '/' . $relative;
    $version = is_file($path) ? (string) filemtime($path) : '1';
    return htmlspecialchars($assetBase . '/' . $relative . '?v=' . $version, ENT_QUOTES, 'UTF-8');
};
$hasServices = is_file(__DIR__ . '/includes/services.php');
/* Odkaz lze nastavit i na samostatné portfolio, např. $storyWorks = '/prace.php'. */
$storyHasWorks = isset($storyWorks) || $hasServices;
$storyWorks = $storyWorks ?? '#prace';
?>
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JEVi visual — Neordinární</title>
  <meta name="description" content="JEVi visual. Filmy, weby a vizuální tvorba s osobním rukopisem. Nejde o obraz, ale o pocit, co dává.">
  <link rel="stylesheet" href="<?= $asset('css/global.css') ?>">
  <link rel="stylesheet" href="<?= $asset('css/opening.css') ?>">
  <link rel="stylesheet" href="<?= $asset('css/story.css') ?>">
  <?php if ($hasServices && is_file(__DIR__ . '/css/services.css')): ?>
    <link rel="stylesheet" href="<?= $asset('css/services.css') ?>">
  <?php endif; ?>
  <script defer src="<?= $asset('JS/opening.js') ?>"></script>
  <script type="module" src="<?= $asset('JS/story.js') ?>"></script>
  <?php if ($hasServices && is_file(__DIR__ . '/JS/services.js')): ?>
    <script defer src="<?= $asset('JS/services.js') ?>"></script>
  <?php endif; ?>
</head>
<body>
  <a class="skip-link" href="#story">Přejít k příběhu</a>
  <main id="main-content">
    <?php include __DIR__ . '/includes/opening.php'; ?>
    <?php include __DIR__ . '/includes/story.php'; ?>
    <?php if ($hasServices): ?>
      <div id="prace"><?php include __DIR__ . '/includes/services.php'; ?></div>
    <?php endif; ?>
  </main>
  <div class="jv-countdown" id="countdown" role="dialog" aria-modal="true" aria-label="Úvodní odpočet" hidden>
    <div class="jv-leader" aria-hidden="true"><div class="jv-leader-sweep"></div><span id="count">3</span></div>
    <span class="jv-countdown-brand" aria-hidden="true">JEVi / VISUAL</span>
    <button class="jv-countdown-skip" type="button">Přeskočit úvod</button>
  </div>
</body>
</html>
