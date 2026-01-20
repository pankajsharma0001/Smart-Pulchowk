import express from "express";
import { chatAI } from "../controllers/chatBot.controller.js";

const router = express.Router();

router.post("/chat", chatAI);

export default router;