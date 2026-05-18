let allUsers = [];

function fmt(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function initials(u) {
    return ((u.first_name?.[0] || "") + (u.last_name?.[0] || "")).toUpperCase() || "?";
}

function render(users) {
    const tbody = document.getElementById("table-body");
    const footer = document.getElementById("table-footer");

    if (!users.length) {
        tbody.innerHTML = `<tr class="state-row"><td colspan="6">No users found.</td></tr>`;
        footer.textContent = "";
        return;
    }

    tbody.innerHTML = users.map((u, i) => `
    <tr>
        <td style="color:#9fb8c8">${i + 1}</td>
        <td>
            <div class="name-cell">
                <div class="avatar">${initials(u)}</div>
                <div>
                    <div style="font-weight:600">${u.first_name} ${u.last_name}</div>
                    <div style="color:#9fb8c8;font-size:0.78rem">ID: ${u._id}</div>
                </div>
            </div>
        </td>
        <td>${u.email}</td>
        <td>
            <span class="pill ${u.isVerified ? "pill-green" : "pill-orange"}">
                ${u.isVerified ? "✓ Verified" : "⏳ Pending"}
            </span>
        </td>
        <td>${fmt(u.lastLogin)}</td>
        <td>${fmt(u.createdAt)}</td>
    </tr>
    `).join("");

    footer.textContent = `Showing ${users.length} user${users.length !== 1 ? "s" : ""}`;
}

async function load() {
    try {
        const res  = await fetch("/data/api/users", { credentials: "include" });
        if (res.status === 401) { window.location.href = "/data/login"; return; }
        const json = await res.json();
        allUsers   = json.users || [];
        document.getElementById("count-badge").textContent = `${allUsers.length} total`;
        render(allUsers);
    } catch (err) {
        document.getElementById("table-body").innerHTML =
            `<tr class="state-row"><td colspan="6">❌ Failed to load users: ${err.message}</td></tr>`;
        document.getElementById("count-badge").textContent = "Error";
    }
}

document.getElementById("search").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    render(allUsers.filter(u =>
        `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(q)
    ));
});

load();
