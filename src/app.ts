import express, { Application, Request, Response } from "express";
// import bodyParser from "body-parser";
import usersRouter from "./api/v1/routes/auth.routes";
import ingestionRouter from "./api/v1/routes/ingestion.routes";
import subscriptionRouter from "./api/v1/routes/subscription.routes";
import insightRouter from "./api/v1/routes/insight.routes";
// import paymentRouter from "./api/v1/routes/payment.routes";

const app: Application = express();

// app.use((req, res, next) => {
//   if (req.originalUrl === "/api/v1/payments/webhook") {
//   } else {
//     express.json()(req, res, next);
//   }
// });

app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/users", usersRouter);
app.use("/api/v1/ingest", ingestionRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/insights", insightRouter);
// app.use("/api/v1/payments", paymentRouter);

app.get("/", (req: Request, res: Response) => {
  res.send("API is running ✅");
});

export default app;
