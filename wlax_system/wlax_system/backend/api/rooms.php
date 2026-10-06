<?php
require_once __DIR__ . '/../config/database.php';

/**
 * Admin-only: add another room to an existing hotel/lodge (accommodation).
 * Listing rooms is already handled by accommodation.php (nested under each
 * accommodation), so this endpoint only needs to support adding new ones.
 */

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $accommodation_id = intval($data['accommodation_id'] ?? 0);
        $room_number = trim($data['room_number'] ?? '');
        $price_per_month = isset($data['price_per_month']) && $data['price_per_month'] !== ''
            ? floatval($data['price_per_month']) : null;
        $capacity = isset($data['capacity']) && $data['capacity'] !== ''
            ? intval($data['capacity']) : null;

        if (!$accommodation_id || !$room_number) {
            echo json_encode(['success' => false, 'message' => 'Please choose the accommodation and enter a room number.']);
            exit;
        }

        $check = $pdo->prepare("SELECT id FROM accommodations WHERE id = ?");
        $check->execute([$accommodation_id]);
        if (!$check->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Accommodation not found.']);
            exit;
        }

        $dupe = $pdo->prepare("SELECT id FROM accommodation_rooms WHERE accommodation_id = ? AND room_number = ?");
        $dupe->execute([$accommodation_id, $room_number]);
        if ($dupe->fetch()) {
            echo json_encode(['success' => false, 'message' => 'This accommodation already has a room with that number.']);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO accommodation_rooms (accommodation_id, room_number, price_per_month, capacity, status) VALUES (?, ?, ?, ?, 'available')");
        $stmt->execute([$accommodation_id, $room_number, $price_per_month, $capacity]);

        echo json_encode(['success' => true, 'message' => "Room '{$room_number}' added and is now available for booking."]);
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
