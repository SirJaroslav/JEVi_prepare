<?php
require __DIR__ . '/includes/films_boot.php';

$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT) ?: 0;

try {
    $film = rows('SELECT * FROM films WHERE id = ?', 'i', [$id])[0] ?? null;
    $roles = rows('SELECT * FROM roles WHERE film_id = ? ORDER BY id', 'i', [$id]);
} catch (Throwable $e) {
    error_log($e->getMessage());
    unavailable();
}

if (!$film) {
    http_response_code(404);
    page_top('Nenalezeno');
    echo '<h1>Tento film tu není.</h1>';
    page_bottom();
    exit;
}

$error = '';
$success = $_SESSION['film_success'][$id] ?? false;
unset($_SESSION['film_success'][$id]);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();

    $name = trim((string) ($_POST['name'] ?? ''));
    $email = trim((string) ($_POST['email'] ?? ''));
    $message = trim((string) ($_POST['message'] ?? ''));
    $role = (int) ($_POST['role'] ?? 0);

    if (!empty($_POST['website'])) {
        $error = 'Formulář se nepodařilo odeslat.';
    } elseif (!$name || strlen($name) > 160 || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254 || !$message || strlen($message) > 4000) {
        $error = 'Vyplňte jméno, platný e-mail a krátký text (nejvýše 4 000 znaků).';
    } elseif (time() - ($_SESSION['last_application'] ?? 0) < 60) {
        $error = 'Další přihlášku můžete poslat za minutu.';
    } else {
        try {
            mysqli_begin_transaction(db());

            $openRole = rows(
                "SELECT r.id FROM roles r JOIN films f ON f.id = r.film_id WHERE r.id = ? AND r.film_id = ? AND r.is_open = 1 AND f.status = 'in_progress' FOR UPDATE",
                'ii',
                [$role, $id]
            );

            if (!$openRole) {
                mysqli_rollback(db());
                $error = 'Tato pozice už není otevřená.';
            } else {
                query(
                    'INSERT INTO applications(role_id, name, email, message) VALUES (?, ?, ?, ?)',
                    'isss',
                    [$role, $name, $email, $message]
                );
                mysqli_commit(db());

                $_SESSION['last_application'] = time();
                $_SESSION['film_success'][$id] = true;
                header('Location: film.php?id=' . $id . '#prihlaska', true, 303);
                exit;
            }
        } catch (Throwable $e) {
            mysqli_rollback(db());
            error_log($e->getMessage());
            $error = 'Odeslání se nezdařilo. Zkuste to prosím později.';
        }
    }
}

$openRoles = array_filter($roles, fn ($role) => $role['is_open']);
page_top($film['title']);
?>
<a href="films.php">← Všechny filmy</a>
<p class="eyebrow">FILMOVÝ PROJEKT</p>
<span class="status <?= h($film['status']) ?>"><i></i><?= h(status_label($film['status'])) ?></span>

<h1><?= h($film['title']) ?></h1>
<p class="intro"><?= nl2br(h($film['description'])) ?></p>

<div class="bento">
    <section class="hero-photo visual">
        <?php if (safe_url($film['photo'])): ?>
            <img src="<?= h(safe_url($film['photo'])) ?>" alt="<?= h($film['title']) ?>">
        <?php else: ?>
            <span>Obraz tohoto příběhu teprve vzniká.</span>
        <?php endif ?>
    </section>

    <section class="crew">
        <p class="eyebrow">LIDÉ ZA PŘÍBĚHEM</p>
        <h2>Filmový tým.</h2>
        <div class="roles">
            <?php foreach ($roles as $role): ?>
                <div>
                    <h3><?= h($role['name']) ?></h3>
                    <p><?= h($role['person'] ?: ($role['is_open'] ? 'Volné místo' : 'Pozice uzavřena')) ?></p>
                </div>
            <?php endforeach ?>
        </div>
    </section>

    <section class="notes">
        <p class="eyebrow">Z PRODUKCE</p>
        <h2>Poznámky.</h2>
        <p><?= nl2br(h($film['notes'])) ?></p>
    </section>

    <section class="documents">
        <p class="eyebrow">OD MYŠLENKY K OBRAZU</p>
        <h2>Podklady.</h2>
        <?php foreach (['idea_pdf' => 'Námět', 'literary_pdf' => 'Literární scénář', 'technical_pdf' => 'Technický scénář'] as $key => $label): ?>
            <p>
                <?php if (safe_url($film[$key])): ?>
                    <a href="<?= h(safe_url($film[$key])) ?>" target="_blank" rel="noopener noreferrer"><?= h($label) ?> · PDF ↗</a>
                <?php else: ?>
                    <?= h($label) ?> — připravujeme
                <?php endif ?>
            </p>
        <?php endforeach ?>
    </section>

    <section>
        <p class="eyebrow">NA PLÁTNĚ</p>
        <h2>Pusťte si film.</h2>
        <?php if (safe_url($film['youtube'])): ?>
            <a href="<?= h(safe_url($film['youtube'])) ?>" target="_blank" rel="noopener noreferrer">Přejít na YouTube ↗</a>
        <?php else: ?>
            <p>Premiéra je ještě před námi.</p>
        <?php endif ?>
    </section>
</div>

<section id="prihlaska" class="application">
    <p class="eyebrow">BUĎTE SOUČÁSTÍ</p>
    <h2>Vaše místo v příběhu.</h2>

    <?php if ($success): ?>
        <p role="status">Děkujeme. Přihlášku jsme uložili. Tým ji posoudí a případně vás kontaktuje.</p>
    <?php endif ?>

    <?php if ($error): ?>
        <p role="alert"><?= h($error) ?></p>
    <?php endif ?>

    <?php if ($openRoles && $film['status'] === 'in_progress'): ?>
        <form method="post" action="film.php?id=<?= $id ?>#prihlaska">
            <?= csrf() ?>

            <label>Pozice
                <select name="role" required>
                    <?php foreach ($openRoles as $role): ?>
                        <option value="<?= $role['id'] ?>" <?= ((int) ($_POST['role'] ?? 0) === $role['id']) ? 'selected' : '' ?>>
                            <?= h($role['name']) ?>
                        </option>
                    <?php endforeach ?>
                </select>
            </label>

            <label>Jméno
                <input name="name" required maxlength="160" autocomplete="name" value="<?= h($_POST['name'] ?? '') ?>">
            </label>
            <label>E-mail
                <input type="email" name="email" required maxlength="254" autocomplete="email" value="<?= h($_POST['email'] ?? '') ?>">
            </label>
            <label class="full">Něco o vás
                <textarea name="message" required maxlength="4000" rows="4"><?= h($_POST['message'] ?? '') ?></textarea>
            </label>
            <label class="trap" aria-hidden="true">Web
                <input name="website" tabindex="-1" autocomplete="off">
            </label>

            <p class="full">Údaje se zobrazí pouze týmu JEVi pro vyřízení vaší přihlášky. Jméno zveřejníme v týmu až po domluvě s vámi.</p>
            <button>Odeslat přihlášku ↗</button>
        </form>
    <?php else: ?>
        <p>V tuto chvíli nepřijímáme přihlášky.</p>
    <?php endif ?>
</section>
<?php page_bottom(); ?>
