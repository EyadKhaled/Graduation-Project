import express from "express";
import { protect, requireVerified } from "../middleware/auth.js";
import { analyze, getMyReports } from "../controllers/analysisController.js";

const router = express.Router();
router.use(protect);

// Only verified users may run analysis — unverified users get a clear 403
router.post("/analyze/", requireVerified, analyze);
router.get("/",          getMyReports);

export default router;
