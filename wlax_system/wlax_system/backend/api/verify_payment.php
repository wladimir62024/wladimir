<?php
require_once __DIR__ . '/../config/database.php';

/**
 * ADMIN ONLY: confirm or reject a student's payment.
 * Students never call this endpoint from the UI — their payment always
 * starts as 'pending' and only an admin can move it to 'confirmed' or 'rejected'.
 */

$data = json_decode(file_get_contents('php://input'), true);

$payment_id = intval($data['payment_id'] ?? 0);
$status = $data['status'] ?? '';
$admin_id = intval($data['admin_id'] ?? 0); // id of the logged-in admin performing the verification

if (!$payment_id || !in_array($status, ['confirmed', 'rejected']) || !$admin_id) {
    echo json_encode(['success' => false, 'message' => 'Invalid data.']);
    exit;
}

try {
    // Confirm the acting user really is an admin before allowing the change
    $check = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $check->execute([$admin_id]);
    $actor = $check->fetch();

    if (!$actor || $actor['role'] !== 'admin') {
        echo json_encode(['success' => false, 'message' => 'Only an admin can verify payments.']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE payments SET status = ?, verified_by = ?, verified_at = NOW() WHERE id = ?");
    $stmt->execute([$status, $admin_id, $payment_id]);

    echo json_encode(['success' => true, 'message' => 'Payment status updated.']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
