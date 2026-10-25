# JEVi — průvodce vlastními úpravami

## Co je nové

Odpočet je vypnutý. Logo je zapojené z přiloženého JEVi-production-A.svg.
Natáčení filmů vede na films.php. Katalog a detail se čtou z MySQL;
přihlášky se ukládají do databáze a spravují v admin.php. Formulář neposílá e-mail.
Vaše původní texty a 3D svět jsou zachované. Nový design filmů používá šedou,
otevřený asymetrický grid, černé linky a barevné stavové tečky.

## 1. Kde co měnit

| Co chci změnit | Soubor / místo |
| --- | --- |
| Zapnout / vypnout odpočet | config.php → countdown: true / false |
| Logo na úvodu | config.php → logo (cesta k SVG nebo PNG) |
| Logo na filmových stránkách | includes/films_boot.php → page_top, src obrázku |
| Úvodní titulek, popis, slogan | includes/opening.php, text mezi HTML značkami |
| Texty čtyř scén | includes/story.php, article data-chapter 0 až 3 |
| Odkazy a názvy služeb | includes/services.php, href a strong |
| Velikost písma a mezery úvodu | css/opening.css |
| Rozložení textů příběhu a délka scrollu | css/story.css |
| Šedá barva služeb | css/services.css → --paper |
| Vzhled katalogu, detailu, formulářů | css/films.css |
| Film, fotka, popis, odkazy, stav | admin.php po přihlášení |
| Obsazení / volné pozice | admin.php → Upravit film → Obsazení pozic |
| Kresba auta, domu, světlo a kamera | JS/story.js |

Pište texty mezi značky: `<h1>Váš nový nadpis</h1>`. Značky a PHP příkazy ponechte.
`<br>` udělá nový řádek, `<em>` zvýrazní kus titulku kurzívou.
Pro znak & v ručně psaném HTML používejte `&amp;`. Administrace text escapuje sama.
HTML značky do administrace nepište: zobrazí se jako běžný text.

## 2. Zprovoznění databáze na hostingu / XAMPP

1. Potřebujete PHP 8.1+ s mysqli a mysqlnd a MySQL 8 nebo MariaDB 10.6+.
2. Vytvořte databázi a uživatele s oprávněními pro tuto databázi.
3. Do PRÁZDNÉ databáze importujte database/schema.sql přes phpMyAdmin.
4. Nastavte proměnné prostředí JEVI_DB_HOST, JEVI_DB_NAME, JEVI_DB_USER,
   JEVI_DB_PASS. Pokud hosting neumí proměnné, nahraďte příslušné hodnoty
   v config.php svými údaji. Soubor obsahuje hesla, nesdílejte jej.
5. V terminálu vygenerujte hash svého administračního hesla:

   `php -r 'echo password_hash(readline("Heslo: "), PASSWORD_DEFAULT), PHP_EOL;'`

   Terminál při psaní hesla zobrazuje znaky. Hash (nikoli heslo) nastavte jako
   JEVI_ADMIN_HASH, případně do config.php do jednoduchých uvozovek.
6. Otevřete films.php, potom admin.php. Přihlaste se svým heslem.
7. Přepište ukázkový film a vložte skutečné podklady. Ukázka není vaše filmografie.

Bez databáze úvod funguje dál; filmové stránky zobrazí informaci o nedostupnosti.
Přístupové údaje tu nejsou vyplněné. Soubor SQL zakládá tabulky a jednu ukázku;
neimportujte ho opakovaně do živé databáze.

## 3. Docker

Původní základ php:8.1-apache-alpine byl nahrazen php:8.3-apache s mysqli.
Compose přidává MariaDB a trvalý svazek jevi_database. Databáze nemá veřejný port.

1. Zkopírujte .env.example na .env a vyplňte dvě různá silná hesla.
2. Vygenerujte hash podle předchozí části. Hodnotu JEVI_ADMIN_HASH v .env
   uzavřete do jednoduchých uvozovek, aby Docker nerozbaloval znaky `$`.
3. Spusťte `docker compose up -d --build` a otevřete http://localhost:8080.
4. SQL se automaticky importuje jen při PRVNÍM vytvoření databázového svazku.
   Změna SQL po prvním spuštění existující databázi nezmění.
5. `docker compose down` data zachová. Nepoužívejte `down -v`, pokud chcete data ponechat.

## 4. Filmy a přihlášky

Admin → Přidat film → název, popis, veřejné poznámky a stav.
Fotku a PDF nahrajte přes FTP do media/. Do pole zadejte např. media/film.jpg
nebo media/namet.pdf. Nahrávání souborů přes web není součástí této verze.
Lze použít i úplnou https URL. YouTube se otevře odkazem; video se samo nenačítá.

- Oranžová: In progress — rozpracovaný projekt.
- Červená: Canceled — zrušený projekt.
- Zelená: Ready / finished — hotový projekt.

Každý nový film dostane role Režisér, Kameraman, Zvukař, Runner, Herec / herečka.
Volná role má zaškrtnuto Přijímat přihlášky. Jméno může být prázdné i při uzavřené roli.
Další herecké role přidejte v phpMyAdmin do roles (film_id, name, person, is_open).
Filmy ve stavu canceled nebo finished přihlášky nepřijímají.

Zájemce vybere roli, uvede jméno, e-mail a zprávu. Přihláška se uloží jako pending.
V admin.php ji můžete schválit (accepted), odmítnout (rejected) nebo smazat.
Schválení uzavře roli dalším přihláškám, ale jméno nezveřejňuje automaticky.
Po domluvě s člověkem vyplňte jeho jméno u role. Další již přijaté přihlášky na tutéž
roli posuďte samostatně; při souběžném schválení druhého zájemce systém uzavřenou roli odmítne.
Smazání přihlášky neotevře roli a neodstraní ručně zveřejněné jméno.
Administrace zobrazuje 300 nejnovějších přihlášek; starší zůstávají v databázi.

Zabezpečení: heslo je hashované, dotazy parametrizované, formuláře mají CSRF token,
kontrolu volné role na serveru, honeypot a minutovou prodlevu na session.
To není úplná ochrana proti cílenému spamu; při veřejném provozu lze doplnit limit
na reverzní proxy. Pro veřejný web používejte HTTPS. PDF, fotky i poznámky jsou VEŘEJNÉ.
Kontakty uchovávejte pouze po dobu potřebnou pro nábor; mazání je v administraci.
Na Nginx nastavte zákaz přístupu k .env, SQL a konfiguračním souborům — .htaccess
funguje jen na Apache. Zálohujte databázi zvlášť, ZIP obsahuje kód, nikoli přihlášky.

## 5. Jak změnit auto a scénu

Auto není fotografie. V JS/story.js je sestavené z 3D dílů přes Three.js.
Nahoře je SCENE_SETTINGS: carScale změní velikost, carVisible jej skryje.
Pod komentářem AUTO je `car.position.set(2.2, .015, -10)`:
první číslo posouvá vlevo/vpravo, druhé nahoru/dolů, třetí do hloubky.
`car.rotation.set(0, -.3, -.018)` znamená otáčení kolem X, Y a Z v radiánech.
90 stupňů = Math.PI / 2. Měňte po malých krocích.

`box(šířka, výška, hloubka, materiál, car, X, Y, Z)` vytvoří díl auta.
Barvy karoserie hledejte pod `paint`, `fadedPaint`, `corrosion`. Jejich geometrie
se na konci kvůli výkonu slučuje. Úpravy objektů proto provádějte PŘED slučováním
geometrie (blok batches), ne uvnitř draw().

Chcete-li auto úplně nahradit GLB modelem, nestačí vyměnit src obrázku.
Je třeba přidat GLTFLoader odpovídající verzi Three.js r180, načíst model,
nastavit jeho měřítko, pozici a stíny a zajistit uvolnění geometrie při přepnutí
pohybu. Loader nyní není přibalený. Pro první pokusy doporučuji měnit existující model.

Dráha kamery je pole frames na konci souboru. Každý řádek má:
`[postup scrollu, [poloha kamery], [bod, na který hledí]]`.
Při přesunu domu upravte i cíle kamery, aby průchod stále vedl dveřmi.

## 6. Temnější pohádková atmosféra

Směr může stát na nakloněných siluetách, protáhlých proporcích, chladné mlze,
silném bočním světle a kontrastu malého člověka s velkým prostředím.
Zkuste nejdřív SCENE_SETTINGS.fog = .035 a exposure = 1.05.
Potom teprve protahujte větve a měňte náklony střechy. Zachovejte čitelnost textů
a průchod dveřmi. Tato verze přidává ovládací body a komentáře; nepřestavuje celý
stávající svět do nové výtvarné podoby.

## 7. Kontrola po úpravě

Přibalený preview.html je původní statická ukázka. Pro aktuální texty, logo,
filmy a přihlášky vždy otevřete index.php přes PHP server, ne dvojklikem ze složky.
V této dodávce prošla syntaxe všech 9 PHP souborů parserem PHP 8.3 a JavaScript
kontrolou Node. Živý zápis do MySQL, Docker a vizuální kontrola nebyly v pracovním
prostředí spuštěné; ověřte je po vyplnění nastavení podle kroků níže.

Otevřete úvod v novém anonymním okně, zkuste omezit/zapnout pohyb, mobilní šířku,
odkaz Natáčení filmů, detail a přihlášku. Přihlaste se do admin.php, přihlášku
schvalte a ověřte, že role zmizela z nabídky. Při chybě databáze zkontrolujte
serverový PHP log; návštěvníkovi se neveřejné chyby nezobrazují.
