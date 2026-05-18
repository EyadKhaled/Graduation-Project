import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import authRoutes     from "./routes/authRoutes.js";
import uploadRoutes   from "./routes/uploadRoutes.js";
import medicalRoutes  from "./routes/medicalRoutes.js";
import helpdeskRoutes from "./routes/helpdeskRoutes.js";
import analysisRoutes from "./routes/analysisRoutes.js";
import dataRoutes     from "./routes/dataRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Connect to MongoDB ────────────────────────────────────────────────────────
await connectDB();

const app = express();

// ── Security & logging ────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:", "blob:"],
      },
    },
  })
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Rate limiting (auth endpoints only) ──────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 30,                    // max 30 auth requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
});
app.use("/api/auth", authLimiter);

// ── Serve uploaded files statically ──────────────────────────────────────────
// e.g. GET http://localhost:8000/uploads/abc123.jpg
app.use(
  "/uploads",
  express.static(path.join(__dirname, process.env.UPLOAD_DIR || "uploads"))
);

app.use(express.static(path.join(__dirname, 'public')));

// ── API Routes ────────────────────────────────────────────────────────────────
//
//  Frontend service → Backend route
//  ─────────────────────────────────────────────────────────────────
//  authService     → /api/auth/...
//  uploadService   → /api/uploads/...
//  medicalService  → /api/medical/...
//  helpdeskService → /api/helpdesk/...
//
app.use("/api/auth",      authRoutes);
app.use("/api/uploads",   uploadRoutes);
app.use("/api/medical",   medicalRoutes);
app.use("/api/helpdesk",  helpdeskRoutes);
app.use("/api/analysis",  analysisRoutes);
app.use("/data",          dataRoutes);      // admin pages: /data/users  /data/images  /data/reports

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ message: `Route ${req.method} ${req.url} not found.` })
);

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err);
  // Multer file size error
  if (err.code === "LIMIT_FILE_SIZE")
    return res.status(413).json({ message: `File too large. Max ${process.env.MAX_FILE_MB || 20} MB.` });
  return res.status(err.statusCode || 500).json({ message: err.message || "Server error." });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8000;
app.listen(PORT, () =>
  console.log(`🚀  GallCare API running on http://localhost:${PORT}`)
);
