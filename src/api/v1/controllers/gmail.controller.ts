import { Request, Response } from "express";
import { google } from "googleapis";
import { PrismaClient } from "@prisma/client";
import config from "../../config/config";
import IngestionService from "../services/ingestion.service";
import { encrypt } from "../utils/encryption.util"; // assume you have this util

const prisma = new PrismaClient();

// Configure OAuth client
const oauth2Client = new google.auth.OAuth2(
  config.google.clientId || "",
  config.google.clientSecret || "",
  process.env.GOOGLE_REDIRECT_URI || "" // e.g., https://yourapp.com/api/auth/google/callback
);

export const redirectToGoogle = async (req: Request, res: Response) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "email",
      "profile",
    ],
    prompt: "consent",
  });
  res.redirect(url);
};

export const googleCallback = async (req: Request, res: Response) => {
  const { code } = req.query;
  if (!code)
    return res.status(400).json({ error: "Missing authorization code" });

  const { tokens } = await oauth2Client.getToken(code as string);
  const userId = req.user?.userId;

  if (!userId) return res.status(401).json({ error: "User not authenticated" });

  await prisma.oAuthToken.create({
    data: {
      userId,
      provider: "gmail",
      accessToken: encrypt(tokens.access_token || ""),
      refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
    },
  });

  // Optionally trigger Gmail ingestion immediately
  await IngestionService.ingestGmail(userId);

  res.redirect("/dashboard?connected=gmail");
};
