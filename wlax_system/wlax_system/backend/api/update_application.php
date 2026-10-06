<?php
require_once __DIR__ . '/../config/database.php';

$data = json_decode(file_get_contents('php://input'), true);

$application_id = intval($data['application_id'] ?? 0);
$user_id = intval($data['user_id'] ?? 0);
$company = trim($data['company'] ?? '');
$location = trim($data['location'] ?? '');
$course = trim($data['course'] ?? '');
$start_date = $data['start_date'] ?? '';
$end_date = $data['end_date'] ?? '';

// organization_id / room_id are OPTIONAL on edit. If the key isn't sent at
// all, we keep whatever the application already had instead of wiping it.
$organization_id_provided = array_key_exists('organization_id', $data);
$room_id_provided = array_key_exists('room_id', $data);
$organization_id = !empty($data['organization_id']) ? intval($data['organization_id']) : null;
$room_id = !empty($data['room_id']) ? intval($data['room_id']) : null;

if (!$application_id || !$user_id || !$company || !$location || !$course || !$start_date || !$end_date) {
    echo json_encode(['success' => false, 'message' => 'Please fill in all fields.']);
    exit;
}

try {
    // Verify ownership and that the application is unlocked (admin has already responded)
    $stmt = $pdo->prepare("SELECT is_locked, status, organization_id, room_id FROM applications WHERE id = ? AND user_id = ?");
    $stmt->execute([$application_id, $user_id]);
    $app = $stmt->fetch();

    if (!$app) {
        echo json_encode(['success' => false, 'message' => 'Application not found.']);
        exit;
    }
    if (intval($app['is_locked']) === 1) {
        echo json_encode(['success' => false, 'message' => 'You cannot edit this application until the admin has responded.']);
        exit;
    }

    $finalOrganizationId = $organization_id_provided ? $organization_id : $app['organization_id'];

    // If a new room is being attached, it must be a room the student has booked themselves
    if ($room_id_provided && $room_id) {
        $roomCheck = $pdo->prepare("SELECT id, status, booked_by FROM accommodation_rooms WHERE id = ?");
        $roomCheck->execute([$room_id]);
        $room = $roomCheck->fetch();
        if (!$room || $room['status'] !== 'booked' || intval($room['booked_by']) !== $user_id) {
            echo json_encode(['success' => false, 'message' => 'Please book that room on the Accommodation page first, then attach it here.']);
            exit;
        }
    }
    $finalRoomId = $room_id_provided ? $room_id : $app['room_id'];

    // Editing re-submits the application for a fresh admin review:
    // status resets to pending, admin_message clears, and it locks again until the next response.
    $update = $pdo->prepare("
        UPDATE applications SET
            organization_id = ?, company = ?, location = ?, course = ?,
            start_date = ?, end_date = ?, room_id = ?,
            status = 'pending', admin_message = NULL, is_locked = 1
        WHERE id = ? AND user_id = ?
    ");
    $update->execute([$finalOrganizationId, $company, $location, $course, $start_date, $end_date, $finalRoomId, $application_id, $user_id]);

    echo json_encode(['success' => true, 'message' => 'Your application has been updated and resubmitted to the admin for review.']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
