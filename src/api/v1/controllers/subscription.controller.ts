import { Request, Response } from "express";
import SubscriptionService from "../services/subscription.service";

export const getSubscriptions = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const subs = await SubscriptionService.getUserSubscriptions(userId);
  res.json(subs);
};

export const updateSubscription = async (req: Request, res: Response) => {
  const { subId } = req.params;
  const updates = req.body;
  await SubscriptionService.updateSubscription(subId, updates);
  res.json({ message: "Subscription updated" });
};
