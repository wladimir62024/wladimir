# Student Field Application Management System

A complete online system for applying to a field/internship placement: Register → Login → Apply → Track Status,
with an Admin Panel to approve or reject applications.

**This version adds:**
- 🌱 **Green layout** across the entire site
- 🧭 New menu: **Home, Organizations, Accommodation, Payment, Status**
- 🏢 **Organizations** page — list of organizations offering field placements
- 🏠 **Accommodation** page — housing options near field placement locations
- 💳 **Payment** page — submit payments and view payment history
- 👤 **My Profile** page — students can update their name/phone/password at any time
- ✏️ **Edit After Admin Response** — as soon as the admin responds (approve/reject) to a student's application, the student is allowed to edit the application's details (company, location, course, dates) and resubmit it for review. Before that, the application is locked and cannot be edited.
- 🛏️ **Multi-Room Accommodation** — an Accommodation is now a **Hotel/Lodge/Hostel** that can hold **many individual rooms**. Each room has its own live status (Available / Booked), so many students can each book a *different* room at the *same* hotel/lodge, but nobody can book a room someone else already holds. Students can also cancel their own booking to free the room again, and the admin can add more rooms to any hotel/lodge at any time.
- 📐 **Left Sidebar Navigation** — the top horizontal menu bar has been replaced site-wide with a fixed vertical sidebar on the left (it collapses to a horizontal bar automatically on small/mobile screens).
- 🖼️ **Profile Picture** — students and admins can upload a profile picture from **My Profile**. It's stored on the server and shown as a small avatar in the sidebar next to their name.
- 👁️ **Show/Hide Password** — every password field (Register, Login, and the "New Password" field on My Profile) has an eye icon to reveal or re-hide what you've typed.
- 🔐 **Admin-Only Payment Verification** — a student's payment always starts as "pending". Only the admin, from the Admin Panel's new Payment Verification section, can confirm or reject it. Students have no way to change a payment's status themselves.

## Technology
- Frontend: HTML + CSS (green theme) + JavaScript (vanilla)
- Backend: PHP (REST API, PDO + MySQL)
- Database: MySQL

## Setup Instructions

### 1. Install XAMPP
Download from https://www.apachefriends.org and install it (includes Apache, MySQL, PHP, phpMyAdmin).

### 2. Place the project inside htdocs
Copy the entire `student-field-system` folder into:
```
C:\xampp\htdocs\student-field-system
```

### 3. Start XAMPP
Open the XAMPP Control Panel → click **Start** for both **Apache** and **MySQL**.

### 4. Create the Database
1. Open your browser: `http://localhost/phpmyadmin`
2. Click **Import**
3. Choose the file: `backend/database/field_system.sql`
4. Click **Go**

This will create all the tables: `users`, `organizations`, `accommodations` (hotels/lodges), `accommodation_rooms` (individually bookable rooms inside each hotel/lodge), `applications`, `payments` (with `verified_by`/`verified_at` columns for admin verification) — along with sample data (3 sample hotels/lodges, each with several rooms, all starting as "available").

### 5. Create the Admin Account
Open this URL in your browser ONCE:
```
http://localhost/student-field-system/backend/create_admin.php
```
This creates the default admin account (Email: admin@system.com, Password: admin123).
**After that, DELETE the `create_admin.php` file** for security (or rename it).

### 6. Open the System
```
http://localhost/student-field-system/frontend/
```

## Usage Flow
1. The user opens `index.html` → sees the menu: **Home, Organizations, Accommodation, Login, Register**
2. Clicks **Register** → fills in name, email, phone, password
3. Redirected to **Login** → logs in with email/password
4. Enters **Home (Dashboard)** → sees the full menu: Home, Organizations, Accommodation, Payment, Status, My Profile
5. Browses **Organizations** to see companies with open slots, and **Accommodation** to browse rooms
6. On the **Accommodation** page, the student sees a list of hotels/lodges. Clicking **"▼ View Rooms"** on any hotel/lodge expands a table of its individual rooms, each marked **Available** or **Booked**. The student can click **Book** only on an available room — a room already booked by another student shows a disabled **Booked** button. The student can **Cancel** their own booking at any time to free that room again, while other rooms at the same hotel/lodge stay untouched
7. Clicks "Apply for Field" → fills the form (company/organization from the list or typed manually, location, course, dates). The accommodation dropdown only lists rooms the student has already booked for themselves
8. Can go to **Payment** to submit a payment (it always starts as "pending") and see their payment history
9. Can check the status of their application on the **Status** page
10. **Admin** logs in with `admin@system.com` → is redirected directly to `admin.html`
11. Admin sees ALL applications from all students, can **Approve** or **Reject** them, and write a message. Admin can also add new Organizations/Accommodation on those pages
12. In the Admin Panel's **Payment Verification** section, the admin sees every payment submitted by every student and can **Confirm** or **Reject** each one — this action is only available to the admin; students cannot change a payment's status themselves
13. When the student returns to **Status**, they see the new application status and the admin's message
14. Since the admin has now responded, the application is "unlocked" (`is_locked = 0`) — the student now sees an **"✏️ Edit Details"** button and can edit the company/location/course/dates, then resubmit. The application returns to `pending` status for a fresh admin review
15. At any time, the student can go to **My Profile** to update their name, phone number, or password, independent of the admin's response

## Folder Structure
```
student-field-system/
├── frontend/
│   ├── index.html          <- Landing page (Home, Organizations, Accommodation, Login, Register)
│   ├── register.html
│   ├── login.html
│   ├── dashboard.html      <- Home (after login)
│   ├── application.html    <- Field application form
│   ├── organizations.html  <- List of organizations (+ admin add form)
│   ├── accommodation.html  <- List of accommodation options (+ admin add form)
│   ├── payment.html        <- Submit payment + history
│   ├── status.html         <- Application status + edit after admin response
│   ├── profile.html        <- Edit personal details
│   ├── admin.html          <- Admin panel
│   ├── css/style.css       <- Green theme
│   └── js/
│       ├── common.js       <- Navbar, session (localStorage), auth guards
│       ├── auth.js         <- Register, Login
│       ├── application.js  <- Submit application, status list, edit-after-response
│       ├── organizations.js
│       ├── accommodation.js
│       ├── payment.js
│       ├── profile.js
│       └── admin.js        <- Admin: view all + approve/reject
│
├── backend/
│   ├── config/database.php
│   ├── create_admin.php    <- Use once only, then delete
│   ├── api/
│   │   ├── register.php
│   │   ├── login.php
│   │   ├── submit_application.php
│   │   ├── get_application.php
│   │   ├── update_application.php   <- (NEW) Student edits after admin responds
│   │   ├── admin_applications.php
│   │   ├── update_status.php        <- Admin approve/reject (unlocks editing)
│   │   ├── organizations.php        <- (NEW) GET/POST organizations
│   │   ├── accommodation.php        <- (NEW) GET/POST hotels/lodges (each with nested rooms)
│   │   ├── rooms.php                <- (NEW) Admin-only: add another room to a hotel/lodge
│   │   ├── book_room.php            <- (NEW) Student books/cancels ONE specific room (available-only guard)
│   │   ├── payment.php              <- (NEW) Student submits a payment / views own history
│   │   ├── admin_payments.php       <- (NEW) Admin-only: list ALL payments from ALL students
│   │   ├── verify_payment.php       <- (NEW) Admin-only: confirm/reject a payment
│   │   ├── get_profile.php          <- (NEW)
│   │   ├── update_profile.php       <- (NEW)
│   │   └── upload_profile_picture.php  <- (NEW) Handles the profile picture file upload
│   ├── uploads/
│   │   └── profile_pictures/        <- Where uploaded profile pictures are saved (must be writable)
│   └── database/
│       ├── field_system.sql                  <- Full schema for a brand-new install
│       └── migration_multi_room.sql           <- Upgrade an EXISTING database to the hotel/rooms model
│
└── README.md
```

## How "Edit After Admin Response" Works
- Every application (`applications`) has an `is_locked` column (1 = locked, 0 = unlocked).
- A new application starts with `is_locked = 1` (the student cannot edit it after submitting).
- When the admin clicks **Approve** or **Reject** in `admin.html`, `update_status.php` sets `is_locked = 0`.
- On `status.html`, if `is_locked = 0`, the student sees an edit form and a "Save and Resubmit" button.
- When they save changes, `update_application.php` resets `status = pending`, clears the previous admin message, and sets `is_locked = 1` again — meaning the application goes back to the admin for a fresh review.

## How Multi-Room Accommodation Booking Works
- `accommodations` is now the **hotel/lodge/hostel** itself (name, location, description, contact, and *default* price/capacity used when a room doesn't override them).
- `accommodation_rooms` holds every individual **room** inside a hotel/lodge. Each row has its own `status` (`available`/`booked`), `booked_by` (the student's user id), and `booked_at` — completely independent of every other room, even ones in the same hotel/lodge.
- On the Accommodation page, each hotel/lodge is shown as a card with an available/booked room count. Clicking **"▼ View Rooms"** expands a table listing every room with its own status and a **Book** / **Cancel** / disabled **Booked** button, so a student can immediately see which specific rooms are free and which are already taken.
- `book_room.php` locks the room's row (`SELECT ... FOR UPDATE`) before booking, so two students cannot grab the same room at the same instant. If that room is already `booked`, the request is rejected with a clear message — but a *different* room in the same hotel/lodge is unaffected and can still be booked.
- A student can cancel their own booking (`action: "cancel"`), which sets that room back to `available`.
- The accommodation dropdown on the application form only lists the specific rooms the logged-in student has already booked for themselves (shown as "Hotel Name — Room Number") — booking always happens on the Accommodation page first, then gets attached to the application.
- The admin can add more rooms to an existing hotel/lodge at any time from the expanded room list ("Add another room to this accommodation"), or create a batch of rooms upfront when first adding the hotel/lodge.

## How Admin-Only Payment Verification Works
- Every payment (`payments`) always starts with `status = pending` when a student submits it via `payment.php`. There is no way for a student to change this status from the UI.
- Only the Admin Panel calls `admin_payments.php` to list every payment from every student, and `verify_payment.php` to set a payment's status to `confirmed` or `rejected`.
- `verify_payment.php` double-checks server-side that the acting user's `role` is `admin` before applying the change, and records who verified it (`verified_by`) and when (`verified_at`).

## How Profile Pictures Work
- `users.profile_picture` stores just the filename (not the full path) of the uploaded image.
- `upload_profile_picture.php` accepts a multipart/form-data upload, validates the file is a JPG/PNG/GIF/WEBP under 2MB, deletes the user's previous picture (if any), and saves the new one as `backend/uploads/profile_pictures/user_{id}_{timestamp}.{ext}`.
- The frontend builds the image URL as `../backend/uploads/profile_pictures/<filename>` and shows it as a small circular avatar in the sidebar, with a generic 👤 icon shown for anyone who hasn't uploaded one yet.
- **Make sure `backend/uploads/profile_pictures/` is writable by the web server.** On XAMPP this normally works out of the box; on a Linux production server you may need `chmod -R 755 backend/uploads` (or `775`/`777` depending on your web server's user).

## Security Checklist Before Using with a Real Organization
Before deploying this system for real use by an organization/college, do the following:

1. **Delete `create_admin.php`** after creating the admin account
2. **Change the default admin password** (admin123) immediately after the first login (use the My Profile page)
3. **Set up HTTPS** (SSL certificate) on the real production server (not localhost)
4. **Use environment variables or a .env file** for database credentials instead of hardcoding them in `database.php`
5. Add **session/token-based authentication** (e.g. JWT) instead of relying solely on localStorage for higher security
6. Add **extra server-side validation** (e.g. email format, daily application limits)
7. Perform **regular database backups**
8. Make sure `backend/uploads/` is writable but **not directly browsable** as a directory listing (the included `index.html` placeholder files block this on Apache by default)

## Troubleshooting

**"Could not load accommodation options" / rooms don't appear, or Organizations page shows an error**
This almost always means your database was created with an **older** schema that doesn't have the `accommodation_rooms` table yet (either the very first version, or the single-room-per-accommodation version). Fix it by running the migration script once:
1. Open `http://localhost/phpmyadmin`
2. Click the `field_system` database → the **SQL** tab
3. Paste the contents of `backend/database/migration_multi_room.sql` and click **Go**
4. Refresh the Accommodation / Organizations page

This migration is safe to run even if you already ran an older migration before — it checks what already exists and only adds what's missing, and it turns each of your existing accommodations into "Room 1" of itself so no bookings are lost.

If you're setting the project up for the very first time, just import `backend/database/field_system.sql` as normal — it already includes the hotel/rooms structure, so no migration is needed.

**Viewing vs. logging in**
Browsing **Organizations** and **Accommodation** never requires login — anyone can see the full list of hotels/lodges and expand each one to see which rooms are available and which are already booked. Only *booking a room*, *submitting an application*, or *making a payment* requires being logged in as a student.

## Publishing to GitHub
```bash
cd student-field-system
git init
git add .
git commit -m "Initial Student Field Application System"
git branch -M main
git remote add origin https://github.com/USERNAME/YOUR-REPO-NAME.git
git push -u origin main
```
Create a `.gitignore` file containing:
```
.env
vendor/
node_modules/
```
