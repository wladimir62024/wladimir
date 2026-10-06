<?php
require_once __DIR__ . '/../config/database.php';

try {
    $stmt = $pdo->query("
        SELECT a.*, u.name AS student_name, u.email AS student_email, u.phone AS student_phone,
               o.name AS organization_name,
               r.room_number, acc.name AS accommodation_name
        FROM applications a
        JOIN users u ON a.user_id = u.id
        LEFT JOIN organizations o ON a.organization_id = o.id
        LEFT JOIN accommodation_rooms r ON a.room_id = r.id
        LEFT JOIN accommodations acc ON r.accommodation_id = acc.id
        ORDER BY a.created_at DESC
    ");
    $applications = $stmt->fetchAll();

    echo json_encode(['success' => true, 'applications' => $applications]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
