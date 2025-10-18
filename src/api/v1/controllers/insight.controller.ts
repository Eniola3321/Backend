import { Request, Response } from "express";
import InsightsService from "../services/insight.service";

export const getInsights = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const insights = await InsightsService.generateInsights(userId);
  res.json(insights);
};
