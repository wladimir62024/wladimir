<?php
require_once __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $user_id = intval($_GET['user_id'] ?? 0);
        if (!$user_id) {
            echo json_encode(['success' => false, 'message' => 'user_id is required.']);
            exit;
        }
        $stmt = $pdo->prepare("SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$user_id]);
        echo json_encode(['success' => true, 'payments' => $stmt->fetchAll()]);
        exit;
    }

    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $user_id = intval($data['user_id'] ?? 0);
        $application_id = !empty($data['application_id']) ? intval($data['application_id']) : null;
        $amount = floatval($data['amount'] ?? 0);
        $method_type = $data['method'] ?? '';
        $reference_code = trim($data['reference_code'] ?? '');

        $allowed_methods = ['Mpesa', 'Tigo Pesa', 'Airtel Money', 'Bank Transfer', 'Cash'];
        if (!$user_id || $amount <= 0 || !in_array($method_type, $allowed_methods) || !$reference_code) {
            echo json_encode(['success' => false, 'message' => 'Please fill in all payment details correctly.']);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO payments (user_id, application_id, amount, method, reference_code, status) VALUES (?, ?, ?, ?, ?, 'pending')");
        $stmt->execute([$user_id, $application_id, $amount, $method_type, $reference_code]);

        echo json_encode(['success' => true, 'message' => 'Payment submitted, awaiting confirmation.']);
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
