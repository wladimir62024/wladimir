<?php
require_once __DIR__ . '/../config/database.php';

$data = json_decode(file_get_contents('php://input'), true);

$user_id = intval($data['user_id'] ?? 0);
$organization_id = !empty($data['organization_id']) ? intval($data['organization_id']) : null;
$company = trim($data['company'] ?? '');
$location = trim($data['location'] ?? '');
$course = trim($data['course'] ?? '');
$start_date = $data['start_date'] ?? '';
$end_date = $data['end_date'] ?? '';
$room_id = !empty($data['room_id']) ? intval($data['room_id']) : null;

if (!$user_id || !$company || !$location || !$course || !$start_date || !$end_date) {
    echo json_encode(['success' => false, 'message' => 'Please fill in all fields of the form.']);
    exit;
}
if (strtotime($end_date) < strtotime($start_date)) {
    echo json_encode(['success' => false, 'message' => 'The end date cannot be before the start date.']);
    exit;
}

try {
    // A student may only have one active (pending/approved) application at a time
    $check = $pdo->prepare("SELECT id FROM applications WHERE user_id = ? AND status IN ('pending','approved')");
    $check->execute([$user_id]);
    if ($check->fetch()) {
        echo json_encode(['success' => false, 'message' => 'You already have an active application. Check your status page.']);
        exit;
    }

    // A room can only be attached if the student has already booked it themselves
    // (booking happens on the Accommodation page — see book_room.php)
    if ($room_id) {
        $roomCheck = $pdo->prepare("SELECT id, status, booked_by FROM accommodation_rooms WHERE id = ?");
        $roomCheck->execute([$room_id]);
        $room = $roomCheck->fetch();
        if (!$room || $room['status'] !== 'booked' || intval($room['booked_by']) !== $user_id) {
            echo json_encode(['success' => false, 'message' => 'Please book a room on the Accommodation page first, then attach it to your application.']);
            exit;
        }
    }

    $stmt = $pdo->prepare("INSERT INTO applications
        (user_id, organization_id, company, location, course, start_date, end_date, room_id, status, is_locked)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 1)");
    $stmt->execute([$user_id, $organization_id, $company, $location, $course, $start_date, $end_date, $room_id]);

    echo json_encode(['success' => true, 'message' => 'Application submitted. Please wait for the admin\'s response.']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
