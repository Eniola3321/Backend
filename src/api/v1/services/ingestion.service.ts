import { google } from "googleapis";
import plaid from "plaid";
import OpenAI from "openai";
import { PrismaClient } from "@prisma/client";
import config from "../../config/config";
import { recognize } from "../utils/ocr.utils"; // For OCR

const prisma = new PrismaClient();

class IngestionService {
  async ingestGmail(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: (user.tokens as any)?.gmail }); // Decrypt if encrypted
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    // Fetch emails, parse invoices (placeholder logic)
    const res = await gmail.users.messages.list({ userId: "me", q: "invoice" });
    // For each message, extract plan, amount, date using regex or NLP
    // Normalize and save to Subscription
    // Example:
    await prisma.subscription.create({
      data: {
        userId,
        name: "AI Tool",
        cost: 10,
        billingCycle: "monthly",
        renewalDate: new Date(),
        source: "gmail",
      },
    });
  }

  async ingestPlaid(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    // Assume Plaid token stored similarly
    const client = new plaid.PlaidApi(
      new plaid.Configuration({
        basePath: plaid.PlaidEnvironments.sandbox, // Use production in real
        baseOptions: {
          headers: {
            "PLAID-CLIENT-ID": config.plaid.clientId,
            "PLAID-SECRET": config.plaid.secret,
          },
        },
      })
    );
    // Fetch transactions, detect recurring AI payments (placeholder)
    // Normalize and save
  }

  async ingestApiUsage(userId: string, provider: string) {
    // Example for OpenAI
    const openai = new OpenAI({ apiKey: config.openaiApiKey });
    // Fetch usage logs (OpenAI has /usage endpoint)
    // Update Usage model
  }

  async ingestOcr(userId: string, filePath: string) {
    const text = await recognize(filePath);
    // Parse text for invoice details (regex/NLP)
    // Normalize and save to Subscription
  }
}

export default new IngestionService();
