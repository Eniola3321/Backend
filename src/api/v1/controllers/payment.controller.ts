import { Request, Response } from "express";
import Stripe from "stripe";
import { paymentService } from "../services/paymentService";
import config from "../../config/config";

const stripe = new Stripe(config.stripeSecretKey as string);

export class PaymentController {
  /**
   * Create Stripe Checkout Session
   * POST /api/payments/create-checkout-session
   */
  static async createCheckoutSession(req: Request, res: Response) {
    try {
      const { priceId, userId } = req.body;

      if (!priceId || !userId) {
        return res
          .status(400)
          .json({ message: "Missing required fields: priceId, userId" });
      }

      const url = await paymentService.createCheckoutSession(priceId, userId);

      res.status(200).json({ url });
    } catch (err: any) {
      console.error("[PaymentController] Create Checkout Error:", err.message);
      res.status(500).json({ error: "Failed to create checkout session." });
    }
  }

  /**
   * Handle Stripe Webhook Events
   * POST /api/payments/webhook
   */
  static async handleWebhook(req: Request, res: Response) {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    try {
      if (!sig) {
        return res.status(400).send("Missing Stripe signature header.");
      }

      // Stripe requires the raw body, not JSON-parsed
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret
      );

      await paymentService.handleStripeWebhook(event);

      res.status(200).json({ received: true });
    } catch (err: any) {
      console.error("[PaymentController] Webhook Error:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }

  /**
   * Cancel a subscription
   * DELETE /api/payments/cancel/:subscriptionId
   */
  static async cancelSubscription(req: Request, res: Response) {
    try {
      const { subscriptionId } = req.params;

      if (!subscriptionId) {
        return res
          .status(400)
          .json({ message: "Subscription ID is required." });
      }

      const result = await paymentService.cancelSubscription(subscriptionId);

      res.status(200).json(result);
    } catch (err: any) {
      console.error(
        "[PaymentController] Cancel Subscription Error:",
        err.message
      );
      res.status(500).json({ error: "Failed to cancel subscription." });
    }
  }

  /**
   * Get all subscriptions for a specific user
   * GET /api/payments/subscriptions/:userId
   */
  static async getUserSubscriptions(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required." });
      }

      const subscriptions = await paymentService.getUserSubscriptions(userId);

      res.status(200).json(subscriptions);
    } catch (err: any) {
      console.error(
        "[PaymentController] Fetch Subscriptions Error:",
        err.message
      );
      res.status(500).json({ error: "Failed to retrieve subscriptions." });
    }
  }
}
