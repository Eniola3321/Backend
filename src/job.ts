import cron from "cron";
import IngestionService from "../src/api/v1/services/ingestion.service";
import InsightsService from "../src/api/v1/services/insight.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const dailySync = new cron.CronJob("0 0 * * *", async () => {
  const users = await prisma.user.findMany();
  for (const user of users) {
    await IngestionService.ingestGmail(user.id);
    await IngestionService.ingestPlaid(user.id);
    // Etc.
  }
});

const weeklyInsights = new cron.CronJob("0 0 * * 0", async () => {
  const users = await prisma.user.findMany();
  for (const user of users) {
    await InsightsService.generateInsights(user.id);
  }
});

export const startJobs = () => {
  dailySync.start();
  weeklyInsights.start();
};
