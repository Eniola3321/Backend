import { google } from "googleapis";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import OpenAI from "openai";
import { PrismaClient } from "@prisma/client";
import config from "../../config/config";
import { recognize } from "../utils/ocr.utils";
import { decrypt, encrypt } from "../utils/encryption.util";

const prisma = new PrismaClient();

class IngestionService {
  /**
   * Ingest Gmail invoices via OAuth2
   */
  async ingestGmail(userId: string, oauth2Client?: any) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { oauthTokens: true },
      });
      if (!user) throw new Error("User not found");

      //  Get tokens
      const gmailTokenRecord = user.oauthTokens.find(
        (t) => t.provider === "gmail"
      );
      if (!gmailTokenRecord) throw new Error("No Gmail token found");

      const accessToken = decrypt(gmailTokenRecord.accessToken);
      const refreshToken = gmailTokenRecord.refreshToken
        ? decrypt(gmailTokenRecord.refreshToken)
        : undefined;

      // Use passed client or create a new one
      const client =
        oauth2Client ||
        new google.auth.OAuth2(
          config.google.clientId,
          config.google.clientSecret,
          config.google.clientRedirectUrl
        );

      client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      //  Handle automatic refresh and save new access tokens
      client.on("tokens", async (tokens) => {
        if (tokens.access_token) {
          await prisma.oAuthToken.updateMany({
            where: { userId, provider: "gmail" },
            data: { accessToken: encrypt(tokens.access_token) },
          });
        }
      });

      const gmail = google.gmail({ version: "v1", auth: client });

      //  Fetch messages
      const res = await gmail.users.messages.list({
        userId: "me",
        q: "invoice OR receipt OR payment confirmation",
        maxResults: 10,
      });

      const messages = res.data.messages || [];
      for (const msg of messages) {
        const full = await gmail.users.messages.get({
          userId: "me",
          id: msg.id!,
        });

        const body = full.data.snippet || "";

        // Try to extract amount
        const costMatch = body.match(/\$\s?(\d+(\.\d{1,2})?)/);
        const amount = costMatch ? parseFloat(costMatch[1]) : null;

        if (amount) {
          await prisma.subscription.create({
            data: {
              userId,
              serviceName: "Detected Gmail Subscription",
              amount,
              currency: "USD",
              billingCycle: "monthly",
              source: "gmail",
              status: "ACTIVE",
            },
          });
        }
      }
    } catch (err: any) {
      console.error(" Gmail ingestion failed:", err.message);
    }
  }

  /**
   * Ingest transactions from Plaid API
   */
  async ingestPlaid(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { oauthTokens: true },
      });
      if (!user) throw new Error("User not found");

      const encryptedToken = user.oauthTokens.find(
        (t) => t.provider === "plaid"
      )?.accessToken;
      if (!encryptedToken) throw new Error("No Plaid token found");

      const accessToken = decrypt(encryptedToken);

      const configuration = new Configuration({
        basePath: PlaidEnvironments[process.env.PLAID_ENV || "sandbox"],
        baseOptions: {
          headers: {
            "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID || "",
            "PLAID-SECRET": process.env.PLAID_SECRET || "",
          },
        },
      });

      const plaidClient = new PlaidApi(configuration);

      // Fetch recent transactions
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);

      const response = await plaidClient.transactionsGet({
        access_token: accessToken,
        start_date: startDate.toISOString().split("T")[0],
        end_date: new Date().toISOString().split("T")[0],
      });

      const transactions = response.data.transactions;
      for (const txn of transactions) {
        if (txn.name.toLowerCase().includes("ai")) {
          await prisma.subscription.create({
            data: {
              userId,
              serviceName: txn.name,
              amount: txn.amount,
              currency: "USD",
              billingCycle: "monthly",
              source: "plaid",
              status: "ACTIVE",
            },
          });
        }
      }
    } catch (err: any) {
      console.error("Plaid ingestion failed:", err.message);
    }
  }

  /**
   * Ingest API usage (e.g., OpenAI or Anthropic)
   */
  async ingestApiUsage(userId: string, provider: "openai" | "anthropic") {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { oauthTokens: true },
      });
      if (!user) throw new Error("User not found");

      const apiToken = decrypt(
        user.oauthTokens.find((t) => t.provider === provider)?.accessToken || ""
      );
      if (!apiToken) throw new Error(`No token for ${provider}`);

      if (provider === "openai") {
        const openai = new OpenAI({ apiKey: apiToken });
        // Note: OpenAI API usage tracking might require different endpoint or be unavailable
        // For now, skip actual API call and use placeholder
        const usage = { data: [] }; // Placeholder

        // Normalize to your Usage model
        await prisma.usage.upsert({
          where: { subscriptionId: "openai" },
          update: { lastApiUse: new Date(), usageScore: 80 },
          create: {
            subscriptionId: "openai",
            lastApiUse: new Date(),
            usageScore: 80,
            status: "ACTIVE",
          },
        });
      }
    } catch (err: any) {
      console.error(`${provider} API ingestion failed:`, err.message);
    }
  }

  /**
   * Ingest manually uploaded receipts via OCR
   */
  async ingestOcr(userId: string, filePath: string) {
    try {
      const text = await recognize(filePath);
      const costMatch = text.match(/\$\s?(\d+(\.\d{1,2})?)/);
      const amount = costMatch ? parseFloat(costMatch[1]) : null;

      if (amount) {
        await prisma.subscription.create({
          data: {
            userId,
            serviceName: "Manual Upload",
            amount,
            currency: "USD",
            billingCycle: "monthly",
            source: "manual_upload",
            status: "ACTIVE",
          },
        });
      }
    } catch (err: any) {
      console.error("OCR ingestion failed:", err.message);
    }
  }
}

export default new IngestionService();
