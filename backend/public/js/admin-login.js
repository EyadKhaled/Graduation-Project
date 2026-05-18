const input = document.getElementById("pwd");
const errEl = document.getElementById("err");

input.addEventListener("keydown", (e) => { if (e.key === "Enter") attempt(); });
input.addEventListener("input", () => { input.classList.remove("error"); errEl.classList.remove("show"); });

const btn = document.getElementById("btn");

btn.addEventListener("click", attempt);

async function attempt() {
    const pwd = input.value.trim();
    if (!pwd) { input.classList.add("error"); return; }

    btn.textContent = "Checking…"; btn.disabled = true;

    try {
    const res  = await fetch("/data/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: pwd }),
    });
    const data = await res.json();

    if (res.ok && data.ok) {
        // Redirect to users dashboard
        window.location.href = "/data/users";
    } else {
        input.value = "";
        input.classList.add("error");
        errEl.classList.add("show");
        input.focus();
    }
    } catch {
    errEl.textContent = "Server error. Please try again.";
    errEl.classList.add("show");
    } finally {
    btn.textContent = "Enter Dashboard"; btn.disabled = false;
    }
}