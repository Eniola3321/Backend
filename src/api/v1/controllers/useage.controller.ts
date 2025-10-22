import { Response } from "express";
import { prisma } from "../../config/prisma";
import { AuthenticatedRequest } from "./auth.middleware";
import ScoringService from "../services/scoring.service";

/**
 * Get all usage records for the authenticated user
 */
export const getUserUsage = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user!.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const usageRecords = await prisma.usage.findMany({
      where: {
        subscription: { userId },
      },
      include: { subscription: true },
    });

    res.status(200).json({
      message: "Fetched usage records successfully",
      count: usageRecords.length,
      usageRecords,
    });
  } catch (error) {
    console.error("Error fetching usage records:", error);
    res.status(500).json({ error: "Failed to fetch usage data" });
  }
};

/**
 * Create or update a usage record for a subscription
 */
export const upsertUsage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { subscriptionId, lastEmailDate, lastApiUse, lastLogin, status } =
      req.body;

    // Verify subscription belongs to user
    const sub = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
    });
    if (!sub)
      return res
        .status(404)
        .json({ error: "Subscription not found or not yours" });

    const updatedUsage = await prisma.usage.upsert({
      where: { subscriptionId },
      update: { lastEmailDate, lastApiUse, lastLogin, status },
      create: { subscriptionId, lastEmailDate, lastApiUse, lastLogin, status },
    });

    // Recompute the score automatically after any update
    const score = await ScoringService.computeScore(subscriptionId);

    res.status(200).json({
      message: "Usage record saved successfully",
      usage: updatedUsage,
      score,
    });
  } catch (error) {
    console.error("Error saving usage record:", error);
    res.status(500).json({ error: "Failed to save usage record" });
  }
};

/**
 * Delete a usage record (admin or user clean-up)
 */
export const deleteUsage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { usageId } = req.params;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const usage = await prisma.usage.findUnique({
      where: { id: usageId },
      include: { subscription: true },
    });

    if (!usage || usage.subscription.userId !== userId)
      return res
        .status(404)
        .json({ error: "Usage record not found or not yours" });

    await prisma.usage.delete({ where: { id: usageId } });

    res.status(200).json({ message: "Usage record deleted successfully" });
  } catch (error) {
    console.error("Error deleting usage:", error);
    res.status(500).json({ error: "Failed to delete usage record" });
  }
};
