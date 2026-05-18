let allReports = [];

function fmt(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtTime(d) {
    if (!d) return "";
    return new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function verdictPillClass(v) {
    if (v === "Healthy")      return "pill-healthy";
    if (v === "Diseased")     return "pill-diseased";
    return "pill-inconclusive";
}

function qualityDotColor(q) {
    if (q === "good") return "#0abfaa";
    if (q === "poor") return "#ff6b6b";
    return "#f5a623";
}

function userName(u) {
    if (!u) return "—";
    return `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email || "—";
}

function confBarColor(v) {
    if (v === "Healthy")  return "#0abfaa";
    if (v === "Diseased") return "#ff6b6b";
    return "#f5a623";
}

function render(reports) {
    const tbody  = document.getElementById("table-body");
    const footer = document.getElementById("table-footer");
    if (!reports.length) {
        tbody.innerHTML = `<tr class="state-row"><td colspan="8">No reports found.</td></tr>`;
        footer.textContent = "";
        return;
    }
    tbody.innerHTML = reports.map((r, i) => `
    <tr onclick="openDrawer(${i})" style="cursor:pointer">
        <td style="color:#9fb8c8">${i + 1}</td>
        <td class="finding-text" title="${r.image_name || '—'}">${r.image_name || "—"}</td>
        <td><span class="pill ${verdictPillClass(r.verdict)}">${r.verdict}</span></td>
        <td>
            <div style="display:flex;align-items:center;gap:8px">
                <div style="flex:1;height:6px;background:#eaf0f6;border-radius:99px;overflow:hidden;min-width:60px">
                    <div style="height:100%;width:${r.confidence}%;background:${confBarColor(r.verdict)};border-radius:99px"></div>
                </div>
                <span style="font-size:0.8rem;font-weight:700;color:#5e7b8c;min-width:36px">${r.confidence}%</span>
            </div>
        </td>
        <td class="finding-text" title="${r.primary_finding || '—'}" style="max-width:200px">${r.primary_finding || "—"}</td>
        <td>
            ${r.image_quality
                ? `<span class="quality-dot" style="background:${qualityDotColor(r.image_quality)}"></span>${r.image_quality}`
                : "—"}
        </td>
        <td>
            <div style="font-weight:500">${userName(r.user)}</div>
            <div style="color:#9fb8c8;font-size:0.75rem">${r.user?.email || ""}</div>
        </td>
        <td>
            <div>${fmt(r.createdAt)}</div>
            <div style="color:#9fb8c8;font-size:0.75rem">${fmtTime(r.createdAt)}</div>
        </td>
    </tr>
    `).join("");
    footer.textContent = `Showing ${reports.length} report${reports.length !== 1 ? "s" : ""} · Click a row for details`;
}

function openDrawer(index) {
    const r = allReports[index];
    if (!r) return;
    const color = r.verdict === "Healthy" ? "#0abfaa" : r.verdict === "Diseased" ? "#ff6b6b" : "#f5a623";
    document.getElementById("drawer-content").innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
            <span style="font-size:2rem">${r.verdict === "Healthy" ? "✅" : r.verdict === "Diseased" ? "⚠️" : "❓"}</span>
            <div>
                <div class="drawer-label">Diagnosis</div>
                <h2 style="color:${color}">${r.verdict}</h2>
            </div>
            <span style="margin-left:auto;font-size:1.4rem;font-weight:800;color:${color}">${r.confidence}%</span>
        </div>
        <div class="drawer-section">
            <div class="drawer-label">Image</div>
            <div class="drawer-value">${r.image_name || "—"}</div>
        </div>
        <div class="drawer-section">
            <div class="drawer-label">Patient</div>
            <div class="drawer-value">${userName(r.user)} · ${r.user?.email || ""}</div>
        </div>
        <div class="drawer-section">
            <div class="drawer-label">Primary Finding</div>
            <div class="drawer-value" style="line-height:1.6">${r.primary_finding || "—"}</div>
        </div>
        ${r.indicators?.length ? `
        <div class="drawer-section">
            <div class="drawer-label">Indicators</div>
            ${r.indicators.map(ind => `
            <div class="indicator-row">
                <span>${ind.label}</span>
                <span style="color:#5e7b8c">${ind.value} — <b style="color:${ind.status === 'normal' ? '#0abfaa' : ind.status === 'abnormal' ? '#ff6b6b' : '#f5a623'}">${ind.status}</b></span>
            </div>`).join("")}
        </div>` : ""}
        <div class="drawer-section">
            <div class="drawer-label">Recommendation</div>
            <div class="drawer-value" style="line-height:1.6;background:rgba(10,191,170,0.06);padding:12px;border-radius:8px">${r.recommendation || "—"}</div>
        </div>
        ${r.note ? `<div class="drawer-section"><div class="drawer-label">Note</div><div class="drawer-value">${r.note}</div></div>` : ""}
        <div class="drawer-section">
            <div class="drawer-label">Date</div>
            <div class="drawer-value">${fmt(r.createdAt)} ${fmtTime(r.createdAt)}</div>
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
        const res  = await fetch("/data/api/reports", { credentials: "include" });
        if (res.status === 401) { window.location.href = "/data/login"; return; }
        const json = await res.json();
        allReports = json.reports || [];
        document.getElementById("count-badge").textContent = `${allReports.length} total`;
        render(allReports);
    } catch (err) {
        document.getElementById("table-body").innerHTML =
            `<tr class="state-row"><td colspan="8">❌ Failed to load: ${err.message}</td></tr>`;
        document.getElementById("count-badge").textContent = "Error";
    }
}

const searchEl  = document.getElementById("search");
const filterEl  = document.getElementById("verdict-filter");

function filterAndRender() {
    const q = searchEl.value.toLowerCase();
    const v = filterEl.value;
    render(allReports.filter(r => {
        const matchSearch = !q ||
            (r.image_name || "").toLowerCase().includes(q) ||
            userName(r.user).toLowerCase().includes(q) ||
            (r.primary_finding || "").toLowerCase().includes(q);
        const matchVerdict = !v || r.verdict === v;
        return matchSearch && matchVerdict;
    }));
}

searchEl.addEventListener("input", filterAndRender);
filterEl.addEventListener("change", filterAndRender);

load();
