let currentUser = null;

async function loadDropdowns() {
    try {
        const [orgRes, accRes] = await Promise.all([
            fetch(`${API_BASE}/organizations.php`),
            fetch(`${API_BASE}/accommodation.php`),
        ]);
        const orgData = await orgRes.json();
        const accData = await accRes.json();

        const orgSelect = document.getElementById("organization_id");
        if (orgSelect && orgData.success) {
            orgData.organizations.forEach((o) => {
                const opt = document.createElement("option");
                opt.value = o.id;
                opt.textContent = `${o.name} — ${o.location}`;
                opt.dataset.name = o.name;
                opt.dataset.location = o.location;
                orgSelect.appendChild(opt);
            });
            orgSelect.addEventListener("change", () => {
                const selected = orgSelect.options[orgSelect.selectedIndex];
                if (selected && selected.dataset.name) {
                    document.getElementById("company").value = selected.dataset.name;
                    document.getElementById("location").value = selected.dataset.location;
                }
            });
        }

        // Only rooms the current student has already booked (via the Accommodation page)
        // can be attached to an application — each hotel/lodge can have many rooms,
        // and the student picks the specific room they hold.
        const roomSelect = document.getElementById("room_id");
        if (roomSelect && accData.success) {
            const myRooms = [];
            accData.accommodations.forEach((hotel) => {
                (hotel.rooms || []).forEach((r) => {
                    if (r.status === "booked" && currentUser && Number(r.booked_by) === Number(currentUser.id)) {
                        myRooms.push({ ...r, hotel_name: hotel.name, hotel_location: hotel.location });
                    }
                });
            });

            if (myRooms.length === 0) {
                const opt = document.createElement("option");
                opt.value = "";
                opt.textContent = "No room booked yet — book one on the Accommodation page first";
                opt.disabled = true;
                roomSelect.appendChild(opt);
            } else {
                myRooms.forEach((r) => {
                    const opt = document.createElement("option");
                    opt.value = r.id;
                    opt.textContent = `${r.hotel_name} — ${r.room_number} (${r.hotel_location})`;
                    roomSelect.appendChild(opt);
                });
            }
        }
    } catch (err) {
        console.error("Failed to load dropdowns", err);
    }
}

const applicationForm = document.getElementById("applicationForm");
if (applicationForm) {
    currentUser = requireStudent();
    loadDropdowns();

    applicationForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const msg = document.getElementById("formMsg");
        msg.textContent = "Submitting application...";
        msg.className = "form-msg";

        const payload = {
            user_id: currentUser.id,
            organization_id: document.getElementById("organization_id").value || null,
            company: document.getElementById("company").value.trim(),
            location: document.getElementById("location").value.trim(),
            course: document.getElementById("course").value.trim(),
            start_date: document.getElementById("start_date").value,
            end_date: document.getElementById("end_date").value,
            room_id: document.getElementById("room_id").value || null,
        };

        try {
            const res = await fetch(`${API_BASE}/submit_application.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            msg.textContent = data.message;
            msg.className = "form-msg " + (data.success ? "success" : "error");
            if (data.success) setTimeout(() => (window.location.href = "status.html"), 1200);
        } catch (err) {
            msg.textContent = "Could not connect to the server.";
            msg.className = "form-msg error";
        }
    });
}

/* ==========================================================
   STATUS PAGE — shows the student's application(s) and lets
   them edit + resubmit ONLY after the admin has responded
   (is_locked = 0) to an approved/rejected application.
   ========================================================== */
const statusList = document.getElementById("statusList");
if (statusList) {
    currentUser = requireStudent();
    loadStatusList();
}

async function loadStatusList() {
    try {
        const res = await fetch(`${API_BASE}/get_application.php?user_id=${currentUser.id}`);
        const data = await res.json();

        if (!data.success || data.applications.length === 0) {
            statusList.innerHTML = `<div class="empty-state">You haven't submitted any application yet. <a href="application.html" class="btn btn-sm">Apply for Field Now</a></div>`;
            return;
        }

        statusList.innerHTML = "";
        data.applications.forEach((app) => renderApplicationCard(app));
    } catch (err) {
        statusList.innerHTML = `<div class="empty-state">Could not load your data. Please try again.</div>`;
    }
}

function renderApplicationCard(app) {
    const canEdit = Number(app.is_locked) === 2; // admin has responded -> editing unlocked
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
            <h3 style="margin:0;">${app.company}</h3>
            <span class="badge-status ${app.status}">${app.status}</span>
        </div>
        <p><strong>Location:</strong> ${app.location} &nbsp;|&nbsp; <strong>Course:</strong> ${app.course}</p>
        <p><strong>Period:</strong> ${fmtDate(app.start_date)} — ${fmtDate(app.end_date)}</p>
        <p><strong>Accommodation:</strong> ${app.accommodation_name ? `${app.accommodation_name} — ${app.room_number}` : "None selected"}</p>
        ${app.admin_message ? `<div class="admin-message-box"><strong>Admin message:</strong> ${app.admin_message}</div>` : ""}
        ${
            canEdit
                ? `<div class="unlocked-note">✅ The admin has responded to your application. You can now edit its details if you need to.</div>
                   <button class="btn btn-sm" onclick="toggleEdit(${app.id})">✏️ Edit Details</button>`
                : `<div class="locked-note">🔒 You cannot edit these details until the admin responds to your application.</div>`
        }
        <div id="editBox-${app.id}" style="display:none; margin-top:1rem;"></div>
    `;
    statusList.appendChild(card);

    if (canEdit) buildEditForm(app);
}

function buildEditForm(app) {
    const box = document.getElementById(`editBox-${app.id}`);
    box.innerHTML = `
        <hr style="border-color:var(--green-100); margin:1rem 0;">
        <label>Company / Organization</label>
        <input type="text" id="edit_company_${app.id}" value="${app.company}" required>
        <label>Location</label>
        <input type="text" id="edit_location_${app.id}" value="${app.location}" required>
        <label>Course</label>
        <input type="text" id="edit_course_${app.id}" value="${app.course}" required>
        <label>Start Date</label>
        <input type="date" id="edit_start_${app.id}" value="${app.start_date}" required>
        <label>End Date</label>
        <input type="date" id="edit_end_${app.id}" value="${app.end_date}" required>
        <button class="btn btn-sm" style="margin-top:0.8rem;" onclick="submitEdit(${app.id})">💾 Save and Resubmit</button>
        <p class="form-msg" id="editMsg-${app.id}"></p>
    `;
}

function toggleEdit(appId) {
    const box = document.getElementById(`editBox-${appId}`);
    box.style.display = box.style.display === "none" ? "block" : "none";
}

async function submitEdit(appId) {
    const msg = document.getElementById(`editMsg-${appId}`);
    msg.textContent = "Saving...";
    msg.className = "form-msg";

    const payload = {
        application_id: appId,
        user_id: currentUser.id,
        company: document.getElementById(`edit_company_${appId}`).value.trim(),
        location: document.getElementById(`edit_location_${appId}`).value.trim(),
        course: document.getElementById(`edit_course_${appId}`).value.trim(),
        start_date: document.getElementById(`edit_start_${appId}`).value,
        end_date: document.getElementById(`edit_end_${appId}`).value,
    };

    try {
        const res = await fetch(`${API_BASE}/update_application.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        msg.textContent = data.message;
        msg.className = "form-msg " + (data.success ? "success" : "error");
        if (data.success) setTimeout(loadStatusList, 1000);
    } catch (err) {
        msg.textContent = "Could not connect to the server.";
        msg.className = "form-msg error";
    }
}
