import { z } from "zod";
import { paginationSchema } from "../service/service.interface.js";

export const createBookingSchema = z.object({
    serviceId: z.string().min(1, "Service is required"),
    technicianId: z.string().min(1, "Technician is required"),
    slotId: z.string().min(1, "Slot is required"),
    notes: z.string().optional(),
});

export const bookingQuerySchema = paginationSchema.extend({
    status: z
        .enum([
            "REQUESTED",
            "ACCEPTED",
            "DECLINED",
            "PAID",
            "EN_ROUTE",
            "ON_SITE",
            "COMPLETED",
            "CANCELLED",
        ])
        .optional(),
});

export const updateBookingStatusSchema = z.object({
    status: z.enum(["EN_ROUTE", "ON_SITE", "COMPLETED"]),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type BookingQuery = z.infer<typeof bookingQuerySchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
