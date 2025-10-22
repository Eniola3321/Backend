import dotenv from "dotenv";
// import path from "path";
dotenv.config();

// dotenv.config({ path: path.resolve(__dirname, "../../../.env.examples") });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export interface AppConfig {
  NODE_ENV: string;
  PLAID_ENV: string;
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtCookieExpiresIn: string;
  emailUsername: string;
  emailPassword: string;
  emailHost: string;
  emailPort: string;
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
    clientRedirectUrl?: string;
  };
  notion: {
    clientId?: string;
    clientSecret?: string;
    redirectUri: string;
  };
  openaiApiKey?: string;
  notionApiKey?: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  clientUrl: string;
}

const config: AppConfig = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PLAID_ENV: process.env.PLAID_ENV ?? "sandbox",
  port: parseInt(process.env.PORT ?? "5500", 10),
  databaseUrl: requireEnv("DATABASE_URL"),
  jwtSecret: requireEnv("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "30m",
  jwtCookieExpiresIn: process.env.JWT_COOKIE_EXPIRES_IN ?? "30m",

  emailUsername: process.env.EMAIL_USERNAME ?? "",
  emailPassword: process.env.EMAIL_PASSWORD ?? "",
  emailHost: process.env.EMAIL_HOST ?? "",
  emailPort: process.env.EMAIL_PORT ?? "587",
  emailFrom: process.env.EMAIL_FROM ?? "noreply@example.com",

  sendgridUsername: process.env.SENDGRID_USERNAME,
  sendgridPassword: process.env.SENDGRID_PASSWORD,

  plaid: {
    clientId: process.env.PLAID_CLIENT_ID,
    secret: process.env.PLAID_SECRET,
  },
  notion: {
    clientId: process.env.NOTION_CLIENT_ID,
    clientSecret: process.env.NOTION_CLIENT_SECRET,
    redirectUri:
      process.env.NOTION_REDIRECT_URI ||
      "http://localhost:3000/api/v1/notion/callback",
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    clientRedirectUrl: process.env.GOOGLE_REDIRECT_URL,
  },

  openaiApiKey: process.env.OPENAI_API_KEY,
  notionApiKey: process.env.NOTION_API_KEY,

  stripeSecretKey: requireEnv("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: requireEnv("STRIPE_WEBHOOK_SECRET"),

  clientUrl: process.env.CLIENT_URL ?? "http://localhost:3000",
};

export default config;
