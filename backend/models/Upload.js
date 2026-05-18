import mongoose from "mongoose";

const uploadSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    file_name: { type: String, required: true },   // original filename
    stored_name: { type: String, required: true }, // filename on disk (uuid-based)
    file_type: { type: String, required: true },   // MIME type e.g. image/jpeg
    size: { type: Number, required: true },        // bytes
    path: { type: String, required: true },        // relative path on server
  },
  { timestamps: true }
);

// Virtual: expose id as string for the frontend
uploadSchema.set("toJSON", {
  virtuals: true,
  transform(_, ret) {
    delete ret.__v;
  },
});

const Upload = mongoose.model("Upload", uploadSchema);
export default Upload;
