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
router.use(authenticate);
router.get("/", getSubscriptions);
router.get("/:subId", getSubscriptionById);
router.post("/", createSubscription);
router.put("/:subId", updateSubscription);
router.patch("/:subId/deactivate", deactivateSubscription);
router.delete("/:subId", deleteSubscription);
router.post("/merge", mergeDuplicateSubscriptions);

export default router;
