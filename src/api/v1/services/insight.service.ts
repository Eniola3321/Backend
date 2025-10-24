import { PrismaClient } from "@prisma/client";
import ScoringService from "./scoring.service";
import NotificationService from "../services/notification.service";

const prisma = new PrismaClient();

class InsightsService {
  /**
   * Generate insights for a user's subscriptions.
   * - Recomputes usage scores
   * - Identifies unused or overlapping tools
   * - Creates insights and sends notifications
   */
  async generateInsights(userId: string) {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      include: { usage: true },
    });

    const insights = [];

    for (const sub of subscriptions) {
      //  1. Recompute usage score
      await ScoringService.computeScore(sub.id);
      const usage = await prisma.usage.findFirst({
        where: { subscriptionId: sub.id },
      });

      // 2. Detect unused subscriptions
      if (usage?.status === "UNUSED") {
        const insight = await prisma.insight.create({
          data: {
            userId,
            subscriptionId: sub.id,
            type: "recommendation",
            message: `Subscription "${sub.serviceName}" appears unused. Consider canceling to save ${sub.amount} per month.`,
          },
        });
        insights.push(insight);
      }
    }

    // ⚙️3. Detect overlapping AI tools (e.g., OpenAI, Anthropic, Gemini)
    const aiSubs = subscriptions.filter((s) =>
      s.serviceName.toLowerCase().includes("ai")
    );

    if (aiSubs.length > 1) {
      const overlapMessage = `You have ${
        aiSubs.length
      } AI-related subscriptions: ${aiSubs
        .map((s) => s.serviceName)
        .join(", ")}. Consider consolidating to reduce costs.`;

      const overlapInsight = await prisma.insight.create({
        data: {
          userId,
          type: "warning",
          message: overlapMessage,
        },
      });

      insights.push(overlapInsight);
    }

    // 4. Send a summary notification
    if (insights.length > 0) {
      await NotificationService.sendWeeklySummary(userId, insights);
    }

    return insights;
  }
}

export default new InsightsService();
