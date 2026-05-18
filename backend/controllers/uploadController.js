import path from "path";
import fs from "fs";
import Upload from "../models/Upload.js";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/uploads/
// Body: multipart/form-data  { file, file_name, file_type }
// ─────────────────────────────────────────────────────────────────────────────
export const uploadFile = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No file received." });

    const record = await Upload.create({
      user:        req.user._id,
      file_name:   req.body.file_name || req.file.originalname,
      stored_name: req.file.filename,
      file_type:   req.body.file_type || req.file.mimetype,
      size:        req.file.size,
      path:        req.file.path,
    });

    return res.status(201).json(record);
  } catch (err) {
    console.error("uploadFile:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/uploads/
// Returns the authenticated user's upload history (newest first)
// ─────────────────────────────────────────────────────────────────────────────
export const getHistory = async (req, res) => {
  try {
    const uploads = await Upload.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json(uploads);
  } catch (err) {
    console.error("getHistory:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/uploads/:id/
// ─────────────────────────────────────────────────────────────────────────────
export const deleteUpload = async (req, res) => {
  try {
    const upload = await Upload.findOne({ _id: req.params.id, user: req.user._id });
    if (!upload) return res.status(404).json({ message: "Upload not found." });

    // Remove file from disk
    if (fs.existsSync(upload.path)) fs.unlinkSync(upload.path);

    await upload.deleteOne();
    return res.status(200).json({ message: "Upload deleted." });
  } catch (err) {
    console.error("deleteUpload:", err);
    return res.status(500).json({ message: "Server error." });
  }
};
