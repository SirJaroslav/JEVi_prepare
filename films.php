<?php
require __DIR__.'/includes/films_boot.php';
try { $films=rows('SELECT * FROM films ORDER BY id DESC'); } catch (Throwable $e) { error_log($e->getMessage()); unavailable(); }
page_top('Filmové příběhy'); ?>

<!-- <p class="eyebrow">NAŠE TVORBA / FILM</p> -->
<h1>Naše filmová tvorba</h1>
<p class="intro">Náhledněte na naše projekty, nebo se staňte jejich součástí. Najdete zde jak hotové filmy, tak filmy nad kterými se zrovna pracuje. Nebo jen naše myšlenky, které čekají až se jich někdo ujme a následně pošle na velké filmové plátno.</p>

<div class="film-list">
    <?php foreach($films as $film): ?>
        <a class="film-card" href="film.php?id=<?=$film['id']?>">
            <div class="visual">
                <?php if(safe_url($film['photo'])): ?>
                    <img src="<?=h(safe_url($film['photo']))?>" alt="<?=h($film['title'])?>" loading="lazy">
                <?php else: ?><span>JEVi / FILM</span><?php endif ?>
            </div>

            <div>
                <span class="status <?=h($film['status'])?>"><i></i><?=h(status_label($film['status']))?></span>
                <h2><?=h($film['title'])?></h2>
                <p><?=nl2br(h($film['description']))?></p>
                <span class="more">Otevřít příběh ↗</span>
            </div>
        </a>
    <?php endforeach; ?>
        
    <?php if(!$films): echo "<p>Nové příběhy se teprve rodí.</p>"; endif ?>
</div>

<?php page_bottom(); ?>
