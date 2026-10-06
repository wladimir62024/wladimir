<?php
require_once __DIR__ . '/../config/database.php';

/**
 * Handles a profile picture upload (multipart/form-data, NOT JSON).
 * Expected fields: user_id (text), profile_picture (file).
 * Replaces the user's previous picture file, if any.
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

$user_id = intval($_POST['user_id'] ?? 0);

if (!$user_id) {
    echo json_encode(['success' => false, 'message' => 'user_id is required.']);
    exit;
}

if (!isset($_FILES['profile_picture']) || $_FILES['profile_picture']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'message' => 'Please choose an image to upload.']);
    exit;
}

$file = $_FILES['profile_picture'];

$allowedTypes = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif', 'image/webp' => 'webp'];
$mime = mime_content_type($file['tmp_name']);

if (!isset($allowedTypes[$mime])) {
    echo json_encode(['success' => false, 'message' => 'Only JPG, PNG, GIF or WEBP images are allowed.']);
    exit;
}

$maxBytes = 2 * 1024 * 1024; // 2MB
if ($file['size'] > $maxBytes) {
    echo json_encode(['success' => false, 'message' => 'Image must be smaller than 2MB.']);
    exit;
}

try {
    $uploadsDir = __DIR__ . '/../uploads/profile_pictures/';
    if (!is_dir($uploadsDir)) {
        mkdir($uploadsDir, 0775, true);
    }

    // Remove the user's previous picture file, if one exists
    $check = $pdo->prepare("SELECT profile_picture FROM users WHERE id = ?");
    $check->execute([$user_id]);
    $existing = $check->fetch();
    if ($existing && $existing['profile_picture']) {
        $oldPath = $uploadsDir . $existing['profile_picture'];
        if (is_file($oldPath)) {
            @unlink($oldPath);
        }
    }

    $ext = $allowedTypes[$mime];
    $filename = 'user_' . $user_id . '_' . time() . '.' . $ext;
    $destination = $uploadsDir . $filename;

    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        echo json_encode(['success' => false, 'message' => 'Could not save the uploaded image.']);
        exit;
    }

    $update = $pdo->prepare("UPDATE users SET profile_picture = ? WHERE id = ?");
    $update->execute([$filename, $user_id]);

    $get = $pdo->prepare("SELECT id, name, email, phone, role, profile_picture FROM users WHERE id = ?");
    $get->execute([$user_id]);

    echo json_encode(['success' => true, 'message' => 'Profile picture updated.', 'user' => $get->fetch()]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
