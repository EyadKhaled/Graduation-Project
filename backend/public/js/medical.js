let allRecords = [];

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function userName(u) {
  if (!u) return "—";
  return `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email || "—";
}

function render(records) {
  const tbody  = document.getElementById("table-body");
  const footer = document.getElementById("table-footer");
  if (!records.length) {
    tbody.innerHTML = `<tr class="state-row"><td colspan="9">No medical records found.</td></tr>`;
    footer.textContent = "";
    return;
  }
  tbody.innerHTML = records.map((r, i) => `
  <tr onclick="openDrawer(${i})" style="cursor:pointer">
    <td style="color:#9fb8c8">${i + 1}</td>
    <td><div style="font-weight:500">${r.first_name || "—"} ${r.last_name || ""}</div></td>
    <td style="color:#5e7b8c">${r.email || "—"}</td>
    <td>${r.date_of_birth || "—"}</td>
    <td>${r.gender || "—"}</td>
    <td>${r.phone || "—"}</td>
    <td class="symptoms-text" title="${r.symptoms || ""}">${r.symptoms || "—"}</td>
    <td>
      <div style="font-weight:500">${userName(r.user)}</div>
      <div style="color:#9fb8c8;font-size:0.75rem">${r.user?.email || ""}</div>
    </td>
    <td>${fmt(r.createdAt)}</td>
  </tr>
  `).join("");
  footer.textContent = `Showing ${records.length} record${records.length !== 1 ? "s" : ""} · Click a row for details`;
}

function openDrawer(index) {
  const r = allRecords[index];
  if (!r) return;
  document.getElementById("drawer-content").innerHTML = `
    <h2 style="margin-bottom:24px;color:#0b1f2d">📋 Medical Record</h2>
    <div class="drawer-section">
      <div class="drawer-label">Patient Name</div>
      <div class="drawer-value">${r.first_name || "—"} ${r.last_name || ""}</div>
    </div>
    <div class="drawer-section">
      <div class="drawer-label">Email</div>
      <div class="drawer-value">${r.email || "—"}</div>
    </div>
    <div class="drawer-section">
      <div class="drawer-label">Date of Birth</div>
      <div class="drawer-value">${r.date_of_birth || "—"}</div>
    </div>
    <div class="drawer-section">
      <div class="drawer-label">Gender</div>
      <div class="drawer-value">${r.gender || "—"}</div>
    </div>
    <div class="drawer-section">
      <div class="drawer-label">Phone</div>
      <div class="drawer-value">${r.phone || "—"}</div>
    </div>
    <div class="drawer-section">
      <div class="drawer-label">Symptoms</div>
      <div class="drawer-value" style="line-height:1.7">${r.symptoms || "No symptoms provided."}</div>
    </div>
    <div class="drawer-section">
      <div class="drawer-label">Account (Logged-in User)</div>
      <div class="drawer-value">${userName(r.user)} · ${r.user?.email || "N/A"}</div>
    </div>
    <div class="drawer-section">
      <div class="drawer-label">Submitted</div>
      <div class="drawer-value">${fmt(r.createdAt)}</div>
    </div>
  `;
  document.getElementById("overlay").style.display = "block";
  document.getElementById("drawer").classList.add("open");
}

function closeDrawer() {
  document.getElementById("overlay").style.display = "none";
  document.getElementById("drawer").classList.remove("open");
}

async function load() {
  try {
    const res  = await fetch("/data/api/medical", { credentials: "include" });
    if (res.status === 401) { window.location.href = "/data/login"; return; }
    const json = await res.json();
    allRecords = json.records || [];
    document.getElementById("count-badge").textContent = `${allRecords.length} total`;
    render(allRecords);
  } catch (err) {
    document.getElementById("table-body").innerHTML =
      `<tr class="state-row"><td colspan="9">❌ Failed to load: ${err.message}</td></tr>`;
    document.getElementById("count-badge").textContent = "Error";
  }
}

document.getElementById("search").addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase();
  render(allRecords.filter(r =>
    (`${r.first_name} ${r.last_name}`).toLowerCase().includes(q) ||
    (r.email || "").toLowerCase().includes(q) ||
    (r.symptoms || "").toLowerCase().includes(q) ||
    userName(r.user).toLowerCase().includes(q)
  ));
});

load();