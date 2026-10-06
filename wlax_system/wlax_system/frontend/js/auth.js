// -------- Register --------
const registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const msg = document.getElementById("formMsg");
        msg.textContent = "Submitting...";
        msg.className = "form-msg";

        const payload = {
            name: document.getElementById("name").value.trim(),
            email: document.getElementById("email").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            password: document.getElementById("password").value,
        };

        try {
            const res = await fetch(`${API_BASE}/register.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            msg.textContent = data.message;
            msg.className = "form-msg " + (data.success ? "success" : "error");
            if (data.success) {
                setTimeout(() => (window.location.href = "login.html"), 1200);
            }
        } catch (err) {
            msg.textContent = "Could not connect to the server.";
            msg.className = "form-msg error";
        }
    });
}

// -------- Login --------
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const msg = document.getElementById("formMsg");
        msg.textContent = "Logging ✅✅...";
        msg.className = "form-msg";

        const payload = {
            email: document.getElementById("email").value.trim(),
            password: document.getElementById("password").value,
        };

        try {
            const res = await fetch(`${API_BASE}/login.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            msg.textContent = data.message;
            msg.className = "form-msg " + (data.success ? "success" : "error");

            if (data.success) {
                setUser(data.user);
                setTimeout(() => {
                    window.location.href = data.user.role === "admin" ? "admin.html" : "dashboard.html";
                }, 600);
            }
        } catch (err) {
            msg.textContent = "Could not connect to the server.";
            msg.className = "form-msg error";
        }
    });
}
