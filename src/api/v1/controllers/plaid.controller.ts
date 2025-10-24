import { Response } from "express";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import { PrismaClient } from "@prisma/client";
import config from "../../config/config";
import IngestionService from "../services/ingestion.service";
import { encrypt } from "../utils/encryption.util";
import { AuthenticatedRequest } from "./auth.middleware";

const prisma = new PrismaClient();

const plaidConfig = new Configuration({
  basePath: PlaidEnvironments[config.PLAID_ENV || "sandbox"],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": config.plaid.clientId || "",
      "PLAID-SECRET": config.plaid.secret || "",
    },
  },
});
const plaidClient = new PlaidApi(plaidConfig);

export const createLinkToken = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const response = await plaidClient.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: "AI Subscription Tracker",
    products: ["transactions" as any],
    language: "en",
    country_codes: ["US" as any],
  });

  res.json({ link_token: response.data.link_token });
};

export const exchangePublicToken = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { public_token } = req.body;
  const userId = req.user?.userId;

  if (!public_token)
    return res.status(400).json({ error: "Missing public token" });
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const response = await plaidClient.itemPublicTokenExchange({ public_token });
  const accessToken = response.data.access_token;

  await prisma.oAuthToken.create({
    data: {
      userId,
      provider: "plaid",
      accessToken: encrypt(accessToken),
    },
  });

  // Trigger ingestion to detect recurring payments
  await IngestionService.ingestPlaid(userId);

  res
    .status(200)
    .json({ status: "success", message: "Plaid account linked successfully" });
};
