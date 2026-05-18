import express from "express";
import { protect } from "../middleware/auth.js";
import { save, getAll, getById } from "../controllers/medicalController.js";

const router = express.Router();

router.use(protect);

router.post("/history/",      save);
router.get ("/history/",      getAll);
router.get ("/history/:id/",  getById);

export default router;
