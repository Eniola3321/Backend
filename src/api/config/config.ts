import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export interface AppConfig {
  NODE_ENV: string;
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtCookieExpiresIn: string;
  emailUsername: string;
  emailPassword: string;
  emailHost: string;
  emailPort: number;
  emailFrom: string;
  sendgridUsername?: string;
  sendgridPassword?: string;

  plaid: {
    clientId?: string;
    secret?: string;
  };

  google: {
    clientId?: string;
    clientSecret?: string;
  };

  notion: {
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
  };

  openaiApiKey?: string;
  notionApiKey?: string;
}

// Helper function to ensure required env vars exist
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`❌ Missing required environment variable: ${key}`);
  }
  return value;
}

const config: AppConfig = {
  NODE_ENV: requireEnv("NODE_ENV"),
  port: parseInt(requireEnv("PORT"), 10),
  databaseUrl: requireEnv("DATABASE_URL"),
  jwtSecret: requireEnv("JWT_SECRET"),
  jwtExpiresIn: requireEnv("JWT_EXPIRES_IN"),
  jwtCookieExpiresIn: requireEnv("JWT_COOKIE_EXPIRES_IN"),
  emailUsername: requireEnv("EMAIL_USERNAME"),
  emailPassword: requireEnv("EMAIL_PASSWORD"),
  emailHost: requireEnv("EMAIL_HOST"),
  emailPort: parseInt(requireEnv("EMAIL_PORT"), 10),
  emailFrom: requireEnv("EMAIL_FROM"),
  sendgridUsername: process.env.SENDGRID_USERNAME,
  sendgridPassword: process.env.SENDGRID_PASSWORD,
  plaid: {
    clientId: process.env.PLAID_CLIENT_ID,
    secret: process.env.PLAID_SECRET,
  },
  openaiApiKey: process.env.OPENAI_API_KEY,
  notionApiKey: process.env.NOTION_API_KEY,
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  notion: {
    clientId: process.env.NOTION_CLIENT_ID,
    clientSecret: process.env.NOTION_CLIENT_SECRET,
    redirectUri: process.env.NOTION_REDIRECT_URI,
  },
};

export default config;
