// src/db.js
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import config from "./config";
dotenv.config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.databaseUrl,
    },
  },
});

export default prisma;
