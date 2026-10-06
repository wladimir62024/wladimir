<?php
require_once __DIR__ . '/../config/database.php';

$data = json_decode(file_get_contents('php://input'), true);
$email = trim(strtolower($data['email'] ?? ''));
$password = $data['password'] ?? '';

if (!$email || !$password) {
    echo json_encode(['success' => false, 'message' => 'Please fill in your email and password.']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, name, email, phone, password, role, profile_picture FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        echo json_encode(['success' => false, 'message' => 'Incorrect email or password.']);
        exit;
    }

    unset($user['password']);
    echo json_encode(['success' => true, 'message' => 'Login successful.', 'user' => $user]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
