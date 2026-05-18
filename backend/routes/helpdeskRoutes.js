import express from "express";
import { contact } from "../controllers/helpdeskController.js";

const router = express.Router();

// Public – anyone can contact support (logged in or not)
router.post("/contact/", contact);

export default router;
