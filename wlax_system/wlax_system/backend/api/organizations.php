<?php
require_once __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT * FROM organizations ORDER BY name ASC");
        echo json_encode(['success' => true, 'organizations' => $stmt->fetchAll()]);
        exit;
    }

    if ($method === 'POST') {
        // Admin adds a new partner organization
        $data = json_decode(file_get_contents('php://input'), true);
        $name = trim($data['name'] ?? '');
        $location = trim($data['location'] ?? '');
        $sector = trim($data['sector'] ?? '');
        $description = trim($data['description'] ?? '');
        $contact_email = trim($data['contact_email'] ?? '');
        $contact_phone = trim($data['contact_phone'] ?? '');
        $slots_available = intval($data['slots_available'] ?? 0);

        if (!$name || !$location) {
            echo json_encode(['success' => false, 'message' => 'Please fill in the name and location.']);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO organizations (name, location, sector, description, contact_email, contact_phone, slots_available) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$name, $location, $sector, $description, $contact_email, $contact_phone, $slots_available]);

        echo json_encode(['success' => true, 'message' => 'Organization added.']);
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
