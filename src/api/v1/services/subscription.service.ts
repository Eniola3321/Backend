import { PrismaClient, Subscription } from "@prisma/client";

const prisma = new PrismaClient();

class SubscriptionService {
  async getUserSubscriptions(userId: string) {
    return prisma.subscription.findMany({ where: { userId } });
  }

  async updateSubscription(subId: string, updates: Partial<Subscription>) {
    await prisma.subscription.update({
      where: { id: subId },
      data: updates,
    });
  }

  async mergeDuplicates(userId: string) {
    // Logic to find and merge duplicate subs from different sources
    // E.g., group by name, merge data using Prisma transactions
  }
}

export default new SubscriptionService();
