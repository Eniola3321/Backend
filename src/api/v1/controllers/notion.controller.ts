import { Request, Response } from "express";
import axios from "axios";
import { PrismaClient } from "@prisma/client";
import config from "../../config/config";
import IngestionService from "../services/ingestion.service";
import { encrypt } from "../utils/encryption.utils";

const prisma = new PrismaClient();

export const redirectToNotion = async (req: Request, res: Response) => {
  const params = new URLSearchParams({
    client_id: config.notion.clientId,
    redirect_uri: config.notion.redirectUri,
    response_type: "code",
    owner: "user",
  });
  res.redirect(
    `https://api.notion.com/v1/oauth/authorize?${params.toString()}`
  );
};

export const notionCallback = async (req: Request, res: Response) => {
  const { code } = req.query;
  const userId = req.user?.userId;

  if (!code)
    return res.status(400).json({ error: "Missing authorization code" });
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const tokenResponse = await axios.post(
    "https://api.notion.com/v1/oauth/token",
    {
      grant_type: "authorization_code",
      code,
      redirect_uri: config.notion.redirectUri,
    },
    {
      auth: {
        username: config.notion.clientId,
        password: config.notion.clientSecret,
      },
    }
  );

  const notionToken = tokenResponse.data.access_token;

  await prisma.user.update({
    where: { id: userId },
    data: {
      tokens: {
        ...(req.user as any).tokens,
        notion: encrypt(notionToken),
      },
    },
  });

  // Optionally trigger ingestion (if Notion data is used)
  await IngestionService.ingestApiUsage(userId, "notion");

  res.redirect("/dashboard?connected=notion");
};
