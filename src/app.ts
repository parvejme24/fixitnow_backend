import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import config from "./config/index.js";
import { globalErrorHandler } from "./middleware/globalErrorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { authRoutes } from "./module/auth/auth.routes.js";

const app: Application = express();

app.use(
    cors({
        origin: config.app_url,
        credentials: true,
    })
);

app.use("/api/subscription/webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
    res.send("Welcome to FixItNow API");
});

app.use("/api/auth", authRoutes);
app.use(notFound);
app.use(globalErrorHandler);

export default app;
