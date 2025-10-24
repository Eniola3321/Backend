import express, { Application, Request, Response } from "express";
import cors, { CorsOptions } from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

import usersRouter from "./api/v1/routes/auth.routes";
import ingestionRouter from "./api/v1/routes/ingestion.routes";
import subscriptionRouter from "./api/v1/routes/subscription.routes";
import insightRouter from "./api/v1/routes/insight.routes";
import usageRouter from "./api/v1/routes/usage.routes";
import paymentRouter from "./api/v1/routes/payment.routes";

const app: Application = express();

app.use(helmet());
app.use(cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api", limiter);

app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  if (req.originalUrl === "/api/v1/payments/webhook") next();
  else express.json()(req, res, next);
});

app.use("/api/v1/users", usersRouter);
app.use("/api/v1/ingest", ingestionRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/insights", insightRouter);
app.use("/api/v1/usage", usageRouter);
app.use("/api/v1/payments", paymentRouter);

app.get("/", (req: Request, res: Response) => {
  res.send("API is running");
});
app.all("*", (req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

app.use((err: any, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong" });
});

export default app;
