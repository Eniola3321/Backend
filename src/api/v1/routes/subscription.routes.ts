import express from "express";
import {
  getSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  deactivateSubscription,
  deleteSubscription,
  mergeDuplicateSubscriptions,
} from "../controllers/subscription.controller";
import { authenticate } from "../controllers/auth.middleware";

const router = express.Router();

router.get("/", authenticate, getSubscriptions);

router.get("/:subId", authenticate, getSubscriptionById);

router.post("/", authenticate, createSubscription);

router.put("/:subId", authenticate, updateSubscription);

router.patch("/:subId/deactivate", authenticate, deactivateSubscription);

router.delete("/:subId", authenticate, deleteSubscription);

router.post("/merge", authenticate, mergeDuplicateSubscriptions);

export default router;
