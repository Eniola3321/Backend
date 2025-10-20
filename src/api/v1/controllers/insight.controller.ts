import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import InsightsService from "../services/insight.service";

/**
 * Generate insights for the authenticated user.
 * - Recomputes usage scores
 * - Detects unused and overlapping subscriptions
 * - Sends weekly summary notification
 */
export const generateInsights = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const insights = await InsightsService.generateInsights(userId);

    res.status(200).json({
      message: "Insights generated successfully",
      count: insights.length,
      insights,
    });
  } catch (error) {
    console.error("Error generating insights:", error);
    res.status(500).json({ error: "Failed to generate insights" });
  }
};

/**
 * (Optional) Fetch existing insights for a user
 * Useful if you want a separate route to just *get* insights without recomputing
 */
export const getUserInsights = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const insights = await prisma.insight.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      message: "Fetched existing insights",
      count: insights.length,
      insights,
    });
  } catch (error) {
    console.error("Error fetching insights:", error);
    res.status(500).json({ error: "Failed to fetch insights" });
  }
};
