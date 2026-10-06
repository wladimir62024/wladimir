/* ==========================================================
   Shared helpers: API base, session (localStorage), navbar
   ========================================================== */

const API_BASE = "../backend/api"; // relative to /frontend/*.html
const UPLOADS_BASE = "../backend/uploads"; // relative to /frontend/*.html

function getUser() {
    const raw = localStorage.getItem("sfams_user");
    return raw ? JSON.parse(raw) : null;
}

function setUser(user) {
    localStorage.setItem("sfams_user", JSON.stringify(user));
}

function logout() {
    localStorage.removeItem("sfams_user");
    window.location.href = "login.html";
}

// Redirect helpers used at the top of protected pages
function requireStudent() {
    const user = getUser();
    if (!user) { window.location.href = "login.html"; return null; }
    if (user.role === "admin") { window.location.href = "admin.html"; return null; }
    return user;
}

function requireAdmin() {
    const user = getUser();
    if (!user) { window.location.href = "login.html"; return null; }
    if (user.role !== "admin") { window.location.href = "dashboard.html"; return null; }
    return user;
}

function avatarUrl(user) {
    if (user && user.profile_picture) {
        return `${UPLOADS_BASE}/profile_pictures/${user.profile_picture}`;
    }
    return null;
}

function avatarHtml(user, size) {
    const url = avatarUrl(user);
    if (url) {
        return `<img src="${url}" class="nav-avatar" alt="Profile picture" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'nav-avatar-placeholder',textContent:'👤'}))">`;
    }
    return `<span class="nav-avatar-placeholder">👤</span>`;
}

// Builds the left sidebar navigation. `active` = current page key.
function renderNavbar(active) {
    const user = getUser();
    const mount = document.getElementById("navbar");
    if (!mount) return;

    let links = "";

    if (user && user.role === "admin") {
        links = `
            <a href="admin.html" class="${active === 'admin' ? 'active' : ''}">🛠️ Admin Panel</a>
            <a href="organizations.html" class="${active === 'organizations' ? 'active' : ''}">🏢 Organizations</a>
            <a href="accommodation.html" class="${active === 'accommodation' ? 'active' : ''}">🏠 Accommodation</a>
            <a href="profile.html" class="${active === 'profile' ? 'active' : ''}">👤 My Profile</a>
            <span class="nav-user">${avatarHtml(user)} <span>${user.name} (Admin)</span></span>
            <button class="btn-logout" onclick="logout()">🚪 Logout</button>
        `;
    } else if (user) {
        links = `
            <a href="dashboard.html" class="${active === 'home' ? 'active' : ''}">🏡 Home</a>
            <a href="organizations.html" class="${active === 'organizations' ? 'active' : ''}">🏢 Organizations</a>
            <a href="accommodation.html" class="${active === 'accommodation' ? 'active' : ''}">🏠 Accommodation</a>
            <a href="payment.html" class="${active === 'payment' ? 'active' : ''}">💳 Payment</a>
            <a href="status.html" class="${active === 'status' ? 'active' : ''}">📋 Status</a>
            <a href="profile.html" class="${active === 'profile' ? 'active' : ''}">👤 My Profile</a>
            <span class="nav-user">${avatarHtml(user)} <span>${user.name}</span></span>
            <button class="btn-logout" onclick="logout()">🚪 Logout</button>
        `;
    } else {
        links = `
            <a href="index.html" class="${active === 'home' ? 'active' : ''}">🏡 Home</a>
            <a href="organizations.html" class="${active === 'organizations' ? 'active' : ''}">🏢 Organizations</a>
            <a href="accommodation.html" class="${active === 'accommodation' ? 'active' : ''}">🏠🛌 Hotels</a>
            <a href="login.html" class="${active === 'login' ? 'active' : ''}">🔐 Login</a>
            <a href="register.html" class="${active === 'register' ? 'active' : ''}">📝 Register</a>
        `;
    }

    mount.innerHTML = `
        <div class="brand">🛜🧑‍💻🛜 Wladimir System <span class="badge">WSAMS</span></div>
        <div class="nav-links">${links}</div>
    `;
}

// Toggles a password field between hidden (dots) and visible (plain text).
function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === "password") {
        input.type = "text";
        btn.textContent = "🙈";
        btn.setAttribute("aria-label", "Hide password");
    } else {
        input.type = "password";
        btn.textContent = "👁";
        btn.setAttribute("aria-label", "Show password");
    }
}

function fmtDate(d) {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
}
