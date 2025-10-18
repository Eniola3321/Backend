import express, { Application } from "express";
import usersRouter from "./api/v1/routes/auth.routes";
// import morgan from "morgan";
const app: Application = express();
// app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/v1/users", usersRouter);
export default app;
