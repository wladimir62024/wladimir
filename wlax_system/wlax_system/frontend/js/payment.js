let payUser = null;

const paymentForm = document.getElementById("paymentForm");
const paymentHistory = document.getElementById("paymentHistory");

if (paymentForm || paymentHistory) {
    payUser = requireStudent();
    loadPaymentHistory();
    loadMyApplicationForPayment();
}

async function loadMyApplicationForPayment() {
    const appSelect = document.getElementById("application_id");
    if (!appSelect) return;
    try {
        const res = await fetch(`${API_BASE}/get_application.php?user_id=${payUser.id}`);
        const data = await res.json();
        if (data.success) {
            data.applications.forEach((a) => {
                const opt = document.createElement("option");
                opt.value = a.id;
                opt.textContent = `${a.company} (${a.status})`;
                appSelect.appendChild(opt);
            });
        }
    } catch (err) {
        console.error(err);
    }
}

if (paymentForm) {
    paymentForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const msg = document.getElementById("formMsg");
        msg.textContent = "Submitting payment...";
        msg.className = "form-msg";

        const payload = {
            user_id: payUser.id,
            application_id: document.getElementById("application_id").value || null,
            amount: document.getElementById("amount").value,
            method: document.getElementById("method").value,
            reference_code: document.getElementById("reference_code").value.trim(),
        };

        try {
            const res = await fetch(`${API_BASE}/payment.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            msg.textContent = data.message;
            msg.className = "form-msg " + (data.success ? "success" : "error");
            if (data.success) {
                paymentForm.reset();
                loadPaymentHistory();
            }
        } catch (err) {
            msg.textContent = "Could not connect to the server.";
            msg.className = "form-msg error";
        }
    });
}

async function loadPaymentHistory() {
    if (!paymentHistory) return;
    try {
        const res = await fetch(`${API_BASE}/payment.php?user_id=${payUser.id}`);
        const data = await res.json();

        if (!data.success || data.payments.length === 0) {
            paymentHistory.innerHTML = `<div class="empty-state">You haven't made any payments yet.</div>`;
            return;
        }

        paymentHistory.innerHTML = `
            <table>
                <thead><tr><th>Date</th><th>Amount (TZS)</th><th>Method</th><th>Reference</th><th>Status</th></tr></thead>
                <tbody>
                    ${data.payments
                        .map(
                            (p) => `
                        <tr>
                            <td>${fmtDate(p.created_at)}</td>
                            <td>${Number(p.amount).toLocaleString()}</td>
                            <td>${p.method}</td>
                            <td>${p.reference_code}</td>
                            <td><span class="badge-status ${p.status}">${p.status}</span></td>
                        </tr>
                    `
                        )
                        .join("")}
                </tbody>
            </table>
        `;
    } catch (err) {
        paymentHistory.innerHTML = `<div class="empty-state">Could not load your payment history.</div>`;
    }
}
