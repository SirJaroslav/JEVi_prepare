<?php
// HLAVNÍ NASTAVENÍ. Texty úvodu: includes/opening.php; příběh: includes/story.php.
return [
    'countdown' => false, // true = odpočet 3–2–1; false = rovnou úvod.
    'logo' => 'sources/JEVi-production-A.svg', // Relativní cesta k vašemu SVG/PNG logu.
    // Databázi vytvořte a importujte database/schema.sql. Hesla patří do prostředí serveru.
    'db_host' => getenv('JEVI_DB_HOST') ?: 'localhost',
    'db_name' => getenv('JEVI_DB_NAME') ?: 'JEVi',
    'db_user' => getenv('JEVI_DB_USER') ?: 'root',
    'db_pass' => getenv('JEVI_DB_PASS') ?: '',
    // Vygenerování hashe a nastavení přihlášení popisuje NAVOD.md.
    'admin_hash' => getenv('JEVI_ADMIN_HASH') ?: '$2y$10$GKkpC3cvL.eoe2R10oTSNOPfv2vz.99pAhofpWl1DN1G6CGVhsNoG',
];
