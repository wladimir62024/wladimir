const profileForm = document.getElementById("profileForm");
let profileUser = null;

if (profileForm) {
    profileUser = getUser();
    if (!profileUser) window.location.href = "login.html";
    else {
        loadProfile();
        renderPicturePreview(profileUser);
    }

    profileForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const msg = document.getElementById("formMsg");
        msg.textContent = "Saving...";
        msg.className = "form-msg";

        const payload = {
            user_id: profileUser.id,
            name: document.getElementById("name").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            new_password: document.getElementById("new_password").value,
        };

        try {
            const res = await fetch(`${API_BASE}/update_profile.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            msg.textContent = data.message;
            msg.className = "form-msg " + (data.success ? "success" : "error");
            if (data.success) {
                setUser(data.user);
                profileUser = data.user;
                document.getElementById("new_password").value = "";
                renderNavbar("profile");
            }
        } catch (err) {
            msg.textContent = "Could not connect to the server.";
            msg.className = "form-msg error";
        }
    });
}

async function loadProfile() {
    try {
        const res = await fetch(`${API_BASE}/get_profile.php?user_id=${profileUser.id}`);
        const data = await res.json();
        if (data.success) {
            document.getElementById("name").value = data.user.name;
            document.getElementById("email").value = data.user.email;
            document.getElementById("phone").value = data.user.phone || "";
            renderPicturePreview(data.user);
        }
    } catch (err) {
        console.error(err);
    }
}

function renderPicturePreview(user) {
    const box = document.getElementById("picturePreviewBox");
    if (!box) return;
    const url = avatarUrl(user);
    box.innerHTML = url
        ? `<img src="${url}" class="profile-picture-preview" alt="Profile picture" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'profile-picture-placeholder',textContent:'👤'}))">`
        : `<div class="profile-picture-placeholder">👤</div>`;
}

// -------- Profile picture upload (separate multipart request) --------
const pictureForm = document.getElementById("pictureForm");
if (pictureForm) {
    pictureForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const msg = document.getElementById("pictureMsg");
        const fileInput = document.getElementById("profile_picture_file");

        if (!fileInput.files || fileInput.files.length === 0) {
            msg.textContent = "Please choose an image first.";
            msg.className = "form-msg error";
            return;
        }

        msg.textContent = "Uploading...";
        msg.className = "form-msg";

        const formData = new FormData();
        formData.append("user_id", profileUser.id);
        formData.append("profile_picture", fileInput.files[0]);

        try {
            const res = await fetch(`${API_BASE}/upload_profile_picture.php`, {
                method: "POST",
                body: formData, // no Content-Type header — the browser sets the multipart boundary
            });
            const data = await res.json();
            msg.textContent = data.message;
            msg.className = "form-msg " + (data.success ? "success" : "error");
            if (data.success) {
                setUser(data.user);
                profileUser = data.user;
                renderPicturePreview(data.user);
                renderNavbar("profile");
                fileInput.value = "";
            }
        } catch (err) {
            msg.textContent = "Could not connect to the server.";
            msg.className = "form-msg error";
        }
    });
}
