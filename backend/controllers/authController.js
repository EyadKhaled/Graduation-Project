import crypto from "crypto";
import User from "../models/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
} from "../utils/jwt.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/email.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Strip sensitive fields before sending user to frontend */
const sanitize = (user) => ({
  id: user._id,
  first_name: user.first_name,
  last_name: user.last_name,
  email: user.email,
  isVerified: user.isVerified,
  createdAt: user.createdAt,
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register/
// ─────────────────────────────────────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;

    if (!first_name || !last_name || !email || !password)
      return res.status(400).json({ message: "All fields are required." });

    if (password.length < 8)
      return res.status(400).json({ message: "Password must be at least 8 characters." });

    if (await User.findOne({ email }))
      return res.status(409).json({ message: "Email is already registered." });

    const user = new User({ first_name, last_name, email, password });
    const rawToken = user.generateVerificationToken();
    await user.save();

    // Fire-and-forget verification email
    sendVerificationEmail(user, rawToken).catch(console.error);

    const access  = generateAccessToken(user._id);
    const refresh = generateRefreshToken(user._id);
    setRefreshCookie(res, refresh);

    return res.status(201).json({
      access,
      refresh,           // frontend also stores this in localStorage
      user: sanitize(user),
      message: "Account created! Please verify your email.",
    });
  } catch (err) {
    console.error("register:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login/
// ─────────────────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required." });

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: "Invalid email or password." });

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const access  = generateAccessToken(user._id);
    const refresh = generateRefreshToken(user._id);
    setRefreshCookie(res, refresh);

    return res.status(200).json({
      access,
      refresh,
      user: sanitize(user),
    });
  } catch (err) {
    console.error("login:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout/
// ─────────────────────────────────────────────────────────────────────────────
export const logout = (req, res) => {
  clearRefreshCookie(res);
  return res.status(200).json({ message: "Logged out successfully." });
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/token/refresh/   ← matches frontend tryRefreshToken()
// ─────────────────────────────────────────────────────────────────────────────
export const refreshToken = async (req, res) => {
  try {
    // Accept token from cookie OR from body (frontend sends in body)
    const token = req.cookies?.refreshToken || req.body?.refresh;
    if (!token)
      return res.status(401).json({ message: "No refresh token." });

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id);
    if (!user)
      return res.status(401).json({ message: "User not found." });

    const access  = generateAccessToken(user._id);
    const refresh = generateRefreshToken(user._id);
    setRefreshCookie(res, refresh);

    return res.status(200).json({ access, refresh });
  } catch {
    clearRefreshCookie(res);
    return res.status(401).json({ message: "Invalid or expired refresh token." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me/
// ─────────────────────────────────────────────────────────────────────────────
export const getMe = (req, res) =>
  res.status(200).json(sanitize(req.user));

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/verify-email?token=RAW_TOKEN
// ─────────────────────────────────────────────────────────────────────────────
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Token is required." });

    const hashed = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      verificationToken: hashed,
      verificationTokenExpiry: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Token is invalid or has expired." });

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({ message: "Email verified successfully!" });
  } catch (err) {
    console.error("verifyEmail:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password/
// ─────────────────────────────────────────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const user = await User.findOne({ email });
    // Always 200 to prevent email enumeration
    if (!user)
      return res.status(200).json({ message: "If that email exists, a reset link was sent." });

    const raw = user.generateResetPasswordToken();
    await user.save({ validateBeforeSave: false });
    sendPasswordResetEmail(user, raw).catch(console.error);

    return res.status(200).json({ message: "If that email exists, a reset link was sent." });
  } catch (err) {
    console.error("forgotPassword:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/reset-password?token=RAW_TOKEN
// ─────────────────────────────────────────────────────────────────────────────
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.query;
    const { password } = req.body;

    if (!token || !password)
      return res.status(400).json({ message: "Token and new password are required." });

    if (password.length < 8)
      return res.status(400).json({ message: "Password must be at least 8 characters." });

    const hashed = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordTokenExpiry: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Reset token is invalid or has expired." });

    user.password = password; // pre-save hook will re-hash
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiry = undefined;
    await user.save();

    return res.status(200).json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    console.error("resetPassword:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/auth/me/   (update name – no password change here)
// ─────────────────────────────────────────────────────────────────────────────
export const updateMe = async (req, res) => {
  try {
    const { first_name, last_name } = req.body;
    const updates = {};
    if (first_name) updates.first_name = first_name.trim();
    if (last_name)  updates.last_name  = last_name.trim();

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({ message: "Profile updated.", user: sanitize(user) });
  } catch (err) {
    console.error("updateMe:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/auth/me/change-password/
// ─────────────────────────────────────────────────────────────────────────────
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: "Both current and new passwords are required." });
    if (newPassword.length < 8)
      return res.status(400).json({ message: "New password must be at least 8 characters." });

    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.comparePassword(currentPassword)))
      return res.status(401).json({ message: "Current password is incorrect." });

    user.password = newPassword;
    await user.save();
    return res.status(200).json({ message: "Password changed successfully." });
  } catch (err) {
    console.error("changePassword:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/auth/me/
// ─────────────────────────────────────────────────────────────────────────────
export const deleteMe = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    clearRefreshCookie(res);
    return res.status(200).json({ message: "Account deleted." });
  } catch (err) {
    console.error("deleteMe:", err);
    return res.status(500).json({ message: "Server error." });
  }
};
