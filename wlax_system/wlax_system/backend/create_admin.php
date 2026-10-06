<?php
// Run this file ONCE in the browser to create the default admin account, then DELETE it.
require_once __DIR__ . '/config/database.php';

$name = 'System Admin';
$email = 'admin@wladimir.com';
$password = password_hash('admin321', PASSWORD_DEFAULT);

try {
    $check = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $check->execute([$email]);
    if ($check->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Admin account already exists.']);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, 'admin')");
    $stmt->execute([$name, $email, '0700000000', $password]);

    echo json_encode([
        'success' => true,
        'message' => 'Admin account created. Email: admin@system.com / Password: admin123. Please delete this file now.'
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
