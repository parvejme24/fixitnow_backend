import { z } from "zod";
import { paginationSchema } from "../service/service.interface.js";

export const adminUserQuerySchema = paginationSchema.extend({
    role: z.enum(["CUSTOMER", "TECHNICIAN", "ADMIN"]).optional(),
    status: z.enum(["ACTIVE", "BANNED"]).optional(),
    search: z.string().optional(),
});

export const updateUserStatusSchema = z.object({
    status: z.enum(["ACTIVE", "BANNED"]),
});

export const adminBookingQuerySchema = paginationSchema.extend({
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

export type AdminUserQuery = z.infer<typeof adminUserQuerySchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type AdminBookingQuery = z.infer<typeof adminBookingQuerySchema>;
