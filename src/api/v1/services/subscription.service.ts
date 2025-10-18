import { PrismaClient, Subscription } from "@prisma/client";
// import { isEqual } from "lodash";

const prisma = new PrismaClient();

class SubscriptionService {
  async createSubscription(userId: string, data: Partial<Subscription>) {
    return prisma.subscription.create({
      data: { ...data, userId },
    });
  }

  async getSubscriptionById(subId: string) {
    return prisma.subscription.findUnique({
      where: { id: subId },
      include: {
        usage: true,
        insights: true,
      },
    });
  }

  async getUserSubscriptions(
    userId: string,
    status?: string,
    limit = 20,
    skip = 0
  ) {
    return prisma.subscription.findMany({
      where: {
        userId,
        ...(status && { subscriptionStatus: status }),
      },
      take: limit,
      skip,
      orderBy: { createdAt: "desc" },
    });
  }

  async updateSubscription(subId: string, updates: Partial<Subscription>) {
    return prisma.subscription.update({
      where: { id: subId },
      data: updates,
    });
  }

  async deactivateSubscription(subId: string) {
    return prisma.subscription.update({
      where: { id: subId },
      data: { subscriptionStatus: "INACTIVE" },
    });
  }

  async deleteSubscription(subId: string) {
    return prisma.subscription.delete({ where: { id: subId } });
  }

  async updateBillingInfo(
    subId: string,
    amount: number,
    nextBillingDate: Date
  ) {
    return prisma.subscription.update({
      where: { id: subId },
      data: {
        monthlyCost: amount,
        nextBillingDate,
      },
    });
  }

  async getActiveSubscriptions(userId: string) {
    return prisma.subscription.findMany({
      where: {
        userId,
        subscriptionStatus: "ACTIVE",
      },
    });
  }

  async mergeDuplicates(userId: string) {
    const subs = await prisma.subscription.findMany({ where: { userId } });
    const groups = new Map<string, Subscription[]>();

    for (const sub of subs) {
      const key = sub.name.trim().toLowerCase();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)?.push(sub);
    }

    for (const [, group] of groups) {
      if (group.length > 1) {
        const primary = group[0];
        const duplicates = group.slice(1);

        const avgCost =
          group.reduce((sum, s) => sum + (s.monthlyCost || 0), 0) /
          group.length;
        const latestNextBilling = group
          .map((s) => s.nextBillingDate)
          .filter(Boolean)
          .sort((a, b) => (a! > b! ? -1 : 1))[0];

        await prisma.$transaction(async (tx) => {
          await tx.subscription.update({
            where: { id: primary.id },
            data: {
              monthlyCost: avgCost,
              nextBillingDate: latestNextBilling,
            },
          });

          for (const dup of duplicates) {
            await tx.subscription.delete({ where: { id: dup.id } });
          }
        });
      }
    }
  }
}

export default new SubscriptionService();
