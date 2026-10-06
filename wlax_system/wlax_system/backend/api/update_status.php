<?php
require_once __DIR__ . '/../config/database.php';

$data = json_decode(file_get_contents('php://input'), true);

$application_id = intval($data['application_id'] ?? 0);
$status = $data['status'] ?? '';
$admin_message = trim($data['admin_message'] ?? '');

if (!$application_id || !in_array($status, ['approved', 'rejected'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid data.']);
    exit;
}

try {
    // is_locked = 0 -> the admin has now responded, so the student is allowed to edit their details
    $stmt = $pdo->prepare("UPDATE applications SET status = ?, admin_message = ?, is_locked = 0 WHERE id = ?");
    $stmt->execute([$status, $admin_message, $application_id]);

    echo json_encode(['success' => true, 'message' => 'Application status updated.']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
