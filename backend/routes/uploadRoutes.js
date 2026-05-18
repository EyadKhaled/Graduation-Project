import express from "express";
import { protect, requireVerified } from "../middleware/auth.js";
import { uploadMiddleware } from "../middleware/upload.js";
import { uploadFile, getHistory, deleteUpload } from "../controllers/uploadController.js";

const router = express.Router();

router.use(protect); // all upload routes require login

// Only verified users can upload — history/delete are accessible to all authenticated users
router.post("/",       requireVerified, uploadMiddleware.single("file"), uploadFile);
router.get("/",        getHistory);
router.delete("/:id/", deleteUpload);

export default router;
