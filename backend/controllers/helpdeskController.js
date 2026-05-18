import HelpDesk from "../models/HelpDesk.js";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/helpdesk/contact/
// ─────────────────────────────────────────────────────────────────────────────
export const contact = async (req, res) => {
  try {
    const { email, topic } = req.body;
    if (!email || !topic)
      return res.status(400).json({ message: "Email and topic are required." });

    const ticket = await HelpDesk.create({
      email,
      topic,
      user: req.user?._id ?? null, // optional – user may not be logged in
    });

    return res.status(201).json({ message: "Message received! We'll reply within 24 hours.", id: ticket._id });
  } catch (err) {
    console.error("helpdesk.contact:", err);
    return res.status(500).json({ message: "Server error." });
  }
};
