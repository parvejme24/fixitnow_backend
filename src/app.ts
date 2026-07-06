import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import config from "./config/index.js";
import { globalErrorHandler } from "./middleware/globalErrorHandler.js";
import { notFound } from "./middleware/notFound.js";
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
