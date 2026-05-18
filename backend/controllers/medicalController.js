import MedicalHistory from "../models/MedicalHistory.js";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/medical/history/
// ─────────────────────────────────────────────────────────────────────────────
export const save = async (req, res) => {
  try {
    const { first_name, last_name, date_of_birth, gender, phone, email, symptoms } = req.body;

    if (!first_name || !last_name || !date_of_birth || !email)
      return res.status(400).json({ message: "first_name, last_name, date_of_birth and email are required." });

    const record = await MedicalHistory.create({
      user: req.user._id,
      first_name,
      last_name,
      date_of_birth,
      gender:   gender   ?? "",
      phone:    phone    ?? "",
      email,
      symptoms: symptoms ?? "",
    });

    return res.status(201).json(record);
  } catch (err) {
    console.error("medical.save:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/medical/history/
// ─────────────────────────────────────────────────────────────────────────────
export const getAll = async (req, res) => {
  try {
    const records = await MedicalHistory.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json(records);
  } catch (err) {
    console.error("medical.getAll:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/medical/history/:id/
// ─────────────────────────────────────────────────────────────────────────────
export const getById = async (req, res) => {
  try {
    const record = await MedicalHistory.findOne({ _id: req.params.id, user: req.user._id });
    if (!record) return res.status(404).json({ message: "Record not found." });
    return res.status(200).json(record);
  } catch (err) {
    console.error("medical.getById:", err);
    return res.status(500).json({ message: "Server error." });
  }
};
