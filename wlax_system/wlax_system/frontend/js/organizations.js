const orgGrid = document.getElementById("orgGrid");

async function loadOrganizations() {
    if (!orgGrid) return;
    orgGrid.innerHTML = `<div class="empty-state">Loading organizations...</div>`;
    try {
        const res = await fetch(`${API_BASE}/organizations.php`);
        const data = await res.json();

        if (!data.success) {
            orgGrid.innerHTML = `<div class="empty-state">Could not load organizations.<br><small style="color:var(--danger);">${data.message || "Unknown error"}</small></div>`;
            return;
        }
        if (data.organizations.length === 0) {
            orgGrid.innerHTML = `<div class="empty-state">No organizations have been registered yet.</div>`;
            return;
        }

        orgGrid.innerHTML = data.organizations
            .map(
                (o) => `
            <div class="feature-card">
                <span class="tag">${o.sector || "Field"}</span>
                <h3>${o.name}</h3>
                <p>📍 ${o.location}</p>
                <p>${o.description || ""}</p>
                <p><strong>Slots available:</strong> ${o.slots_available}</p>
                <p style="font-size:0.85rem; color:var(--text-muted);">📧 ${o.contact_email || "-"} &nbsp; 📞 ${o.contact_phone || "-"}</p>
            </div>
        `
            )
            .join("");
    } catch (err) {
        orgGrid.innerHTML = `<div class="empty-state">Could not connect to the server.<br><small style="color:var(--danger);">${err.message}</small></div>`;
    }
}

loadOrganizations();

// -------- Admin: add organization form --------
const addOrgForm = document.getElementById("addOrgForm");
if (addOrgForm) {
    addOrgForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const msg = document.getElementById("orgFormMsg");
        const payload = {
            name: document.getElementById("org_name").value.trim(),
            location: document.getElementById("org_location").value.trim(),
            sector: document.getElementById("org_sector").value.trim(),
            description: document.getElementById("org_description").value.trim(),
            contact_email: document.getElementById("org_email").value.trim(),
            contact_phone: document.getElementById("org_phone").value.trim(),
            slots_available: document.getElementById("org_slots").value || 0,
        };
        try {
            const res = await fetch(`${API_BASE}/organizations.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            msg.textContent = data.message;
            msg.className = "form-msg " + (data.success ? "success" : "error");
            if (data.success) {
                addOrgForm.reset();
                loadOrganizations();
            }
        } catch (err) {
            msg.textContent = "Could not connect to the server.";
            msg.className = "form-msg error";
        }
    });
}
