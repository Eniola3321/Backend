import express from "express";
import bodyParser from "body-parser";
import { PaymentController } from "../controllers/payment.controller";
import { authenticate } from "../controllers/auth.middleware";

const router = express.Router();
router.use(authenticate);
router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  PaymentController.handleWebhook
);

router.post(
  "/create-checkout-session",
  express.json(),
  PaymentController.createCheckoutSession
);
router.delete("/cancel/:subscriptionId", PaymentController.cancelSubscription);
router.get("/subscriptions/:userId", PaymentController.getUserSubscriptions);

export default router;
