<?php
require_once __DIR__ . '/../config/database.php';

/**
 * Room booking endpoint (one room inside a hotel/lodge).
 * - action "book": student books a specific room ONLY if it is currently
 *   'available'. A room already booked by another student cannot be booked
 *   again — but a DIFFERENT room at the SAME hotel/lodge can still be booked
 *   by someone else, since each room is tracked independently.
 * - action "cancel": student cancels their OWN booking, freeing that room.
 */

$data = json_decode(file_get_contents('php://input'), true);

$action = $data['action'] ?? 'book';
$user_id = intval($data['user_id'] ?? 0);
$room_id = intval($data['room_id'] ?? 0);

if (!$user_id || !$room_id) {
    echo json_encode(['success' => false, 'message' => 'user_id and room_id are required.']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Lock the row for update to avoid two students booking the same room at once
    $stmt = $pdo->prepare("SELECT id, status, booked_by FROM accommodation_rooms WHERE id = ? FOR UPDATE");
    $stmt->execute([$room_id]);
    $room = $stmt->fetch();

    if (!$room) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'Room not found.']);
        exit;
    }

    if ($action === 'cancel') {
        if (intval($room['booked_by']) !== $user_id) {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'message' => 'You can only cancel a room that you booked yourself.']);
            exit;
        }
        $update = $pdo->prepare("UPDATE accommodation_rooms SET status = 'available', booked_by = NULL, booked_at = NULL WHERE id = ?");
        $update->execute([$room_id]);
        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Your booking has been cancelled. This room is now available again.']);
        exit;
    }

    // Default action: book
    if ($room['status'] === 'booked') {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'This room has already been booked by someone else. Please choose another available room.']);
        exit;
    }

    $update = $pdo->prepare("UPDATE accommodation_rooms SET status = 'booked', booked_by = ?, booked_at = NOW() WHERE id = ?");
    $update->execute([$user_id, $room_id]);
    $pdo->commit();

    echo json_encode(['success' => true, 'message' => 'Room booked successfully.']);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
