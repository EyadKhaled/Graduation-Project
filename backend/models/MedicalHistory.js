import mongoose from "mongoose";

const medicalHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    first_name:    { type: String, required: true, trim: true },
    last_name:     { type: String, required: true, trim: true },
    date_of_birth: { type: String, required: true },   // ISO date string "YYYY-MM-DD"
    gender:        { type: String, enum: ["Male", "Female", "Prefer not to say", ""] },
    phone:         { type: String, default: "" },
    email:         { type: String, required: true, trim: true },
    symptoms:      { type: String, default: "" },
  },
  { timestamps: true }
);

medicalHistorySchema.set("toJSON", {
  virtuals: true,
  transform(_, ret) { delete ret.__v; },
});

const MedicalHistory = mongoose.model("MedicalHistory", medicalHistorySchema);
export default MedicalHistory;
