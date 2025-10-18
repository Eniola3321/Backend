import nodemailer from "nodemailer";
import { PrismaClient } from "@prisma/client";
import config from "../../config/config";

const prisma = new PrismaClient();

class NotificationService {
  async sendWeeklySummary(userId: string, insights: any[]) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: config.emailHost, pass: config.emailPassword },
    });
    await transporter.sendMail({
      from: config.emailHost,
      to: user.email,
      subject: "Weekly Subscription Insights",
      text: `Insights: ${JSON.stringify(insights)}`,
    });
    // Add push notifications if using Firebase, etc.
  }
}

export default new NotificationService();
