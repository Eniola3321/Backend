import express from "express";
import { getInsights } from "../controllers/insights.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = express.Router();

router.get("/", authenticate, getInsights);

export default router;
