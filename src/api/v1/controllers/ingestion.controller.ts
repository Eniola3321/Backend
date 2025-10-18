import { Request, Response } from "express";
import IngestionService from "../services/ingestion.service";

export const ingestGmail = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  // From auth middleware
  await IngestionService.ingestGmail(userId);
  res.json({ message: "Gmail data ingested" });
};

export const ingestPlaid = async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  await IngestionService.ingestPlaid(userId);
  res.json({ message: "Plaid data ingested" });
};

export const ingestApiUsage = async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const { provider } = req.body; // e.g., 'openai'
  await IngestionService.ingestApiUsage(userId, provider);
  res.json({ message: "API usage ingested" });
};

export const uploadReceipt = async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const file = req.file;
  if (!file) return res.status(400).json({ message: "No file uploaded" });
  await IngestionService.ingestOcr(userId, file.path);
  res.json({ message: "Receipt ingested" });
};
