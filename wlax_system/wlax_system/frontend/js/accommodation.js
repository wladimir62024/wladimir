const accGrid = document.getElementById("accGrid");
const currentViewer = getUser();
let expandedHotels = {}; // remembers which hotel cards are expanded between re-renders

async function loadAccommodations() {
    if (!accGrid) return;
    accGrid.innerHTML = `<div class="empty-state">Loading hotels/lodges...</div>`;
    try {
        const res = await fetch(`${API_BASE}/accommodation.php`);
        const data = await res.json();

        if (!data.success) {
            accGrid.innerHTML = `<div class="empty-state">Could not load accommodation options.<br><small style="color:var(--danger);">${data.message || "Unknown error"}</small></div>`;
            return;
        }
        if (data.accommodations.length === 0) {
            accGrid.innerHTML = `<div class="empty-state">No accommodation (hotels/lodges) have been registered yet.</div>`;
            return;
        }

        accGrid.innerHTML = data.accommodations.map((a) => renderHotelCard(a)).join("");
    } catch (err) {
        accGrid.innerHTML = `<div class="empty-state">Could not connect to the server.<br><small style="color:var(--danger);">${err.message}</small></div>`;
    }
}

function renderHotelCard(a) {
    const isExpanded = !!expandedHotels[a.id];
    const isAdmin = currentViewer && currentViewer.role === "admin";

    const roomsHtml = a.rooms
        .map((r) => renderRoomRow(r, a))
        .join("");

    return `
        <div class="card" style="grid-column: 1 / -1;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.6rem;">
                <div>
                    <h3 style="margin:0 0 0.2rem;">🏨 ${a.name}</h3>
                    <p style="margin:0; color:var(--text-muted);">📍 ${a.location}</p>
                </div>
                <div style="text-align:right;">
                    <span class="badge-status approved">${a.available_rooms} available</span>
                    <span class="badge-status rejected">${a.booked_rooms} booked</span>
                </div>
            </div>
            <p>${a.description || ""}</p>
            <p style="font-size:0.85rem; color:var(--text-muted);">
                📞 ${a.contact_phone || "-"} &nbsp;|&nbsp;
                Starting from TZS ${Number(a.default_price_per_month).toLocaleString()}/month &nbsp;|&nbsp;
                ${a.total_rooms} room(s) total
            </p>

            <button class="btn btn-sm btn-secondary" onclick="toggleHotel(${a.id})">
                ${isExpanded ? "▲ Hide Rooms" : "▼ View Rooms"}
            </button>

            <div id="hotelRooms-${a.id}" style="display:${isExpanded ? "block" : "none"}; margin-top:1rem;">
                ${
                    a.rooms.length === 0
                        ? `<div class="empty-state">No rooms have been added to this accommodation yet.</div>`
                        : `<table><thead><tr><th>Room</th><th>Price/Month</th><th>Capacity</th><th>Status</th><th></th></tr></thead><tbody>${roomsHtml}</tbody></table>`
                }
                ${isAdmin ? renderAddRoomForm(a.id) : ""}
            </div>
        </div>
    `;
}

function renderRoomRow(r, a) {
    const isBooked = r.status === "booked";
    const isMine = currentViewer && isBooked && Number(r.booked_by) === Number(currentViewer.id);
    const isStudent = currentViewer && currentViewer.role !== "admin";
    const price = r.price_per_month !== null ? r.price_per_month : a.default_price_per_month;
    const capacity = r.capacity !== null ? r.capacity : a.default_capacity;

    const statusBadge = isBooked
        ? `<span class="badge-status rejected">Booked${isMine ? " (by you)" : ""}</span>`
        : `<span class="badge-status approved">Available</span>`;

    let action = "";
    if (isStudent) {
        if (!isBooked) {
            action = `<button class="btn btn-sm" onclick="bookRoom(${r.id})">Book</button>`;
        } else if (isMine) {
            action = `<button class="btn btn-sm btn-secondary" onclick="cancelRoom(${r.id})">Cancel</button>`;
        } else {
            action = `<button class="btn btn-sm" disabled style="opacity:0.5; cursor:not-allowed;">Booked</button>`;
        }
    } else if (currentViewer && currentViewer.role === "admin" && isBooked) {
        action = `<span style="font-size:0.8rem; color:var(--text-muted);">by ${r.booked_by_name || "-"}</span>`;
    }

    return `
        <tr>
            <td>${r.room_number}</td>
            <td>TZS ${Number(price).toLocaleString()}</td>
            <td>${capacity} people</td>
            <td>${statusBadge}</td>
            <td>${action}</td>
        </tr>
    `;
}

function renderAddRoomForm(accommodationId) {
    return `
        <div style="margin-top:1rem; padding-top:1rem; border-top:1px solid var(--green-100);">
            <label>Add another room to this accommodation</label>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap; align-items:flex-end;">
                <input type="text" id="newRoomNumber-${accommodationId}" placeholder="Room number, e.g. Room 4" style="flex:1; min-width:140px;">
                <input type="number" id="newRoomPrice-${accommodationId}" placeholder="Price/month (optional)" style="flex:1; min-width:140px;">
                <input type="number" id="newRoomCapacity-${accommodationId}" placeholder="Capacity (optional)" style="flex:1; min-width:120px;">
                <button class="btn btn-sm" onclick="addRoom(${accommodationId})">➕ Add Room</button>
            </div>
            <p class="form-msg" id="addRoomMsg-${accommodationId}"></p>
        </div>
    `;
}

function toggleHotel(accommodationId) {
    expandedHotels[accommodationId] = !expandedHotels[accommodationId];
    const box = document.getElementById(`hotelRooms-${accommodationId}`);
    if (box) box.style.display = expandedHotels[accommodationId] ? "block" : "none";
    // Also flip the button label without a full reload
    loadAccommodations();
}

async function bookRoom(roomId) {
    const user = requireStudent();
    if (!user) return;

    try {
        const res = await fetch(`${API_BASE}/book_room.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "book", user_id: user.id, room_id: roomId }),
        });
        const data = await res.json();
        if (!data.success) alert(data.message);
        loadAccommodations();
    } catch (err) {
        alert("Could not connect to the server.");
    }
}

async function cancelRoom(roomId) {
    const user = requireStudent();
    if (!user) return;

    try {
        const res = await fetch(`${API_BASE}/book_room.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "cancel", user_id: user.id, room_id: roomId }),
        });
        const data = await res.json();
        if (!data.success) alert(data.message);
        loadAccommodations();
    } catch (err) {
        alert("Could not connect to the server.");
    }
}

async function addRoom(accommodationId) {
    const msg = document.getElementById(`addRoomMsg-${accommodationId}`);
    const room_number = document.getElementById(`newRoomNumber-${accommodationId}`).value.trim();
    const price_per_month = document.getElementById(`newRoomPrice-${accommodationId}`).value;
    const capacity = document.getElementById(`newRoomCapacity-${accommodationId}`).value;

    if (!room_number) {
        msg.textContent = "Please enter a room number.";
        msg.className = "form-msg error";
        return;
    }

    msg.textContent = "Adding room...";
    msg.className = "form-msg";

    try {
        const res = await fetch(`${API_BASE}/rooms.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accommodation_id: accommodationId, room_number, price_per_month, capacity }),
        });
        const data = await res.json();
        msg.textContent = data.message;
        msg.className = "form-msg " + (data.success ? "success" : "error");
        if (data.success) {
            expandedHotels[accommodationId] = true;
            setTimeout(loadAccommodations, 600);
        }
    } catch (err) {
        msg.textContent = "Could not connect to the server.";
        msg.className = "form-msg error";
    }
}

loadAccommodations();

// -------- Admin: add a new hotel/lodge --------
const addAccForm = document.getElementById("addAccForm");
if (addAccForm) {
    addAccForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const msg = document.getElementById("accFormMsg");
        const payload = {
            name: document.getElementById("acc_name").value.trim(),
            location: document.getElementById("acc_location").value.trim(),
            default_price_per_month: document.getElementById("acc_price").value || 0,
            default_capacity: document.getElementById("acc_capacity").value || 1,
            description: document.getElementById("acc_description").value.trim(),
            contact_phone: document.getElementById("acc_phone").value.trim(),
            initial_rooms: document.getElementById("acc_initial_rooms").value || 0,
        };
        try {
            const res = await fetch(`${API_BASE}/accommodation.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            msg.textContent = data.message;
            msg.className = "form-msg " + (data.success ? "success" : "error");
            if (data.success) {
                addAccForm.reset();
                loadAccommodations();
            }
        } catch (err) {
            msg.textContent = "Could not connect to the server.";
            msg.className = "form-msg error";
        }
    });
}
