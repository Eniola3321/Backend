import express, { Application } from "express";
import usersRouter from "./api/v1/routes/auth.routes";
import ingestionRouter from "./api/v1/routes/ingestion.routes";
import subscriptionRouter from "./api/v1/routes/subscription.routes";
import insightRouter from "./api/v1/routes/insight.routes";

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/users", usersRouter);
app.use("/api/v1/ingest", ingestionRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/insights", insightRouter);

export default app;
