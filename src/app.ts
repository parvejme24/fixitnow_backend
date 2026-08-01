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
import { areaRoutes } from "./module/area/area.routes.js";
import { categoryRoutes } from "./module/category/category.routes.js";
import { paymentRoutes } from "./module/payment/payment.routes.js";
import { reviewRoutes } from "./module/review/review.routes.js";
import { serviceRoutes } from "./module/service/service.routes.js";
import { technicianRoutes } from "./module/technician/technician.routes.js";

const app: Application = express();

app.use(
    cors({
        origin: config.cors_origins,
        credentials: true,
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
    res.send("Welcome to FixItNow API");
});

app.get(
    "/api/v1/health",
    catchAsync(async (req: Request, res: Response) => {
        if (!config.database_url?.trim()) {
            res.status(503).json({
                success: false,
                error: {
                    code: "DATABASE_UNCONFIGURED",
                    message:
                        "DATABASE_URL is not configured. Add it to environment variables.",
                },
            });
            return;
        }

        await prisma.$queryRaw`SELECT 1`;

        res.status(200).json({
            success: true,
            data: {
                status: "ok",
                environment: config.node_env,
                database: "connected",
                timestamp: new Date().toISOString(),
            },
        });
    })
);

const apiV1 = express.Router();

apiV1.use("/auth", authRoutes);
apiV1.use("/categories", categoryRoutes);
apiV1.use("/areas", areaRoutes);
apiV1.use("/admin", adminRoutes);
apiV1.use("/services", serviceRoutes);
apiV1.use("/bookings", bookingRoutes);
apiV1.use("/payments", paymentRoutes);
apiV1.use("/reviews", reviewRoutes);
apiV1.use("/technicians", technicianRoutes);

app.use("/api/v1", apiV1);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
