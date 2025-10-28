import { Response, Request } from "express";
import { google } from "googleapis";
import { PrismaClient } from "@prisma/client";
import config from "../../config/config";
import IngestionService from "../services/ingestion.service";
import { encrypt } from "../utils/encryption.util";
import jwt, { verify } from "jsonwebtoken";

const prisma = new PrismaClient();

// Redirect user to Google consent page
export const redirectToGoogle = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ error: "Missing Authorization header" });

    const jwtToken = authHeader.split(" ")[1];

    const oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.clientRedirectUrl
    );

    // Attach user's JWT as state so we can identify them later
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ],
      prompt: "consent",
      state: jwtToken,
    });

    res.redirect(url);
  } catch (err: any) {
    console.error("Redirect to Google failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Handle Google OAuth callback
export const googleCallback = async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    if (!code)
      return res.status(400).json({ error: "Missing authorization code" });
    if (!state)
      return res.status(401).json({ error: "Missing state (JWT token)" });

    // Verify JWT from state param
    const decoded: any = verify(state as string, config.jwtSecret);
    const userId = decoded.userId;
    if (!userId)
      return res.status(401).json({ error: "Invalid or expired JWT token" });

    const oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.clientRedirectUrl
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    // Upsert (create or update) token
    await prisma.oAuthToken.upsert({
      where: {
        userId_provider: {
          userId,
          provider: "gmail",
        },
      },
      update: {
        accessToken: encrypt(tokens.access_token || ""),
        refreshToken: tokens.refresh_token
          ? encrypt(tokens.refresh_token)
          : undefined,
      },
      create: {
        userId,
        provider: "gmail",
        accessToken: encrypt(tokens.access_token || ""),
        refreshToken: tokens.refresh_token
          ? encrypt(tokens.refresh_token)
          : null,
      },
    });

    // Kick off ingestion
    await IngestionService.ingestGmail(userId, oauth2Client);

    res.redirect("/dashboard?connected=gmail");
  } catch (err: any) {
    console.error("Google callback error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
