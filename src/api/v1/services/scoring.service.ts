import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class ScoringService {
  async computeScore(subId: string) {
    const usage = await prisma.usage.findFirst({
      where: { subscriptionId: subId },
    });
    if (!usage) return 0;
    // Compute score 0-100 based on recency of lastApiUsage, lastEmailReceipt, lastLogin
    // Example: weighted average of days since each event
    const score =
      100 -
      (Date.now() - (usage.lastApiUsage?.getTime() ?? 0)) /
        (1000 * 60 * 60 * 24); // Simplified
    let classification: string = "unused";
    if (score > 70) classification = "active";
    else if (score > 30) classification = "at-risk";
    await prisma.usage.update({
      where: { id: usage.id },
      data: { score, classification },
    });
    return score;
  }
}

export default new ScoringService();
