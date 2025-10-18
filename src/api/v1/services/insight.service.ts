import { PrismaClient } from "@prisma/client";
import ScoringService from "./scoring.service";
import NotificationService from "../services/notification.service";

const prisma = new PrismaClient();

class InsightsService {
  async generateInsights(userId: string) {
    const subs = await prisma.subscription.findMany({ where: { userId } });
    const insights = [];
    for (const sub of subs) {
      await ScoringService.computeScore(sub.id);
      const usage = await prisma.usage.findFirst({
        where: { subscriptionId: sub.id },
      });
      if (usage?.classification === "unused") {
        const insight = await prisma.insight.create({
          data: {
            userId,
            subscriptionId: sub.id,
            recommendation: "cancel",
            savings: sub.cost,
          },
        });
        insights.push(insight);
      }
      // Check for overlaps (e.g., multiple AI tools)
    }
    // Send notifications
    await NotificationService.sendWeeklySummary(userId, insights);
    return insights;
  }
}

export default new InsightsService();
