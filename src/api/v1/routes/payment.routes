import express from "express";
import bodyParser from "body-parser";
import { PaymentController } from "../controllers/payment.controller";

const router = express.Router();

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
