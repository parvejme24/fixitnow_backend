import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/admin.js";
import { requireCustomer } from "../../middleware/customer.js";
import {
    getPaymentDetails,
    initiatePayment,
    paymentWebhook,
    refundPayment,
} from "./payment.controller.js";

const router = Router();

router.post("/webhook", paymentWebhook);
router.post("/initiate", authenticate, requireCustomer, initiatePayment);
router.get("/:id", authenticate, getPaymentDetails);
router.post("/:id/refund", authenticate, requireAdmin, refundPayment);

export const paymentRoutes = router;
