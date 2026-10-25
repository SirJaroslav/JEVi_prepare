-- Jednorázový import do prázdné MySQL databáze (utf8mb4). Nikdy neimportujte znovu přes živá data.
CREATE TABLE films (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 title VARCHAR(160) NOT NULL,
 description TEXT NOT NULL,
 photo VARCHAR(500) NOT NULL DEFAULT '',
 status ENUM('in_progress','canceled','finished') NOT NULL DEFAULT 'in_progress',
 notes TEXT NOT NULL,
 idea_pdf VARCHAR(500) NOT NULL DEFAULT '',
 literary_pdf VARCHAR(500) NOT NULL DEFAULT '',
 technical_pdf VARCHAR(500) NOT NULL DEFAULT '',
 youtube VARCHAR(500) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE roles (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 film_id INT UNSIGNED NOT NULL,
 name VARCHAR(100) NOT NULL,
 person VARCHAR(160) NOT NULL DEFAULT '',
 is_open TINYINT NOT NULL DEFAULT 1,
 FOREIGN KEY (film_id) REFERENCES films(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE applications (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 role_id INT UNSIGNED NOT NULL,
 name VARCHAR(160) NOT NULL,
 email VARCHAR(254) NOT NULL,
 message TEXT NOT NULL,
 state ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Ukázka, nikoli skutečná filmografie. Přepište v administraci.
INSERT INTO films(title,description,notes) VALUES ('První příběh — ukázkový projekt','Tady napište, o čem váš film vypráví. Jaký svět divákovi otevře a proč ho chcete natočit?','Zde můžete zveřejnit termín natáčení, lokaci nebo informace pro zájemce.');
INSERT INTO roles(film_id,name) VALUES (1,'Režisér'),(1,'Kameraman'),(1,'Zvukař'),(1,'Runner'),(1,'Herec / herečka');
