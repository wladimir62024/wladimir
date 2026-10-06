<?php
require_once __DIR__ . '/../config/database.php';

$data = json_decode(file_get_contents('php://input'), true);

$user_id = intval($data['user_id'] ?? 0);
$name = trim($data['name'] ?? '');
$phone = trim($data['phone'] ?? '');
$new_password = $data['new_password'] ?? '';

if (!$user_id || !$name) {
    echo json_encode(['success' => false, 'message' => 'Please enter your name.']);
    exit;
}

try {
    if ($new_password !== '') {
        if (strlen($new_password) < 6) {
            echo json_encode(['success' => false, 'message' => 'The new password must be at least 6 characters.']);
            exit;
        }
        $hash = password_hash($new_password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE users SET name = ?, phone = ?, password = ? WHERE id = ?");
        $stmt->execute([$name, $phone, $hash, $user_id]);
    } else {
        $stmt = $pdo->prepare("UPDATE users SET name = ?, phone = ? WHERE id = ?");
        $stmt->execute([$name, $phone, $user_id]);
    }

    $get = $pdo->prepare("SELECT id, name, email, phone, role, profile_picture FROM users WHERE id = ?");
    $get->execute([$user_id]);

    echo json_encode(['success' => true, 'message' => 'Your details have been updated.', 'user' => $get->fetch()]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
