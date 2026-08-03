import { NextFunction, Request, Response, Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireCustomer } from "../../middleware/customer.js";
import { AppError } from "../../utils/AppError.js";
import {
    getMyPaymentHistory,
    getMyPaymentSummary,
    getPaymentDetails,
    initiatePayment,
    paymentWebhook,
    refundPayment,
    shurjoPayCallback,
} from "./payment.controller.js";

const requireTechOrAdmin = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    if (req.user?.role === "TECHNICIAN" || req.user?.role === "ADMIN") {
        return next();
    }
    next(new AppError("Technician or admin access required", 403));
};

const router = Router();

// ShurjoPay browser return (no auth — gateway redirects here)
router.get("/shurjopay/callback", shurjoPayCallback);
router.post("/shurjopay/callback", shurjoPayCallback);

// Dev/manual webhook stub (optional)
router.post("/webhook", paymentWebhook);

// Customer pays
router.post("/initiate", authenticate, requireCustomer, initiatePayment);

// Customer payment history
router.get("/me", authenticate, requireCustomer, getMyPaymentHistory);
router.get(
    "/me/summary",
    authenticate,
    requireCustomer,
    getMyPaymentSummary
);
router.get("/history", authenticate, requireCustomer, getMyPaymentHistory);

router.get("/:id", authenticate, getPaymentDetails);

// Technician refunds (admin allowed for support)
router.post("/:id/refund", authenticate, requireTechOrAdmin, refundPayment);

export const paymentRoutes = router;
