<?php
// Soukromá správa. Heslo se nastavuje přes JEVI_ADMIN_HASH.
require __DIR__ . '/includes/films_boot.php';

header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');

$notice = '';

// Nahraje soubor do složky media/films a vrátí jeho cestu pro databázi.
function upload_film_file(string $field, string $type): ?string
{
    if (empty($_FILES[$field]) || $_FILES[$field]['error'] === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    $file = $_FILES[$field];
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new InvalidArgumentException('Soubor se nepodařilo nahrát. Zkuste to prosím znovu.');
    }

    $maxSize = $type === 'photo' ? 10 * 1024 * 1024 : 25 * 1024 * 1024;
    if ($file['size'] > $maxSize) {
        throw new InvalidArgumentException($type === 'photo'
            ? 'Fotografie může mít nejvýše 10 MB.'
            : 'PDF soubor může mít nejvýše 25 MB.');
    }

    if (!extension_loaded('fileinfo')) {
        throw new InvalidArgumentException('Server nemá zapnutou PHP funkci fileinfo, která ověřuje typ nahraného souboru.');
    }

    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    $allowed = $type === 'photo'
        ? ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif']
        : ['application/pdf' => 'pdf'];

    if (!isset($allowed[$mime])) {
        throw new InvalidArgumentException($type === 'photo'
            ? 'Fotografie musí být JPG, PNG, WEBP nebo GIF.'
            : 'Nahraný dokument musí být PDF.');
    }

    $directory = __DIR__ . '/media/films';
    if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
        throw new InvalidArgumentException('Nepodařilo se vytvořit složku media/films/. Zkontrolujte oprávnění složky na hostingu.');
    }

    $filename = $type . '-' . bin2hex(random_bytes(12)) . '.' . $allowed[$mime];
    if (!move_uploaded_file($file['tmp_name'], $directory . '/' . $filename)) {
        throw new InvalidArgumentException('PHP přijalo soubor, ale nepodařilo se ho uložit do media/films/. Zkontrolujte oprávnění složky na hostingu.');
    }

    return 'media/films/' . $filename;
}

// Maže pouze soubory vytvořené tímto formulářem, nikdy cizí ani vzdálené soubory.
function delete_old_upload(?string $path): void
{
    if (!$path || !str_starts_with($path, 'media/films/')) {
        return;
    }

    $filename = basename($path);
    if (!preg_match('/^(photo|idea_pdf|literary_pdf|technical_pdf)-[a-f0-9]{24}\.(jpg|png|webp|gif|pdf)$/', $filename)) {
        return;
    }

    $fullPath = __DIR__ . '/media/films/' . $filename;
    if (is_file($fullPath)) {
        unlink($fullPath);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();

    if (isset($_POST['logout'])) {
        $_SESSION = [];
        session_regenerate_id(true);
        header('Location: admin.php', true, 303);
        exit;
    }

    if (isset($_POST['login'])) {
        if (time() < ($_SESSION['login_wait'] ?? 0)) {
            $notice = 'Před dalším pokusem chvíli počkejte.';
        } elseif ($cfg['admin_hash'] && password_verify((string) ($_POST['password'] ?? ''), $cfg['admin_hash'])) {
            session_regenerate_id(true);
            $_SESSION['admin'] = true;
            $_SESSION['csrf'] = bin2hex(random_bytes(32));
            header('Location: admin.php', true, 303);
            exit;
        } else {
            $_SESSION['login_wait'] = time() + 5;
            $notice = 'Přihlášení se nezdařilo.';
        }
    }
}

if (empty($_SESSION['admin'])) {
    page_top('Přihlášení');
    echo '<h1>Produkční zázemí.</h1>';

    if (!$cfg['admin_hash']) {
        echo '<p>Správa ještě není nastavena. Postup najdete v souboru NAVOD.md.</p>';
    }
    if ($notice) {
        echo '<p role="alert">' . h($notice) . '</p>';
    }

    echo '<form method="post">' . csrf()
        . '<label>Heslo<input type="password" name="password" autocomplete="current-password" required></label>'
        . '<button name="login">Přihlásit se</button></form>';
    page_bottom();
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (isset($_POST['save_film'])) {
            $id = (int) ($_POST['id'] ?? 0);
            $title = trim((string) ($_POST['title'] ?? ''));
            $status = $_POST['status'] ?? '';

            if (!$title || strlen($title) > 160 || !in_array($status, ['in_progress', 'canceled', 'finished'], true)) {
                throw new InvalidArgumentException('Vyplňte název (max. 160 bajtů UTF-8) a stav.');
            }

            $youtube = trim((string) ($_POST['youtube'] ?? ''));
            if (strlen($youtube) > 500 || ($youtube !== '' && safe_url($youtube) === '')) {
                throw new InvalidArgumentException('Odkaz na YouTube musí být platná HTTP(S) adresa nebo relativní cesta bez mezer.');
            }

            $oldFilm = $id ? (rows('SELECT * FROM films WHERE id = ?', 'i', [$id])[0] ?? null) : null;
            if ($id && !$oldFilm) {
                throw new InvalidArgumentException('Film nebyl nalezen.');
            }

            // Bez nového souboru zůstane zachována dosavadní cesta.
            $files = [
                'photo_file' => ['column' => 'photo', 'type' => 'photo'],
                'idea_file' => ['column' => 'idea_pdf', 'type' => 'idea_pdf'],
                'literary_file' => ['column' => 'literary_pdf', 'type' => 'literary_pdf'],
                'technical_file' => ['column' => 'technical_pdf', 'type' => 'technical_pdf'],
            ];
            $paths = [];
            $newUploads = [];

            foreach ($files as $field => $settings) {
                $column = $settings['column'];
                $newPath = upload_film_file($field, $settings['type']);
                $paths[$column] = $newPath ?? ($oldFilm[$column] ?? '');
                if ($newPath !== null) {
                    $newUploads[$column] = $newPath;
                }
            }

            $values = [
                $title,
                trim((string) ($_POST['description'] ?? '')),
                $paths['photo'],
                $status,
                trim((string) ($_POST['notes'] ?? '')),
                $paths['idea_pdf'],
                $paths['literary_pdf'],
                $paths['technical_pdf'],
                safe_url($youtube),
            ];

            if ($id) {
                $values[] = $id;
                query(
                    'UPDATE films SET title=?, description=?, photo=?, status=?, notes=?, idea_pdf=?, literary_pdf=?, technical_pdf=?, youtube=? WHERE id=?',
                    'sssssssssi',
                    $values
                );
            } else {
                mysqli_begin_transaction(db());
                query(
                    'INSERT INTO films(title, description, photo, status, notes, idea_pdf, literary_pdf, technical_pdf, youtube) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    'sssssssss',
                    $values
                );
                $id = mysqli_insert_id(db());

                foreach (['Režisér', 'Kameraman', 'Zvukař', 'Runner', 'Herec / herečka'] as $name) {
                    query('INSERT INTO roles(film_id, name) VALUES (?, ?)', 'is', [$id, $name]);
                }
                mysqli_commit(db());
            }

            // Staré soubory odstraníme až poté, co se změna úspěšně uloží.
            foreach ($newUploads as $column => $newPath) {
                delete_old_upload($oldFilm[$column] ?? null);
            }

            header('Location: admin.php?edit=' . $id, true, 303);
            exit;
        }

        if (isset($_POST['save_role'])) {
            query(
                'UPDATE roles SET person=?, is_open=? WHERE id=?',
                'sii',
                [substr(trim((string) ($_POST['person'] ?? '')), 0, 160), isset($_POST['is_open']) ? 1 : 0, (int) $_POST['role_id']]
            );
            header('Location: admin.php?edit=' . (int) $_POST['film_id'], true, 303);
            exit;
        }

        if (isset($_POST['decision'])) {
            $app = (int) ($_POST['app_id'] ?? 0);
            $decision = $_POST['decision'];

            if ($decision === 'delete') {
                query('DELETE FROM applications WHERE id = ?', 'i', [$app]);
            } elseif (in_array($decision, ['accepted', 'rejected'], true)) {
                mysqli_begin_transaction(db());
                $application = rows('SELECT * FROM applications WHERE id = ? FOR UPDATE', 'i', [$app])[0] ?? null;

                if ($application && $application['state'] === 'pending') {
                    if ($decision === 'accepted') {
                        $role = rows('SELECT * FROM roles WHERE id = ? FOR UPDATE', 'i', [$application['role_id']])[0];
                        if (!$role['is_open']) {
                            throw new InvalidArgumentException('Pozice je již uzavřená.');
                        }

                        // Přijetí zavře pozici. Jméno zveřejněte až po domluvě ručně ve správě filmu.
                        query('UPDATE roles SET is_open = 0 WHERE id = ?', 'i', [$application['role_id']]);
                    }

                    query('UPDATE applications SET state = ? WHERE id = ?', 'si', [$decision, $app]);
                }
                mysqli_commit(db());
            }

            header('Location: admin.php', true, 303);
            exit;
        }
    }

    $films = rows('SELECT * FROM films ORDER BY id DESC');
    $edit = isset($_GET['edit']) ? (int) $_GET['edit'] : null;
    $film = $edit ? (rows('SELECT * FROM films WHERE id = ?', 'i', [$edit])[0] ?? null) : null;
    $apps = rows('SELECT a.*, r.name AS role_name, f.title FROM applications a JOIN roles r ON r.id = a.role_id JOIN films f ON f.id = r.film_id ORDER BY a.created_at DESC LIMIT 300');
} catch (InvalidArgumentException $e) {
    // Při chybě formuláře znovu načteme data, aby šel formulář opravit bez návratu na začátek.
    $notice = $e->getMessage();
    $films = rows('SELECT * FROM films ORDER BY id DESC');
    $edit = isset($_GET['edit']) ? (int) $_GET['edit'] : null;
    $film = $edit ? (rows('SELECT * FROM films WHERE id = ?', 'i', [$edit])[0] ?? null) : null;
    $apps = rows('SELECT a.*, r.name AS role_name, f.title FROM applications a JOIN roles r ON r.id = a.role_id JOIN films f ON f.id = r.film_id ORDER BY a.created_at DESC LIMIT 300');
} catch (Throwable $e) {
    error_log($e->getMessage());
    unavailable();
}

page_top('Správa');
?>
<h1>Produkční zázemí.</h1>
<nav class="admin-nav">
    <a href="admin.php">Přihlášky</a>
    <a href="admin.php?edit=0">Přidat film</a>
</nav>
<form method="post">
    <?= csrf() ?>
    <button name="logout">Odhlásit</button>
</form>

<?php if ($notice): ?>
    <p role="alert"><?= h($notice) ?></p>
<?php endif ?>

<h2>Filmy</h2>
<?php foreach ($films as $f): ?>
    <p>
        <a href="admin.php?edit=<?= $f['id'] ?>"><?= h($f['title']) ?></a>
        · <a href="film.php?id=<?= $f['id'] ?>">Zobrazit ↗</a>
    </p>
<?php endforeach ?>

<?php if ($edit !== null):
    $film = $film ?? array_fill_keys([
        'title', 'description', 'photo', 'notes', 'idea_pdf', 'literary_pdf', 'technical_pdf', 'youtube', 'status'
    ], '');
?>
    <h2><?= $edit ? 'Upravit film' : 'Nový film' ?></h2>
    <form method="post" enctype="multipart/form-data">
        <?= csrf() ?>
        <input type="hidden" name="id" value="<?= $edit ?>">

        <label>Název
            <input name="title" value="<?= h($film['title']) ?>" maxlength="160" required>
        </label>

        <label>Fotografie (JPG, PNG, WEBP nebo GIF, max. 10 MB)
            <input type="file" name="photo_file" accept="image/jpeg,image/png,image/webp,image/gif">
        </label>
        <?php if ($film['photo']): ?>
            <p>Aktuální fotografie: <a href="<?= h($film['photo']) ?>" target="_blank" rel="noopener noreferrer">Zobrazit soubor ↗</a></p>
        <?php endif ?>

        <label>Odkaz na YouTube
            <input name="youtube" value="<?= h($film['youtube']) ?>" maxlength="500">
        </label>

        <label>Námět (PDF, max. 25 MB)
            <input type="file" name="idea_file" accept="application/pdf">
        </label>
        <?php if ($film['idea_pdf']): ?>
            <p>Aktuální námět: <a href="<?= h($film['idea_pdf']) ?>" target="_blank" rel="noopener noreferrer">Zobrazit PDF ↗</a></p>
        <?php endif ?>

        <label>Literární scénář (PDF, max. 25 MB)
            <input type="file" name="literary_file" accept="application/pdf">
        </label>
        <?php if ($film['literary_pdf']): ?>
            <p>Aktuální literární scénář: <a href="<?= h($film['literary_pdf']) ?>" target="_blank" rel="noopener noreferrer">Zobrazit PDF ↗</a></p>
        <?php endif ?>

        <label>Technický scénář (PDF, max. 25 MB)
            <input type="file" name="technical_file" accept="application/pdf">
        </label>
        <?php if ($film['technical_pdf']): ?>
            <p>Aktuální technický scénář: <a href="<?= h($film['technical_pdf']) ?>" target="_blank" rel="noopener noreferrer">Zobrazit PDF ↗</a></p>
        <?php endif ?>

        <label>Stav
            <select name="status">
                <?php foreach (['in_progress', 'canceled', 'finished'] as $status): ?>
                    <option value="<?= $status ?>" <?= ($film['status'] ?? 'in_progress') === $status ? 'selected' : '' ?>>
                        <?= h(status_label($status)) ?>
                    </option>
                <?php endforeach ?>
            </select>
        </label>

        <label class="full">Popis
            <textarea name="description" rows="5"><?= h($film['description']) ?></textarea>
        </label>
        <label class="full">Veřejné poznámky
            <textarea name="notes" rows="5"><?= h($film['notes']) ?></textarea>
        </label>

        <button name="save_film">Uložit film</button>
    </form>

    <?php if ($edit): ?>
        <h2>Obsazení pozic</h2>
        <?php foreach (rows('SELECT * FROM roles WHERE film_id = ?', 'i', [$edit]) as $role): ?>
            <form method="post">
                <?= csrf() ?>
                <input type="hidden" name="role_id" value="<?= $role['id'] ?>">
                <input type="hidden" name="film_id" value="<?= $edit ?>">

                <label><?= h($role['name']) ?> — veřejné jméno
                    <input name="person" maxlength="160" value="<?= h($role['person']) ?>">
                </label>
                <label>
                    <input type="checkbox" name="is_open" <?= $role['is_open'] ? 'checked' : '' ?>>
                    Přijímat přihlášky
                </label>
                <button name="save_role">Uložit pozici</button>
            </form>
        <?php endforeach ?>
    <?php endif ?>
<?php else: ?>
    <h2>Přihlášky</h2>
    <p>Zobrazuje se nejnovějších 300 přihlášek. Schválení uzavře pozici; veřejné jméno doplňte po domluvě ve filmu.</p>

    <?php foreach ($apps as $application): ?>
        <section class="admin-row">
            <span class="eyebrow"><?= h($application['state']) ?> · <?= h($application['created_at']) ?></span>
            <h3><?= h($application['title']) ?> / <?= h($application['role_name']) ?></h3>
            <p><?= h($application['name']) ?> · <a href="mailto:<?= h($application['email']) ?>"><?= h($application['email']) ?></a></p>
            <p><?= nl2br(h($application['message'])) ?></p>

            <form method="post">
                <?= csrf() ?>
                <input type="hidden" name="app_id" value="<?= $application['id'] ?>">
                <?php if ($application['state'] === 'pending'): ?>
                    <button name="decision" value="accepted">Schválit</button>
                    <button name="decision" value="rejected">Odmítnout</button>
                <?php endif ?>
                <button name="decision" value="delete">Smazat osobní údaje přihlášky</button>
            </form>
        </section>
    <?php endforeach ?>
<?php endif ?>
<?php page_bottom(); ?>
