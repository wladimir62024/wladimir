-- ============================================================
-- MIGRATION: Split "one accommodation = one room" into
-- "one accommodation (hotel/lodge) = many individually bookable rooms"
-- ============================================================
-- Run this ONCE if your database already has an `accommodations` table
-- from an earlier version of this project (with or without the
-- status/booked_by/booked_at columns). It safely upgrades your data
-- without losing any existing bookings.
--
-- How to run:
-- 1. Open http://localhost/phpmyadmin
-- 2. Click the `field_system` database → the "SQL" tab
-- 3. Paste everything below and click "Go"
-- ============================================================

USE field_system;

-- Step 1: make sure legacy booking columns exist on accommodations
-- (older installs before the booking feature won't have these yet)
ALTER TABLE accommodations
    ADD COLUMN IF NOT EXISTS status ENUM('available','booked') NOT NULL DEFAULT 'available',
    ADD COLUMN IF NOT EXISTS booked_by INT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS booked_at TIMESTAMP NULL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS price_per_month DECIMAL(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS capacity INT DEFAULT 1;

-- Step 2: rename the old single-room columns into "default_*" hotel-level columns
ALTER TABLE accommodations
    ADD COLUMN IF NOT EXISTS default_price_per_month DECIMAL(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS default_capacity INT DEFAULT 1;

UPDATE accommodations
SET default_price_per_month = price_per_month,
    default_capacity = capacity
WHERE default_price_per_month = 0;

-- Step 3: create the new rooms table
CREATE TABLE IF NOT EXISTS accommodation_rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    accommodation_id INT NOT NULL,
    room_number VARCHAR(50) NOT NULL,
    price_per_month DECIMAL(10,2) DEFAULT NULL,
    capacity INT DEFAULT NULL,
    status ENUM('available','booked') NOT NULL DEFAULT 'available',
    booked_by INT DEFAULT NULL,
    booked_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_room_per_accommodation (accommodation_id, room_number),
    FOREIGN KEY (accommodation_id) REFERENCES accommodations(id) ON DELETE CASCADE,
    FOREIGN KEY (booked_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Step 4: turn every existing accommodation into "Room 1" of itself,
-- carrying over whatever booking state it already had
INSERT INTO accommodation_rooms (accommodation_id, room_number, price_per_month, capacity, status, booked_by, booked_at)
SELECT a.id, 'Room 1', a.price_per_month, a.capacity, a.status, a.booked_by, a.booked_at
FROM accommodations a
WHERE NOT EXISTS (
    SELECT 1 FROM accommodation_rooms r WHERE r.accommodation_id = a.id AND r.room_number = 'Room 1'
);

-- Step 5: add room_id to applications and backfill it from the old accommodation_id
ALTER TABLE applications
    ADD COLUMN IF NOT EXISTS room_id INT DEFAULT NULL;

SET @fk_exists := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = 'field_system'
      AND TABLE_NAME = 'applications'
      AND CONSTRAINT_NAME = 'fk_applications_room_id'
);
SET @sql := IF(@fk_exists = 0,
    'ALTER TABLE applications ADD CONSTRAINT fk_applications_room_id FOREIGN KEY (room_id) REFERENCES accommodation_rooms(id) ON DELETE SET NULL',
    'SELECT "Foreign key already exists, skipping."'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Only backfill if the old accommodation_id column still exists on applications
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'field_system' AND TABLE_NAME = 'applications' AND COLUMN_NAME = 'accommodation_id'
);
SET @sql2 := IF(@col_exists > 0,
    'UPDATE applications ap JOIN accommodation_rooms r ON r.accommodation_id = ap.accommodation_id AND r.room_number = "Room 1" SET ap.room_id = r.id WHERE ap.accommodation_id IS NOT NULL AND ap.room_id IS NULL',
    'SELECT "No old accommodation_id column found on applications, nothing to backfill."'
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Step 6: add payment verification columns (in case an even older install is missing them)
ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS verified_by INT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP NULL DEFAULT NULL;

-- Step 7: add profile picture column (in case an older install is missing it)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(255) DEFAULT NULL;

SELECT 'Migration complete. Accommodations are now hotels/lodges, each with individually bookable rooms in accommodation_rooms.' AS result;
