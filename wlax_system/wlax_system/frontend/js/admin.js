let adminUser = null;
const adminList = document.getElementById("adminList");
const adminPaymentsList = document.getElementById("adminPaymentsList");

if (adminList) {
    adminUser = requireAdmin();
    loadAllApplications();
    if (adminPaymentsList) loadAllPayments();
}

async function loadAllApplications() {
    try {
        const res = await fetch(`${API_BASE}/admin_applications.php`);
        const data = await res.json();

        if (!data.success || data.applications.length === 0) {
            adminList.innerHTML = `<div class="empty-state">No applications have been submitted yet.</div>`;
            return;
        }

        adminList.innerHTML = "";
        data.applications.forEach((app) => renderAdminCard(app));
    } catch (err) {
        adminList.innerHTML = `<div class="empty-state">Could not load applications.</div>`;
    }
}

function renderAdminCard(app) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
            <h3 style="margin:0;">${app.student_name} → ${app.company}</h3>
            <span class="badge-status ${app.status}">${app.status}</span>
        </div>
        <p style="font-size:0.85rem; color:var(--text-muted);">📧 ${app.student_email} &nbsp; 📞 ${app.student_phone || "-"}</p>
        <p><strong>Location:</strong> ${app.location} &nbsp;|&nbsp; <strong>Course:</strong> ${app.course}</p>
        <p><strong>Period:</strong> ${fmtDate(app.start_date)} — ${fmtDate(app.end_date)}</p>
        <p><strong>Accommodation:</strong> ${app.accommodation_name ? `${app.accommodation_name} — ${app.room_number}` : "None"}</p>
        ${app.admin_message ? `<div class="admin-message-box"><strong>Previous message:</strong> ${app.admin_message}</div>` : ""}
        <label>Message to the student (optional)</label>
        <textarea id="msg_${app.id}" placeholder="Write your message here..."></textarea>
        <div style="display:flex; gap:0.6rem; margin-top:0.8rem;">
            <button class="btn btn-sm" onclick="respond(${app.id}, 'approved')">✅ Approve</button>
            <button class="btn btn-sm btn-danger" onclick="respond(${app.id}, 'rejected')">❌ Reject</button>
        </div>
        <p class="form-msg" id="respMsg_${app.id}"></p>
    `;
    adminList.appendChild(card);
}

async function respond(appId, status) {
    const respMsg = document.getElementById(`respMsg_${appId}`);
    const adminMessage = document.getElementById(`msg_${appId}`).value.trim();
    respMsg.textContent = "Submitting...";
    respMsg.className = "form-msg";

    try {
        const res = await fetch(`${API_BASE}/update_status.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ application_id: appId, status, admin_message: adminMessage }),
        });
        const data = await res.json();
        respMsg.textContent = data.message;
        respMsg.className = "form-msg " + (data.success ? "success" : "error");
        if (data.success) setTimeout(loadAllApplications, 900);
    } catch (err) {
        respMsg.textContent = "Could not connect to the server.";
        respMsg.className = "form-msg error";
    }
}

/* ==========================================================
   PAYMENT VERIFICATION — admin-only. Students can submit a
   payment (always starts as 'pending') but only an admin can
   confirm or reject it here.
   ========================================================== */
async function loadAllPayments() {
    try {
        const res = await fetch(`${API_BASE}/admin_payments.php`);
        const data = await res.json();

        if (!data.success || data.payments.length === 0) {
            adminPaymentsList.innerHTML = `<div class="empty-state">No payments have been submitted yet.</div>`;
            return;
        }

        adminPaymentsList.innerHTML = "";
        data.payments.forEach((p) => renderPaymentCard(p));
    } catch (err) {
        adminPaymentsList.innerHTML = `<div class="empty-state">Could not load payments.</div>`;
    }
}

function renderPaymentCard(p) {
    const card = document.createElement("div");
    card.className = "card";
    const verifiedNote = p.verified_by_name
        ? `<p style="font-size:0.85rem; color:var(--text-muted);">Verified by: ${p.verified_by_name} on ${fmtDate(p.verified_at)}</p>`
        : "";

    const actions =
        p.status === "pending"
            ? `<div style="display:flex; gap:0.6rem; margin-top:0.8rem;">
                 <button class="btn btn-sm" onclick="verifyPayment(${p.id}, 'confirmed')">✅ Confirm Payment</button>
                 <button class="btn btn-sm btn-danger" onclick="verifyPayment(${p.id}, 'rejected')">❌ Reject Payment</button>
               </div>`
            : "";

    card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
            <h3 style="margin:0;">${p.student_name} — TZS ${Number(p.amount).toLocaleString()}</h3>
            <span class="badge-status ${p.status}">${p.status}</span>
        </div>
        <p style="font-size:0.85rem; color:var(--text-muted);">📧 ${p.student_email}</p>
        <p><strong>Method:</strong> ${p.method} &nbsp;|&nbsp; <strong>Reference:</strong> ${p.reference_code}</p>
        <p><strong>Related application:</strong> ${p.application_company || "-"}</p>
        <p><strong>Submitted:</strong> ${fmtDate(p.created_at)}</p>
        ${verifiedNote}
        ${actions}
        <p class="form-msg" id="payMsg_${p.id}"></p>
    `;
    adminPaymentsList.appendChild(card);
}

async function verifyPayment(paymentId, status) {
    const msg = document.getElementById(`payMsg_${paymentId}`);
    msg.textContent = "Submitting...";
    msg.className = "form-msg";

    try {
        const res = await fetch(`${API_BASE}/verify_payment.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ payment_id: paymentId, status, admin_id: adminUser.id }),
        });
        const data = await res.json();
        msg.textContent = data.message;
        msg.className = "form-msg " + (data.success ? "success" : "error");
        if (data.success) setTimeout(loadAllPayments, 900);
    } catch (err) {
        msg.textContent = "Could not connect to the server.";
        msg.className = "form-msg error";
    }
}
