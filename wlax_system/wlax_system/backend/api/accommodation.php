<?php
require_once __DIR__ . '/../config/database.php';

/**
 * Accommodations are HOTELS/LODGES (buildings), each containing many
 * individually bookable rooms (see accommodation_rooms / rooms.php,
 * book_room.php). This endpoint lists hotels/lodges with their rooms
 * nested inside, and lets an admin create a new hotel/lodge (optionally
 * generating its first batch of rooms at the same time).
 */

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $accommodations = $pdo->query("SELECT * FROM accommodations ORDER BY name ASC")->fetchAll();

        $rooms = $pdo->query("
            SELECT r.*, u.name AS booked_by_name
            FROM accommodation_rooms r
            LEFT JOIN users u ON r.booked_by = u.id
            ORDER BY r.room_number ASC
        ")->fetchAll();

        // Group rooms under their accommodation (hotel/lodge)
        $roomsByAccommodation = [];
        foreach ($rooms as $r) {
            $roomsByAccommodation[$r['accommodation_id']][] = $r;
        }

        foreach ($accommodations as &$a) {
            $a['rooms'] = $roomsByAccommodation[$a['id']] ?? [];
            $a['total_rooms'] = count($a['rooms']);
            $a['available_rooms'] = count(array_filter($a['rooms'], fn($r) => $r['status'] === 'available'));
            $a['booked_rooms'] = $a['total_rooms'] - $a['available_rooms'];
        }
        unset($a);

        echo json_encode(['success' => true, 'accommodations' => $accommodations]);
        exit;
    }

    if ($method === 'POST') {
        // Admin creates a new hotel/lodge, optionally generating its first rooms right away
        $data = json_decode(file_get_contents('php://input'), true);
        $name = trim($data['name'] ?? '');
        $location = trim($data['location'] ?? '');
        $description = trim($data['description'] ?? '');
        $contact_phone = trim($data['contact_phone'] ?? '');
        $default_price_per_month = floatval($data['default_price_per_month'] ?? 0);
        $default_capacity = intval($data['default_capacity'] ?? 1);
        $initial_rooms = max(0, intval($data['initial_rooms'] ?? 0));

        if (!$name || !$location) {
            echo json_encode(['success' => false, 'message' => 'Please fill in the name and location.']);
            exit;
        }

        $pdo->beginTransaction();

        $stmt = $pdo->prepare("INSERT INTO accommodations (name, location, description, contact_phone, default_price_per_month, default_capacity) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$name, $location, $description, $contact_phone, $default_price_per_month, $default_capacity]);
        $accommodationId = $pdo->lastInsertId();

        if ($initial_rooms > 0) {
            $roomStmt = $pdo->prepare("INSERT INTO accommodation_rooms (accommodation_id, room_number, price_per_month, capacity, status) VALUES (?, ?, ?, ?, 'available')");
            for ($i = 1; $i <= $initial_rooms; $i++) {
                $roomStmt->execute([$accommodationId, "Room {$i}", $default_price_per_month, $default_capacity]);
            }
        }

        $pdo->commit();

        echo json_encode(['success' => true, 'message' => 'Accommodation added' . ($initial_rooms > 0 ? " with {$initial_rooms} room(s)." : '.')]);
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
