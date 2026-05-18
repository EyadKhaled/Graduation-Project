import mongoose from "mongoose";

const indicatorSchema = new mongoose.Schema(
  {
    label:  { type: String, required: true },
    value:  { type: String, required: true },
    status: { type: String, enum: ["normal", "abnormal", "borderline"], required: true },
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    upload: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Upload",
      default: null,
    },
    image_name: { type: String, default: "scan" },

    // All classes in the UIdataGB dataset are diseases — no Normal/Healthy class
    verdict: {
      type: String,
      enum: ["Diseased", "Critical", "Inconclusive"],
      required: true,
    },

    confidence: { type: Number, min: 0, max: 100, required: true },

    // Specific disease class predicted by the AI model (9 classes from Mendeley v2)
    disease_type: {
      type: String,
      enum: [
        "Gallstones",
        "Cholecystitis",
        "Gangrenous Cholecystitis",
        "Perforation of GB",
        "Polyps and Cholesterol Crystals",
        "Gallbladder-Wall Thickening",
        "Adenomyomatosis of the GB",
        "Carcinoma",
        "Intraabdominal and Retroperitoneum",
        "",   // empty string kept for backward compatibility
      ],
      default: "",
    },

    // Severity level derived from disease type: "moderate" | "high" | "critical"
    severity: {
      type: String,
      enum: ["moderate", "high", "critical", ""],
      default: "",
    },

    primary_finding: { type: String, required: true },
    recommendation:  { type: String, default: "" },
    image_quality:   { type: String, enum: ["good", "fair", "poor", ""], default: "" },
    note:            { type: String, default: "" },
    indicators:      { type: [indicatorSchema], default: [] },

    // True when the Python AI service was down and Claude was used as backup
    used_fallback: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reportSchema.set("toJSON", {
  virtuals: true,
  transform(_, ret) { delete ret.__v; },
});

const Report = mongoose.model("Report", reportSchema);
export default Report;
