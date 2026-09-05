# JEVi visual — odpočet, opening a příběh

## Spuštění

Celou složku `jevi-visual` nahraj na PHP webserver nebo do XAMPP a otevři její `index.php` přes adresu webserveru. Soubory se neotevírají dvojklikem z disku. PHP 7.4+, moderní prohlížeč s ES moduly; pro prostorovou scénu WebGL2. Bez JavaScriptu či WebGL zůstává čitelný obsah.

## Struktura

- `index.php` — hlavní stránka, načítání stylů a skriptů, pořadí includů.
- `includes/opening.php` — úvodní texty z původního openingu.
- `includes/story.php` — texty příběhu a jeho viewport.
- `css/global.css` — základ stránky, barvy a přístupnost.
- `css/opening.css` — úvod, zaostření a odpočet.
- `css/story.css` — připnuté okno a texty příběhu.
- `JS/opening.js` — třísekundový odpočet a jednorázové zaostření.
- `JS/story.js` — farma, kamera, postava a ovládání scrollováním.
- `JS/vendor/` — lokální Three.js a jeho MIT licence. Složku zachovej.

Velikost písmen je důležitá: složka je `JS`, nikoli `js`. Na serverech s rozlišováním velikosti písmen nejde o stejnou cestu.

Všechny styly a skripty načítá pouze index. Includy je už nenačítají podruhé. Hlavní soubory mají v URL verzi podle `filemtime`, takže se po nahrání nové verze obnoví cache. Pro přepisované URL můžeš nahoře v indexu změnit `$assetBase`, například na `/JEVi`; patří sem URL složky, nikoli cesta na disku.

## Odpočet a úvod

První návštěva v dané relaci: 3 → 2 → 1, potom odhalení a zaostření úvodního textu. Žádná mezilehlá prázdná obrazovka ani nucený automatický scroll. Úvod je dostupný ihned bez JavaScriptu.

Odpočet můžeš přeskočit tlačítkem nebo klávesou Escape. Po návratu ve stejné relaci se neopakuje; stav ukládá `sessionStorage` pod klíčem `jevi.opening.seen.v1`. Odpočet se rovněž přeskočí při omezeném pohybu, příchodu na kotvu nebo návratu do již odscrollované stránky. Pro jeho nové vyzkoušení použij novou relaci nebo smaž tuto položku v Session Storage.

Úvod zachovává obsah „Neordinární“, původní popis i claim; barvy a typografie navazují na story. Odkaz „Vstoupit do příběhu“ vede na `#story`. Běžný scroll funguje rovněž. Po odpočtu se výpočty odpočtu ukončí; nejde o nekonečnou animační smyčku.

## Příběh

Zachována schválená varianta: scrollovací dráha zkrácená o 20 %, holý dvůr, hlavní strom s houpačkou, tři přidané stromy a keř, opuštěný hranatý sedan, dům a veranda. V místnosti přibyla sedící nehybná osoba otočená zády ke dveřím, směrem k zadní stěně. Má židli, tmavý oděv a mírně skloněnou hlavu. Neotáčí se, nevydává zvuk a není spojena s lekačkou.

Texty a odkaz se upravují v `includes/story.php`; délka scrollování v `css/story.css` (`height: 820svh` = 720svh posunu + 100svh okna). Trasa kamery je v poli `frames` v `JS/story.js`. Postava je ve skupině `figure`; její polohu nastavuje `figure.position` v lokálních souřadnicích domu.

Sticky potřebuje běžný tok stránky. Rodič sekce nemá mít `overflow: hidden/auto/scroll`; pro pouhé vodorovné ořezání lze použít `overflow-x: clip`. Při fixní horní navigaci uprav společně top a výšku viewportu story. Celá scéna je lokální, bez CDN a externích obrázků.

## Původní služby a portfolio

Přiložený původní index odkazoval na `services.php`, `services.css` a `services.js`, ale jejich obsah nebyl součástí dodávky. Není nahrazen vymyšleným portfoliem.

Pokud je chceš připojit, umísti své soubory do:

- `includes/services.php`
- `css/services.css`
- `JS/services.js`

Index automaticky vloží služby za story, v obalu `id="prace"`, a načte existující CSS/JS. Pokud samotné services.php už používá stejné id, odstraň duplicitní id z obalu v indexu. Jestli tvé služby potřebují další původní globální styly nebo skripty, přenes i tyto konkrétní závislosti — jejich obsah nebyl přiložen.

Bez služeb je závěrečný odkaz do portfolia skrytý, aby nevedl na neexistující sekci. Pro samostatnou stránku portfolia nastav před výpočtem `$storyHasWorks` v indexu například `$storyWorks = '/prace.php';`; odkaz se pak zobrazí i bez services.php.

## Ověření

Zkontrolována syntaxe obou JavaScriptů, lokální cesty, výpočetní sestavení scény včetně postavy a uvolnění geometrie. Logika openingu ověřena pro běžný odpočet, přeskočení, omezený pohyb, opakovanou návštěvu, přímou kotvu a nedostupné sessionStorage. Neproběhla vizuální kontrola v prohlížeči ani spuštění PHP v tomto prostředí.
