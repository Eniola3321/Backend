import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class ScoringService {
  async computeScore(subId: string) {
    const usage = await prisma.usage.findFirst({
      where: { subscriptionId: subId },
    });
    if (!usage) return 0;
    // Compute score 0-100 based on recency of lastApiUse, lastEmailDate, lastLogin
    // Example: weighted average of days since each event
    const score =
      100 -
      (Date.now() - (usage.lastApiUse?.getTime() ?? 0)) / (1000 * 60 * 60 * 24); // Simplified
    let status: "ACTIVE" | "AT_RISK" | "UNUSED" = "UNUSED";
    if (score > 70) status = "ACTIVE";
    else if (score > 30) status = "AT_RISK";
    await prisma.usage.update({
      where: { id: usage.id },
      data: { usageScore: score, status },
    });
    return score;
  }
}

export default new ScoringService();
