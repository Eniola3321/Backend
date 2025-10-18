import express from "express";
import {
  getSubscriptions,
  updateSubscription,
} from "../controllers/subscription.controller";
import { authenticate } from "../controllers/auth.middleware";

const router = express.Router();

router.get("/", authenticate, getSubscriptions);
router.put("/:subId", authenticate, updateSubscription);

export default router;
