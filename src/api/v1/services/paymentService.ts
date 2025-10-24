import Stripe from "stripe";
import {
  PrismaClient,
  PaymentStatus,
  PaymentMethod,
  SubscriptionStatus,
} from "@prisma/client";
import config from "../../config/config";

const prisma = new PrismaClient();
const stripe = new Stripe(config.stripeSecretKey as string);

export class PaymentService {
  /**
   * Create a Stripe Checkout Session for subscription
   * @param userId - The ID of the user
   * @param amount - The subscription amount in dollars
   * @param currency - The currency code (e.g., 'usd')
   * @param billingCycle - The billing cycle ('month' or 'year')
   * @returns The checkout session URL
   */
  async createCheckoutSession(
    userId: string,
    amount: number,
    currency: string = "usd",
    billingCycle: string = "month"
  ): Promise<string> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error("User not found.");
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: "Subscription",
            },
            unit_amount: amount * 100,
            recurring: {
              interval: billingCycle as "month" | "year",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
    });

    return session.url!;
  }

  /**
   * Handle Stripe webhook events
   * @param event - The Stripe event
   */
  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case "checkout.session.completed":
        await this.handleCheckoutSessionCompleted(event);
        break;
      case "invoice.payment_succeeded":
        await this.handleInvoicePaymentSucceeded(event);
        break;
      case "invoice.payment_failed":
        await this.handleInvoicePaymentFailed(event);
        break;
      case "customer.subscription.deleted":
        await this.handleSubscriptionDeleted(event);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleCheckoutSessionCompleted(
    event: Stripe.Event
  ): Promise<void> {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerEmail = session.customer_email;
    const stripeSubId = session.subscription as string;

    if (!customerEmail || !stripeSubId) return;

    const user = await prisma.user.findUnique({
      where: { email: customerEmail },
    });
    if (!user) return;

    const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
    const price = stripeSub.items.data[0]?.price;

    const mapStatus = (status: string): SubscriptionStatus => {
      switch (status) {
        case "active":
          return SubscriptionStatus.ACTIVE;
        case "trialing":
          return SubscriptionStatus.TRIAL;
        case "past_due":
          return SubscriptionStatus.PAST_DUE;
        case "canceled":
          return SubscriptionStatus.CANCELED;
        default:
          return SubscriptionStatus.EXPIRED;
      }
    };

    await prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.create({
        data: {
          userId: user.id,
          serviceName: "Stripe Subscription",
          source: "stripe",
          amount: (price?.unit_amount || 0) / 100,
          currency: stripeSub.currency.toUpperCase(),
          billingCycle: price?.recurring?.interval || "month",
          nextRenewal: new Date((stripeSub as any).current_period_end * 1000),
          status: mapStatus(stripeSub.status),
          externalId: stripeSubId,
        },
      });

      await tx.payment.create({
        data: {
          userId: user.id,
          subscriptionId: subscription.id,
          amount: (price?.unit_amount || 0) / 100,
          currency: stripeSub.currency.toUpperCase(),
          method: PaymentMethod.STRIPE,
          status: PaymentStatus.SUCCESS,
          providerTxId: session.payment_intent as string,
          paidAt: new Date(),
        },
      });
    });
  }

  private async handleInvoicePaymentSucceeded(
    event: Stripe.Event
  ): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;
    const stripeSubId = (invoice as any).subscription as string;

    const subscription = await prisma.subscription.findFirst({
      where: { externalId: stripeSubId },
    });
    if (!subscription) return;

    await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          userId: subscription.userId,
          subscriptionId: subscription.id,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency.toUpperCase(),
          method: PaymentMethod.STRIPE,
          status: PaymentStatus.SUCCESS,
          providerTxId: (invoice as any).payment_intent as string,
          paidAt: new Date(),
        },
      });

      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: SubscriptionStatus.ACTIVE,
          nextRenewal: new Date(
            (invoice.lines.data[0]?.period?.end ||
              Math.floor(Date.now() / 1000)) * 1000
          ),
        },
      });
    });
  }

  private async handleInvoicePaymentFailed(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;
    const stripeSubId = (invoice as any).subscription as string;

    const subscription = await prisma.subscription.findFirst({
      where: { externalId: stripeSubId },
    });
    if (!subscription) return;

    await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          userId: subscription.userId,
          subscriptionId: subscription.id,
          amount: invoice.amount_due / 100,
          currency: invoice.currency.toUpperCase(),
          method: PaymentMethod.STRIPE,
          status: PaymentStatus.FAILED,
          providerTxId: (invoice as any).payment_intent as string,
        },
      });

      await tx.subscription.update({
        where: { id: subscription.id },
        data: { status: SubscriptionStatus.PAST_DUE },
      });
    });
  }

  private async handleSubscriptionDeleted(event: Stripe.Event): Promise<void> {
    const sub = event.data.object as Stripe.Subscription;
    const stripeSubId = sub.id;

    const subscription = await prisma.subscription.findFirst({
      where: { externalId: stripeSubId },
    });
    if (!subscription) return;

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.CANCELED },
    });
  }

  /**
   * Cancel a subscription
   * @param subscriptionId - The external subscription ID
   * @returns Success message
   */
  async cancelSubscription(
    subscriptionId: string
  ): Promise<{ message: string }> {
    const subscription = await prisma.subscription.findFirst({
      where: { externalId: subscriptionId },
    });
    if (!subscription) {
      throw new Error("Subscription not found.");
    }

    await stripe.subscriptions.cancel(subscriptionId);

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.CANCELED },
    });

    return { message: "Subscription canceled successfully." };
  }

  /**
   * Get all subscriptions for a user
   * @param userId - The user ID
   * @returns List of subscriptions with payments
   */
  async getUserSubscriptions(userId: string) {
    return prisma.subscription.findMany({
      where: { userId },
      include: { payments: true },
      orderBy: { createdAt: "desc" },
    });
  }
}

export const paymentService = new PaymentService();
