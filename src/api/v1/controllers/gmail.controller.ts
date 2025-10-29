import { Response, Request } from "express";
import { google } from "googleapis";
import { PrismaClient } from "@prisma/client";
import config from "../../config/config";
import IngestionService from "../services/ingestion.service";
import { encrypt } from "../utils/encryption.util";
import { AuthService } from "../services/authService";

const prisma = new PrismaClient();

// Redirect user to Google consent page for OAuth login
export const redirectToGoogle = async (req: Request, res: Response) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.clientRedirectUrl
    );

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ],
      prompt: "consent",
    });

    res.redirect(url);
  } catch (err: any) {
    console.error("Redirect to Google failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Handle Google OAuth callback for login
export const googleCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    if (!code)
      return res.status(400).json({ error: "Missing authorization code" });

    const oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.clientRedirectUrl
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    // Get user profile from Google
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: profile } = await oauth2.userinfo.get();

    if (!profile.email) {
      return res
        .status(400)
        .json({ error: "Unable to retrieve email from Google" });
    }

    // Find or create user and generate JWT
    const authResult = await AuthService.findOrCreateOAuthUser(
      profile.email,
      profile.name
    );

    // Store OAuth tokens
    await prisma.oAuthToken.upsert({
      where: {
        userId_provider: {
          userId: authResult.user.id,
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
        userId: authResult.user.id,
        provider: "gmail",
        accessToken: encrypt(tokens.access_token || ""),
        refreshToken: tokens.refresh_token
          ? encrypt(tokens.refresh_token)
          : null,
      },
    });

    // Kick off ingestion
    await IngestionService.ingestGmail(authResult.user.id, oauth2Client);

    // Return JWT token and user info
    res.json({
      status: "success",
      data: authResult,
    });
  } catch (err: any) {
    console.error("Google callback error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
