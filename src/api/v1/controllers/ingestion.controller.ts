import { Response } from "express";
import { AuthenticatedRequest } from "./auth.middleware";
import IngestionService from "../services/ingestion.service";

export const ingestGmail = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;

  try {
    await IngestionService.ingestGmail(userId);
    res.status(200).json({ message: "Gmail data ingested successfully" });
  } catch (error: any) {
    console.error("Gmail ingestion failed:", error.message);
    res.status(500).json({ error: "Failed to ingest Gmail data" });
  }
};

// export const ingestPlaid = async (req: AuthenticatedRequest, res: Response) => {
//   const userId = req.user!.userId;

//   try {
//     await IngestionService.ingestPlaid(userId);
//     res.status(200).json({ message: " Plaid data ingested successfully" });
//   } catch (error: any) {
//     console.error(" Plaid ingestion failed:", error.message);
//     res.status(500).json({ error: "Failed to ingest Plaid data" });
//   }
// };

export const ingestApiUsage = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const userId = req.user!.userId;
  const { provider } = req.body;

  try {
    if (!provider || !["openai", "anthropic"].includes(provider)) {
      return res.status(400).json({
        error: "Invalid provider. Supported: 'openai', 'anthropic'",
      });
    }

    await IngestionService.ingestApiUsage(userId, provider);
    res.status(200).json({
      message: ` ${provider.toUpperCase()} API usage ingested successfully`,
    });
  } catch (error: any) {
    console.error(` ${provider} ingestion failed:`, error.message);
    res.status(500).json({ error: `Failed to ingest ${provider} data` });
  }
};

export const uploadReceipt = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const userId = req.user!.userId;
  const file = req.file;

  try {
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    await IngestionService.ingestOcr(userId, file.path);
    res.status(200).json({ message: " Receipt processed successfully" });
  } catch (error: any) {
    console.error(" Receipt ingestion failed:", error.message);
    res.status(500).json({ error: "Failed to process receipt" });
  }
};
