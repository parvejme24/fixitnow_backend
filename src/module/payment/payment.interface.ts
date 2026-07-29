import { z } from "zod";

export const initiatePaymentSchema = z.object({
    bookingId: z.string().min(1, "Booking ID is required"),
    method: z.enum(["BKASH", "NAGAD", "CARD"]),
});

export const webhookPaymentSchema = z.object({
    paymentId: z.string().min(1, "Payment ID is required"),
    status: z.enum(["SUCCESS", "FAILED", "CANCELLED"]),
    providerTxnId: z.string().optional(),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;
export type WebhookPaymentInput = z.infer<typeof webhookPaymentSchema>;
