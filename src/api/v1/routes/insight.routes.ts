import express from "express";
import { authenticate } from "../controllers/auth.middleware";
import {
  generateInsights,
  getUserInsights,
} from "../controllers/insight.controller";

const router = express.Router();

/**
 * @route GET /api/insights
 * @desc Fetch existing insights for the authenticated user
 * @access Private
 */
router.get("/", authenticate, getUserInsights);

/**
 * @route POST /api/insights/generate
 * @desc Generate new insights (recomputes usage scores, sends notifications)
 * @access Private
 */
router.post("/generate", authenticate, generateInsights);

export default router;
