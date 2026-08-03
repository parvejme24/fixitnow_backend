import { z } from "zod";
import { paginationSchema } from "../service/service.interface.js";

export const initiatePaymentSchema = z.object({
    bookingId: z.string().min(1, "Booking ID is required"),
    /** Preferred channel; ShurjoPay may still let the customer pick at checkout */
    method: z.enum(["BKASH", "NAGAD", "CARD"]).default("CARD"),
});

export const webhookPaymentSchema = z.object({
    paymentId: z.string().min(1, "Payment ID is required"),
    status: z.enum(["SUCCESS", "FAILED", "CANCELLED"]),
    providerTxnId: z.string().optional(),
});

export const paymentHistoryQuerySchema = paginationSchema.extend({
    status: z
        .enum(["PENDING", "SUCCESS", "FAILED", "REFUNDED", "CANCELLED"])
        .optional(),
    method: z.enum(["BKASH", "NAGAD", "CARD"]).optional(),
    bookingId: z.string().optional(),
    q: z.string().optional(),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;
export type WebhookPaymentInput = z.infer<typeof webhookPaymentSchema>;
export type PaymentHistoryQuery = z.infer<typeof paymentHistoryQuerySchema>;
