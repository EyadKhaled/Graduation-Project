import mongoose from "mongoose";

const helpdeskSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true },
    topic: { type: String, required: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

helpdeskSchema.set("toJSON", {
  virtuals: true,
  transform(_, ret) { delete ret.__v; },
});

const HelpDesk = mongoose.model("HelpDesk", helpdeskSchema);
export default HelpDesk;
