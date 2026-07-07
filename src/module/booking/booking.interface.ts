import { z } from "zod";
import { paginationSchema } from "../service/service.interface.js";

export const createBookingSchema = z.object({
    serviceId: z.string().min(1, "Service is required"),
    scheduledAt: z.coerce.date({
        message: "Valid scheduled date and time is required",
    }),
    address: z.string().min(5, "Address must be at least 5 characters"),
    notes: z.string().optional(),
});

export const bookingQuerySchema = paginationSchema.extend({
    status: z
        .enum([
            "REQUESTED",
            "ACCEPTED",
            "DECLINED",
            "PAID",
            "IN_PROGRESS",
            "COMPLETED",
            "CANCELLED",
        ])
        .optional(),
});

export const cancelBookingSchema = z.object({
    status: z.literal("CANCELLED"),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type BookingQuery = z.infer<typeof bookingQuerySchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
