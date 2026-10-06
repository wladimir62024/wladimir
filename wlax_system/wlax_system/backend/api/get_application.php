<?php
require_once __DIR__ . '/../config/database.php';

$user_id = intval($_GET['user_id'] ?? 0);
if (!$user_id) {
    echo json_encode(['success' => false, 'message' => 'user_id is required.']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT a.*, o.name AS organization_name,
               r.room_number, acc.name AS accommodation_name
        FROM applications a
        LEFT JOIN organizations o ON a.organization_id = o.id
        LEFT JOIN accommodation_rooms r ON a.room_id = r.id
        LEFT JOIN accommodations acc ON r.accommodation_id = acc.id
        WHERE a.user_id = ?
        ORDER BY a.created_at DESC
    ");
    $stmt->execute([$user_id]);
    $applications = $stmt->fetchAll();

    // is_locked = 0 means the admin has responded and unlocked editing for the student
    echo json_encode(['success' => true, 'applications' => $applications]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
