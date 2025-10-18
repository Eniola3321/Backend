import dotenv from "dotenv";
dotenv.config();
export default {
  NODE_ENV: process.env.NODE_ENV || "development",
  port: process.env.PORT || 3000,
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://postgres:3321@localhost:5432/myAIMV?schema=public",
};
