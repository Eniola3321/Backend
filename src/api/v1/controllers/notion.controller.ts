import { Response } from "express";
import axios from "axios";
import { PrismaClient } from "@prisma/client";
import config from "../../config/config";
import { encrypt } from "../utils/encryption.util";
import { AuthenticatedRequest } from "./auth.middleware";

const prisma = new PrismaClient();

export const redirectToNotion = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const params = new URLSearchParams({
      client_id: config.notion.clientId || "",
      redirect_uri: config.notion.redirectUri || "",
      response_type: "code",
      owner: "user",
      state: userId,
    });

    const notionAuthUrl = `https://www.notion.com/oauth2/v2/authorize?${params.toString()}`;
    return res.redirect(notionAuthUrl);
  } catch (error) {
    console.error("Error redirecting to Notion:", error);
    res.status(500).json({ error: "Failed to start Notion OAuth flow" });
  }
};

export const notionCallback = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { code, state } = req.query; // ✅ include state
    if (!code)
      return res.status(400).json({ error: "Missing authorization code" });
    if (!state)
      return res.status(400).json({ error: "Missing state (userId)" });

    const userId = String(state);

    // Exchange code for token
    const tokenResponse = await axios.post(
      "https://api.notion.com/v1/oauth/token",
      {
        grant_type: "authorization_code",
        code,
        redirect_uri: config.notion.redirectUri || "",
      },
      {
        auth: {
          username: config.notion.clientId || "",
          password: config.notion.clientSecret || "",
        },
        headers: { "Content-Type": "application/json" },
      }
    );

    const notionToken = tokenResponse.data.access_token;

    await prisma.oAuthToken.create({
      data: {
        userId,
        provider: "notion",
        accessToken: encrypt(notionToken),
      },
    });

    return res.redirect("/dashboard?connected=notion");
  } catch (error: any) {
    console.error(
      "Error handling Notion callback:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Notion OAuth callback failed" });
  }
};
