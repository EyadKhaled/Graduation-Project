let allImages = [];

function fmtSize(bytes) {
    if (!bytes) return "—";
    if (bytes < 1024)       return `${bytes} B`;
    if (bytes < 1048576)    return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}

function fmt(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function userName(u) {
    if (!u) return "—";
    return `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email || "—";
}

// Determine the backend base URL (same origin as this page)
const BASE = window.location.origin;

function render(images) {
    const tbody  = document.getElementById("table-body");
    const footer = document.getElementById("table-footer");
    if (!images.length) {
        tbody.innerHTML = `<tr class="state-row"><td colspan="7">No images found.</td></tr>`;
        footer.textContent = "";
        return;
    }
    tbody.innerHTML = images.map((img, i) => {
        const isImage = img.file_type && img.file_type.startsWith("image/");
        // Build a clickable image tag that opens the full image in a new tab
        const imgUrl = `${BASE}/uploads/${img.stored_name}`;
        const preview = isImage
            ? `<a href="${imgUrl}" target="_blank" title="Open full image">
                 <img class="thumb" src="${imgUrl}" alt="${img.file_name}" loading="lazy"
                      onerror="this.parentNode.innerHTML='<div class=\\"thumb-placeholder\\">🖼️</div>'" />
               </a>`
            : `<div class="thumb-placeholder">📄</div>`;
        const ext = (img.file_name || "").split(".").pop().toUpperCase() || "—";
        return `
        <tr>
            <td style="color:#9fb8c8">${i + 1}</td>
            <td>${preview}</td>
            <td>
                <div class="file-name">${img.file_name || "—"}</div>
                <div style="color:#9fb8c8;font-size:0.75rem">${img._id}</div>
            </td>
            <td><span class="pill pill-blue">${ext}</span></td>
            <td>${fmtSize(img.size)}</td>
            <td>
                <div style="font-weight:500">${userName(img.user)}</div>
                <div style="color:#9fb8c8;font-size:0.75rem">${img.user?.email || ""}</div>
            </td>
            <td>${fmt(img.createdAt)}</td>
        </tr>`;
    }).join("");
    footer.textContent = `Showing ${images.length} image${images.length !== 1 ? "s" : ""}`;
}

async function load() {
    try {
        const res  = await fetch("/data/api/images", { credentials: "include" });
        if (res.status === 401) { window.location.href = "/data/login"; return; }
        const json = await res.json();
        allImages  = json.images || [];
        document.getElementById("count-badge").textContent = `${allImages.length} total`;
        render(allImages);
    } catch (err) {
        document.getElementById("table-body").innerHTML =
            `<tr class="state-row"><td colspan="7">❌ Failed to load: ${err.message}</td></tr>`;
        document.getElementById("count-badge").textContent = "Error";
    }
}

document.getElementById("search").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    render(allImages.filter(img =>
        (img.file_name || "").toLowerCase().includes(q) ||
        userName(img.user).toLowerCase().includes(q)
    ));
});

load();
