import { PrismaClient } from "@prisma/client";
import ScoringService from "./scoring.service";

const prisma = new PrismaClient();

class UsageService {
  /**
   * Get all usage data for a given user
   */
  async getAllForUser(userId: string) {
    return prisma.usage.findMany({
      where: { subscription: { userId } },
      include: { subscription: true },
    });
  }

  /**
   * Create or update usage record
   */
  async upsertUsage(userId: string, data: any) {
    const { subscriptionId, lastEmailDate, lastApiUse, lastLogin, status } =
      data;

    const sub = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
    });
    if (!sub) throw new Error("Subscription not found or not owned by user");

    const usage = await prisma.usage.upsert({
      where: { subscriptionId },
      update: { lastEmailDate, lastApiUse, lastLogin, status },
      create: { subscriptionId, lastEmailDate, lastApiUse, lastLogin, status },
    });

    await ScoringService.computeScore(subscriptionId);
    return usage;
  }

  /**
   * Delete a usage record
   */
  async deleteUsage(userId: string, usageId: string) {
    const usage = await prisma.usage.findUnique({
      where: { id: usageId },
      include: { subscription: true },
    });

    if (!usage || usage.subscription.userId !== userId)
      throw new Error("Usage record not found or unauthorized");

    await prisma.usage.delete({ where: { id: usageId } });
    return true;
  }
}

export default new UsageService();
