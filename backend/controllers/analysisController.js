import Report from "../models/Report.js";

// ── Config ────────────────────────────────────────────────────────────────────
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:5001";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function callAIService(image_data, media_type, file_name) {
  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(`${AI_SERVICE_URL}/predict`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ image_data, media_type, file_name }),
      signal:  controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`AI service responded ${res.status}: ${text}`);
    }

    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

// ── POST /api/analysis/analyze/ ───────────────────────────────────────────────
export const analyze = async (req, res) => {
  try {
    const { image_data, media_type, file_name, upload_id } = req.body;

    if (!image_data || !media_type)
      return res.status(400).json({ message: "image_data and media_type are required." });

    let parsed;

    try {
      parsed = await callAIService(image_data, media_type, file_name || "scan");
    } catch (aiErr) {
      console.error("AI service unavailable:", aiErr.message);
      return res.status(503).json({
        message: "AI service is currently unavailable. Please try again later.",
      });
    }

    // Normalise verdict — guard against unexpected values
    const rawVerdict = parsed.verdict || "Inconclusive";
    const safeVerdict = ["Diseased", "Critical", "Inconclusive"].includes(rawVerdict)
      ? rawVerdict
      : "Diseased";

    const report = await Report.create({
      user:            req.user._id,
      upload:          upload_id || null,
      image_name:      file_name || "scan",
      verdict:         safeVerdict,
      confidence:      parsed.confidence,
      disease_type:    parsed.disease_type    || "",
      severity:        parsed.severity        || "",
      primary_finding: parsed.primary_finding,
      recommendation:  parsed.recommendation  || "",
      image_quality:   parsed.image_quality   || "",
      note:            parsed.note            || "",
      indicators:      parsed.indicators      || [],
    });

    return res.status(200).json(report);
  } catch (err) {
    console.error("analyze:", err);
    if (err instanceof SyntaxError)
      return res.status(502).json({ message: "AI returned an unexpected response. Please try again." });
    return res.status(500).json({ message: err.message || "Server error." });
  }
};

// ── GET /api/analysis/ ────────────────────────────────────────────────────────
export const getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json(reports);
  } catch (err) {
    console.error("getMyReports:", err);
    return res.status(500).json({ message: "Server error." });
  }
};