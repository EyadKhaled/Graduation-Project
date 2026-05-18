import express from "express";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { getAllUsers, getAllImages, getAllReports, getAllMedicalRecords } from "../controllers/dataController.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pagesDir  = path.join(__dirname, "../pages");

const router = express.Router();

// ── Admin password (stored in env or fallback) ────────────────────────────────
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "gallcare-admin-2025";

// ── Admin session cookie name ─────────────────────────────────────────────────
const ADMIN_COOKIE = "gc_admin_session";
const ADMIN_SESSION_VALUE = "authenticated";

// ── Middleware: check admin session cookie ────────────────────────────────────
function requireAdmin(req, res, next) {
  const session = req.cookies?.[ADMIN_COOKIE];
  if (session === ADMIN_SESSION_VALUE) return next();
  // For HTML page requests redirect to login; for API requests return 401
  if (req.accepts("html")) {
    return res.redirect("/data/login");
  }
  return res.status(401).json({ message: "Unauthorized. Admin access required." });
}

// ── GET /data/login → serve login page ───────────────────────────────────────
router.get("/login", (_, res) =>
  res.sendFile(path.join(pagesDir, "admin-login.html"))
);

// ── POST /data/admin-login → verify password, set cookie ─────────────────────
router.post("/admin-login", (req, res) => {
  const { password } = req.body;

  // Use timingSafeEqual to prevent timing-based attacks on the admin password
  let match = false;
  try {
    match = crypto.timingSafeEqual(
      Buffer.from(password  || ""),
      Buffer.from(ADMIN_PASSWORD)
    );
  } catch (_) {
    match = false; // buffers of different length throw — treat as mismatch
  }

  if (match) {
    res.cookie(ADMIN_COOKIE, ADMIN_SESSION_VALUE, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 8 * 60 * 60 * 1000,  // 8 hours
    });
    return res.json({ ok: true });
  }
  return res.status(401).json({ ok: false, message: "Incorrect password." });
});

// ── GET /data/logout ──────────────────────────────────────────────────────────
router.get("/logout", (req, res) => {
  res.clearCookie(ADMIN_COOKIE);
  res.redirect("/data/login");
});

// ── Protected HTML pages ──────────────────────────────────────────────────────
router.get("/users",   requireAdmin, (_, res) => res.sendFile(path.join(pagesDir, "users.html")));
router.get("/images",  requireAdmin, (_, res) => res.sendFile(path.join(pagesDir, "images.html")));
router.get("/reports", requireAdmin, (_, res) => res.sendFile(path.join(pagesDir, "reports.html")));
router.get("/medical", requireAdmin, (_, res) => res.sendFile(path.join(pagesDir, "medical.html")));

// ── Protected JSON API ────────────────────────────────────────────────────────
router.get("/api/users",   requireAdmin, getAllUsers);
router.get("/api/images",  requireAdmin, getAllImages);
router.get("/api/reports", requireAdmin, getAllReports);
router.get("/api/medical", requireAdmin, getAllMedicalRecords);

export default router;
