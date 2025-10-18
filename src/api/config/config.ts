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
  emailPort: string;
  emailFrom: string;
  sendgridUsername: string;
  sendgridPassword: string;
}

const config: AppConfig = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "3000", 10),
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://postgres:3321@localhost:5432/myAIMV?schema=public",
  jwtSecret:
    process.env.JWT_SECRET ??
    "djjkssysmnbchddldi739330gdjjdkg#@$hdjdklallal&(%$#@463gsggdjssghAgsgsjjDDSJJ!&hsjgJkKLBB,ksllld;d;;s",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "30mins",
  jwtCookieExpiresIn: process.env.JWT_COOKIE_EXPIRES_IN ?? "30mins",
  emailUsername: process.env.EMAIL_USERNAME ?? "065a3584eda133",
  emailPassword: process.env.EMAIL_PASSWORD ?? "18fffa101aa9f7",
  emailHost: process.env.EMAIL_HOST ?? "sandbox.smtp.mailtrap.io",
  emailPort: process.env.EMAIL_PORT ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "",
  sendgridUsername: process.env.SENDGRID_USERNAME ?? "",
  sendgridPassword: process.env.SENDGRID_PASSWORD ?? "",
};

export default config;
