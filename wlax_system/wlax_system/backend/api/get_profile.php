<?php
require_once __DIR__ . '/../config/database.php';

$user_id = intval($_GET['user_id'] ?? 0);
if (!$user_id) {
    echo json_encode(['success' => false, 'message' => 'user_id is required.']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, name, email, phone, role, profile_picture, created_at FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();

    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'User not found.']);
        exit;
    }

    echo json_encode(['success' => true, 'user' => $user]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
