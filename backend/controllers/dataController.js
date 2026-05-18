import User from "../models/User.js";
import Upload from "../models/Upload.js";
import Report from "../models/Report.js";
import MedicalHistory from "../models/MedicalHistory.js";

// ─────────────────────────────────────────────────────────────────────────────
// GET /data/users
// ─────────────────────────────────────────────────────────────────────────────
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password -verificationToken -verificationTokenExpiry -resetPasswordToken -resetPasswordTokenExpiry")
      .sort({ createdAt: -1 });
    return res.status(200).json({ count: users.length, users });
  } catch (err) {
    console.error("getAllUsers:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /data/images
// ─────────────────────────────────────────────────────────────────────────────
export const getAllImages = async (req, res) => {
  try {
    const images = await Upload.find()
      .populate("user", "first_name last_name email")
      .sort({ createdAt: -1 });
    return res.status(200).json({ count: images.length, images });
  } catch (err) {
    console.error("getAllImages:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /data/reports
// ─────────────────────────────────────────────────────────────────────────────
export const getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("user",   "first_name last_name email")
      .populate("upload", "file_name stored_name")
      .sort({ createdAt: -1 });
    return res.status(200).json({ count: reports.length, reports });
  } catch (err) {
    console.error("getAllReports:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /data/api/medical
// ─────────────────────────────────────────────────────────────────────────────
export const getAllMedicalRecords = async (req, res) => {
  try {
    const records = await MedicalHistory.find()
      .populate("user", "first_name last_name email")
      .sort({ createdAt: -1 });
    return res.status(200).json({ count: records.length, records });
  } catch (err) {
    console.error("getAllMedicalRecords:", err);
    return res.status(500).json({ message: "Server error." });
  }
};
