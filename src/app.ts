import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import config from "./config/index.js";
import { prisma } from "./lib/prisma.js";
import { globalErrorHandler } from "./middleware/globalErrorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { catchAsync } from "./utils/catchAsync.js";
import { adminRoutes } from "./module/admin/admin.routes.js";
import { authRoutes } from "./module/auth/auth.routes.js";
import { bookingRoutes } from "./module/booking/booking.routes.js";
import { categoryRoutes } from "./module/category/category.routes.js";
import { paymentRoutes } from "./module/payment/payment.routes.js";
import { reviewRoutes } from "./module/review/review.routes.js";
import { serviceRoutes } from "./module/service/service.routes.js";
import {
    technicianManagementRoutes,
    technicianRoutes,
} from "./module/technician/technician.routes.js";

const app: Application = express();

app.use(
    cors({
        origin: config.cors_origins,
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

app.get(
    "/api/health",
    catchAsync(async (req: Request, res: Response) => {
        if (!config.database_url?.trim()) {
            res.status(503).json({
                success: false,
                message:
                    "DATABASE_URL is not configured. Add it to Vercel Environment Variables for Production.",
            });
            return;
        }

        await prisma.$queryRaw`SELECT 1`;

        res.status(200).json({
            success: true,
            message: "API is healthy",
            data: {
                status: "ok",
                environment: config.node_env,
                database: "connected",
                timestamp: new Date().toISOString(),
            },
        });
    })
);

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/technicians", technicianRoutes);
app.use("/api/technician", technicianManagementRoutes);
app.use(notFound);
app.use(globalErrorHandler);

export default app;
