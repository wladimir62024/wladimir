-- Student Field Application Management System
-- Full database schema (organizations, hotels/lodges with multiple rooms, payments, profile editing)

CREATE DATABASE IF NOT EXISTS field_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE field_system;

-- ============================
-- USERS
-- ============================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(30) DEFAULT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student','admin') NOT NULL DEFAULT 'student',
    profile_picture VARCHAR(255) DEFAULT NULL, -- filename only; served from backend/uploads/profile_pictures/
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================
-- ORGANIZATIONS (companies offering field/internship placements)
-- ============================
CREATE TABLE IF NOT EXISTS organizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    location VARCHAR(150) NOT NULL,
    sector VARCHAR(100) DEFAULT NULL,
    description TEXT,
    contact_email VARCHAR(150) DEFAULT NULL,
    contact_phone VARCHAR(30) DEFAULT NULL,
    slots_available INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================
-- ACCOMMODATIONS (a Hotel / Lodge / Hostel listing — the BUILDING, not a single room)
-- ============================
CREATE TABLE IF NOT EXISTS accommodations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    location VARCHAR(150) NOT NULL,
    description TEXT,
    contact_phone VARCHAR(30) DEFAULT NULL,
    default_price_per_month DECIMAL(10,2) NOT NULL DEFAULT 0, -- used as the room price unless a room overrides it
    default_capacity INT DEFAULT 1,                            -- used as the room capacity unless a room overrides it
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================
-- ACCOMMODATION ROOMS (each individual, bookable room inside a hotel/lodge)
-- One accommodation (hotel/lodge) can have MANY rooms. Each room is booked
-- independently, so many students can each book a DIFFERENT room at the
-- SAME hotel/lodge, but nobody can book a room someone else already holds.
-- ============================
CREATE TABLE IF NOT EXISTS accommodation_rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    accommodation_id INT NOT NULL,
    room_number VARCHAR(50) NOT NULL,        -- e.g. "Room 1", "A2", "101"
    price_per_month DECIMAL(10,2) DEFAULT NULL, -- NULL = inherit accommodations.default_price_per_month
    capacity INT DEFAULT NULL,                  -- NULL = inherit accommodations.default_capacity
    status ENUM('available','booked') NOT NULL DEFAULT 'available',
    booked_by INT DEFAULT NULL,
    booked_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_room_per_accommodation (accommodation_id, room_number),
    FOREIGN KEY (accommodation_id) REFERENCES accommodations(id) ON DELETE CASCADE,
    FOREIGN KEY (booked_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================
-- APPLICATIONS
-- ============================
CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    organization_id INT DEFAULT NULL,
    company VARCHAR(150) NOT NULL,
    location VARCHAR(150) NOT NULL,
    course VARCHAR(150) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    room_id INT DEFAULT NULL, -- the specific room (inside a hotel/lodge) the student booked, if any
    status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    admin_message TEXT,
    is_locked TINYINT(1) NOT NULL DEFAULT 1, -- 1 = student cannot edit, 0 = editable (unlocked after admin responds)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
    FOREIGN KEY (room_id) REFERENCES accommodation_rooms(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================
-- PAYMENTS (e.g. field/internship program fee)
-- NOTE: status can ONLY be changed by an admin (via verify_payment.php).
-- Students can submit a payment (always starts as 'pending') but cannot
-- confirm or reject it themselves.
-- ============================
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    application_id INT DEFAULT NULL,
    amount DECIMAL(10,2) NOT NULL,
    method ENUM('Mpesa','Tigo Pesa','Airtel Money','Bank Transfer','Cash') NOT NULL,
    reference_code VARCHAR(100) NOT NULL,
    status ENUM('pending','confirmed','rejected') NOT NULL DEFAULT 'pending',
    verified_by INT DEFAULT NULL,
    verified_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================
-- SAMPLE DATA
-- ============================
INSERT INTO organizations (name, location, sector, description, contact_email, contact_phone, slots_available) VALUES
('TANESCO', 'Dar es Salaam', 'Energy', 'The Tanzania electricity utility - field placement opportunities for engineering students.', 'internship@tanesco.co.tz', '0222451100', 10),
('NMB Bank', 'Dodoma', 'Finance', 'A bank offering field placements for finance and IT students.', 'careers@nmbbank.co.tz', '0222298000', 6),
('Tanzania Ports Authority', 'Tanga', 'Logistics', 'Field placement opportunities for logistics and engineering students.', 'info@tpa.go.tz', '0272642772', 4);

-- Three sample hotels/lodges, each with several individually bookable rooms
INSERT INTO accommodations (id, name, location, description, contact_phone, default_price_per_month, default_capacity) VALUES
(1, 'Green Hostel', 'Dar es Salaam', 'A safe hostel near work sites, with reliable power and water.', '0712345678', 80000.00, 2),
(2, 'Sunrise Lodge', 'Dodoma', 'Private rooms, WiFi, and easy transport to the office.', '0765432109', 60000.00, 1),
(3, 'Coastal Rooms', 'Tanga', 'Affordable rooms close to the port.', '0789123456', 50000.00, 3);

INSERT INTO accommodation_rooms (accommodation_id, room_number, price_per_month, capacity, status) VALUES
(1, 'Room 1', 80000.00, 2, 'available'),
(1, 'Room 2', 80000.00, 2, 'available'),
(1, 'Room 3', 90000.00, 1, 'available'),
(2, 'Room 1', 60000.00, 1, 'available'),
(2, 'Room 2', 60000.00, 1, 'available'),
(3, 'Room 1', 50000.00, 3, 'available'),
(3, 'Room 2', 50000.00, 3, 'available'),
(3, 'Room 3', 55000.00, 2, 'available');
