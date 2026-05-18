import express from "express";
import {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  updateMe,
  changePassword,
  deleteMe,
  verifyEmail,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.post("/register/",              register);
router.post("/login/",                 login);
router.post("/logout/",                logout);
router.post("/token/refresh/",         refreshToken);   // POST /api/auth/token/refresh/
router.get ("/verify-email",           verifyEmail);    // GET  /api/auth/verify-email?token=
router.post("/forgot-password/",       forgotPassword);
router.post("/reset-password/",        resetPassword);  // body: { token, password }

// ── Protected ─────────────────────────────────────────────────────────────────
router.get   ("/me/",                  protect, getMe);
router.patch ("/me/",                  protect, updateMe);
router.patch ("/me/change-password/",  protect, changePassword);
router.delete("/me/",                  protect, deleteMe);

export default router;
