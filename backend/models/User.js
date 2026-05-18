import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    last_name: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // never returned in queries by default
    },

    // Email verification
    isVerified: { type: Boolean, default: false },
    verificationToken: String,
    verificationTokenExpiry: Date,

    // Password reset
    resetPasswordToken: String,
    resetPasswordTokenExpiry: Date,

    lastLogin: { type: Date, default: null },
  },
  { timestamps: true }
);

// ── Hash password before save ─────────────────────────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Compare plain password against stored hash ────────────────────────────────
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// ── Generate a SHA-256-hashed email verification token ────────────────────────
userSchema.methods.generateVerificationToken = function () {
  const raw = crypto.randomBytes(32).toString("hex");
  this.verificationToken = crypto.createHash("sha256").update(raw).digest("hex");
  this.verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 h
  return raw; // only the raw token is emailed; the hash is stored
};

// ── Generate a SHA-256-hashed password reset token ───────────────────────────
userSchema.methods.generateResetPasswordToken = function () {
  const raw = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = crypto.createHash("sha256").update(raw).digest("hex");
  this.resetPasswordTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 h
  return raw;
};

const User = mongoose.model("User", userSchema);
export default User;
