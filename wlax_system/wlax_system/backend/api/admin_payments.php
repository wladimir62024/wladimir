<?php
require_once __DIR__ . '/../config/database.php';

// Admin-only listing of ALL payments from ALL students, for verification.
try {
    $stmt = $pdo->query("
        SELECT p.*, u.name AS student_name, u.email AS student_email,
               a.company AS application_company,
               v.name AS verified_by_name
        FROM payments p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN applications a ON p.application_id = a.id
        LEFT JOIN users v ON p.verified_by = v.id
        ORDER BY p.created_at DESC
    ");
    echo json_encode(['success' => true, 'payments' => $stmt->fetchAll()]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
