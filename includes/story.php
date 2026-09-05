<?php
$storyWorks = $storyWorks ?? '#prace';
$storyHasWorks = $storyHasWorks ?? true;
$storyEscape = static fn($value) => htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
?>
<section id="story" class="jv-story" aria-label="JEVi visual — filmový příběh" data-jv-story>
  <div class="jv-stage">
    <div class="jv-world" aria-hidden="true"></div>
    <div class="jv-vignette" aria-hidden="true"></div>
    <div class="jv-frame" aria-hidden="true"><span>JEVi / VISUAL</span><span>POCIT ZŮSTÁVÁ.</span></div>
    <div class="jv-copy">
      <article data-chapter="0"><p class="jv-eyebrow">JEVi visual</p><h2>Nejde o obraz.<br>Ale o pocit,<br><em>co dává.</em></h2></article>
      <article data-chapter="1"><p class="jv-eyebrow">Náš rukopis</p><h2>Malý tým.<br><em>Osobní příběhy.</em></h2><p>Jsme malý tým, který si ale dává záležet na své tvorbě, aby byla individuální s jasným rukopisem.</p></article>
      <article data-chapter="2"><p class="jv-eyebrow">Za hranicí obvyklého</p><h2>Neordinární.<br><em>V každém směru.</em></h2><p>Netvoříme jenom filmy a weby. Věnujeme se i dalším činnostem, kde je třeba být neordinární.</p></article>
      <article data-chapter="3"><p class="jv-eyebrow">Příběh pokračuje</p><h2>Některé pocity<br><em>zůstávají.</em></h2><p>Snad jsme vás zaujali a web ve vás vzbudil pocit, který si ještě na dlouho zapamatujete.</p><?php if ($storyHasWorks): ?><a class="jv-works" href="<?= $storyEscape($storyWorks) ?>">Podívejte se na naše práce <span aria-hidden="true">↗</span></a><?php endif; ?></article>
    </div>
    <div class="jv-bottom"><span class="jv-chapter" aria-hidden="true">01 / 04</span><span class="jv-scroll">Příběhem vás provede scroll</span><button class="jv-motion" type="button" hidden>Omezit pohyb</button></div>
    <div class="jv-progress" aria-hidden="true"><i></i></div>
  </div>
</section>
