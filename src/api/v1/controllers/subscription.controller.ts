import { Response } from "express";
import SubscriptionService from "../services/subscription.service";
import { AuthenticatedRequest } from "./auth.middleware";

// 🧱 Get all subscriptions for a user (with optional filtering)
export const getSubscriptions = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { status, limit, skip } = req.query;

    const subs = await SubscriptionService.getUserSubscriptions(
      userId,
      status as string | undefined,
      limit ? Number(limit) : 20,
      skip ? Number(skip) : 0
    );

    res.json(subs);
  } catch (error) {
    console.error("Error getting subscriptions:", error);
    res.status(500).json({ error: "Failed to fetch subscriptions" });
  }
};

// 🧱 Create a new subscription
export const createSubscription = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const data = req.body;
    const subscription = await SubscriptionService.createSubscription(
      userId,
      data
    );

    res.status(201).json(subscription);
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ error: "Failed to create subscription" });
  }
};

// 🧱 Get subscription by ID
export const getSubscriptionById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { subId } = req.params;
    const subscription = await SubscriptionService.getSubscriptionById(subId);

    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    res.json(subscription);
  } catch (error) {
    console.error("Error fetching subscription:", error);
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
};

// 🧱 Update subscription details
export const updateSubscription = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { subId } = req.params;
    const updates = req.body;

    const updated = await SubscriptionService.updateSubscription(
      subId,
      updates
    );

    res.json({
      message: "Subscription updated successfully",
      subscription: updated,
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({ error: "Failed to update subscription" });
  }
};

// 🧱 Deactivate subscription (set status to INACTIVE)
export const deactivateSubscription = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { subId } = req.params;
    const updated = await SubscriptionService.deactivateSubscription(subId);

    res.json({
      message: "Subscription deactivated successfully",
      subscription: updated,
    });
  } catch (error) {
    console.error("Error deactivating subscription:", error);
    res.status(500).json({ error: "Failed to deactivate subscription" });
  }
};

// 🧱 Delete subscription (hard delete)
export const deleteSubscription = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { subId } = req.params;
    await SubscriptionService.deleteSubscription(subId);

    res.json({ message: "Subscription deleted successfully" });
  } catch (error) {
    console.error("Error deleting subscription:", error);
    res.status(500).json({ error: "Failed to delete subscription" });
  }
};

// 🧱 Merge duplicate subscriptions
export const mergeDuplicateSubscriptions = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    await SubscriptionService.mergeDuplicates(userId);
    res.json({ message: "Duplicate subscriptions merged successfully" });
  } catch (error) {
    console.error("Error merging duplicates:", error);
    res.status(500).json({ error: "Failed to merge duplicate subscriptions" });
  }
};
