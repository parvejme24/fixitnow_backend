import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { requireCustomer } from "../../middleware/customer.js";
import {
    confirmPayment,
    createPayment,
    getPaymentDetails,
    getPayments,
    shurjoPayCallback,
} from "./payment.controller.js";

const router = Router();

router.get("/shurjopay/callback", shurjoPayCallback);
router.post("/shurjopay/callback", shurjoPayCallback);

router.use(authenticate, requireCustomer);

router.post("/create", createPayment);
router.post("/confirm", confirmPayment);
router.get("/", getPayments);
router.get("/:id", getPaymentDetails);

export const paymentRoutes = router;
