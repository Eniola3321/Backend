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
  async createCheckoutSession(priceId: string, userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found.");

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
    });

    return session.url;
  }

  async handleStripeWebhook(event: Stripe.Event) {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerEmail = session.customer_email;
        const stripeSubId = session.subscription as string;

        if (!customerEmail || !stripeSubId) break;

        const user = await prisma.user.findUnique({
          where: { email: customerEmail },
        });
        if (!user) break;

        const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
        const price = stripeSub.items.data[0]?.price;

        const mapStatus = (status: string): SubscriptionStatus => {
          switch (status) {
            case "active":
              return "ACTIVE";
            case "trialing":
              return "TRIAL";
            case "past_due":
              return "PAST_DUE";
            case "canceled":
              return "CANCELED";
            default:
              return "EXPIRED";
          }
        };

        const subscription = await prisma.subscription.create({
          data: {
            userId: user.id,
            serviceName: "Stripe Subscription",
            source: "stripe",
            amount: (price?.unit_amount || 0) / 100,
            currency: stripeSub.currency.toUpperCase(),
            billingCycle: price?.recurring?.interval || "monthly",
            nextRenewal: new Date((stripeSub as any).current_period_end * 1000),
            status: mapStatus(stripeSub.status),
            externalId: stripeSubId,
          },
        });

        await prisma.payment.create({
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

        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeSubId = (invoice as any).subscription as string;

        const subscription = await prisma.subscription.findFirst({
          where: { externalId: stripeSubId },
        });
        if (!subscription) break;

        await prisma.payment.create({
          data: {
            userId: subscription.userId,
            subscriptionId: subscription.id,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency.toUpperCase(),
            method: PaymentMethod.STRIPE,
            status: PaymentStatus.SUCCESS,
            providerTxId: (invoice as any).payments_intent as string,
            paidAt: new Date(),
          },
        });

        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: "ACTIVE",
            nextRenewal: new Date(
              (invoice.lines.data[0]?.period?.end ||
                Math.floor(Date.now() / 1000)) * 1000
            ),
          },
        });

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeSubId = (invoice as any).subscription as string;

        const subscription = await prisma.subscription.findFirst({
          where: { externalId: stripeSubId },
        });
        if (!subscription) break;

        await prisma.payment.create({
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

        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "PAST_DUE" },
        });

        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const stripeSubId = sub.id;

        const subscription = await prisma.subscription.findFirst({
          where: { externalId: stripeSubId },
        });
        if (!subscription) break;

        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "CANCELED" },
        });

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  async cancelSubscription(subscriptionId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: { externalId: subscriptionId },
    });
    if (!subscription) throw new Error("Subscription not found.");

    await stripe.subscriptions.cancel(subscriptionId);

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "CANCELED" },
    });

    return { message: "Subscription canceled successfully." };
  }

  async getUserSubscriptions(userId: string) {
    return prisma.subscription.findMany({
      where: { userId },
      include: { payments: true },
      orderBy: { createdAt: "desc" },
    });
  }
}

export const paymentService = new PaymentService();
