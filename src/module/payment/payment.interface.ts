import { z } from "zod";
import { paginationSchema } from "../service/service.interface.js";

export const createPaymentSchema = z.object({
    bookingId: z.string().min(1, "Booking ID is required"),
    provider: z.enum(["SSLCOMMERZ", "STRIPE", "SHURJOPAY"]),
});

export const confirmPaymentSchema = z.object({
    paymentId: z.string().min(1, "Payment ID is required"),
    val_id: z.string().optional(),
    sessionId: z.string().optional(),
    orderId: z.string().optional(),
});

export const paymentQuerySchema = paginationSchema.extend({
    status: z.enum(["PENDING", "COMPLETED", "FAILED", "CANCELLED"]).optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;
export type PaymentQuery = z.infer<typeof paymentQuerySchema>;
