<?php
/**
 * GlobeMaster 2 - login.php
 * Processa login (POST action=login) e cadastro (POST action=cadastro).
 * Sessões em PHP puro com dados em JSON (pasta Dados).
 */

declare(strict_types=1);

session_start();

// ------------------------------------------------------------------
// Configuração
// ------------------------------------------------------------------
define('DATA_DIR', __DIR__ . '/../Dados');
define('USERS_FILE', DATA_DIR . '/usuarios.json');

// ------------------------------------------------------------------
// Utilitários
// ------------------------------------------------------------------
function respond(string $status, string $message, string $redirect = ''): void
{
    if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['status' => $status, 'message' => $message, 'redirect' => $redirect]);
        exit;
    }
    // Fallback sem JS: exibe alerta e volta
    $back = $redirect !== '' ? $redirect : ($_SERVER['HTTP_REFERER'] ?? 'index.html');
    $safeMessage = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
    echo "<!DOCTYPE html><html lang=\"pt-br\"><head><meta charset=\"UTF-8\">"
        . "<meta http-equiv=\"refresh\" content=\"3;url={$back}\">"
        . "<title>GlobeMaster 2</title></head><body>"
        . "<p>{$safeMessage}</p><p><a href=\"{$back}\">Voltar</a></p>"
        . "</body></html>";
    exit;
}

function getUsers(): array
{
    if (!is_dir(DATA_DIR)) {
        @mkdir(DATA_DIR, 0775, true);
    }
    if (!file_exists(USERS_FILE)) {
        @file_put_contents(USERS_FILE, json_encode([]), LOCK_EX);
        return [];
    }
    $content = file_get_contents(USERS_FILE);
    $users = json_decode($content, true);
    return is_array($users) ? $users : [];
}

function saveUsers(array $users): bool
{
    return file_put_contents(USERS_FILE, json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX) !== false;
}

function findUser(array $users, string $username, string $email = ''): ?array
{
    foreach ($users as $user) {
        if (strcasecmp((string)$user['username'], $username) === 0) {
            return $user;
        }
        if ($email !== '' && strcasecmp((string)($user['email'] ?? ''), $email) === 0) {
            return $user;
        }
    }
    return null;
}

// ------------------------------------------------------------------
// Só aceita POST
// ------------------------------------------------------------------
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Location: Login.html');
    exit;
}

$action = $_POST['action'] ?? 'login';

// ------------------------------------------------------------------
// LOGIN
// ------------------------------------------------------------------
if ($action === 'login') {
    $username = trim((string)($_POST['username'] ?? ''));
    $password = (string)($_POST['password'] ?? '');

    if ($username === '' || $password === '') {
        respond('error', 'Preencha usuário e senha.');
    }

    $users = getUsers();
    $user = findUser($users, $username);

    if ($user === null || !password_verify($password, (string)($user['password_hash'] ?? ''))) {
        respond('error', 'Usuário ou senha incorretos.');
    }

    session_regenerate_id(true);
    $_SESSION['user'] = [
        'username' => $user['username'],
        'email'    => $user['email'],
        'nome'     => $user['nome'] ?? $user['username'],
    ];

    respond('success', 'Login realizado com sucesso!', 'MeuPerfil.html');
}

// ------------------------------------------------------------------
// CADASTRO
// ------------------------------------------------------------------
if ($action === 'cadastro') {
    $nome     = trim((string)($_POST['nomeCompleto'] ?? ''));
    $email    = trim((string)($_POST['emailCadastro'] ?? ''));
    $username = trim((string)($_POST['usuarioCadastro'] ?? ''));
    $password = (string)($_POST['senhaCadastro'] ?? '');

    if ($nome === '' || $email === '' || $username === '' || $password === '') {
        respond('error', 'Preencha todos os campos do cadastro.');
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        respond('error', 'E-mail inválido.');
    }
    if (strlen($password) < 6) {
        respond('error', 'A senha deve ter no mínimo 6 caracteres.');
    }
    if (!preg_match('/^[A-Za-z0-9_.-]{3,30}$/', $username)) {
        respond('error', 'Usuário deve ter 3-30 caracteres (letras, números, ponto, hífen ou underline).');
    }

    $users = getUsers();

    if (findUser($users, $username, $email) !== null) {
        respond('error', 'Usuário ou e-mail já cadastrado.');
    }

    $users[] = [
        'nome'          => $nome,
        'email'         => $email,
        'username'      => $username,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        'created_at'    => date('c'),
    ];

    if (!saveUsers($users)) {
        respond('error', 'Não foi possível salvar o cadastro. Tente novamente.');
    }

    session_regenerate_id(true);
    $_SESSION['user'] = ['username' => $username, 'email' => $email, 'nome' => $nome];

    respond('success', 'Cadastro criado com sucesso! Bem-vindo(a).', 'MeuPerfil.html');
}

// Ação desconhecida
respond('error', 'Ação inválida.');
