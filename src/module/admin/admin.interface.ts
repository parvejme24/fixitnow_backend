import { z } from "zod";
import { paginationSchema } from "../service/service.interface.js";

export const adminUserQuerySchema = paginationSchema.extend({
    role: z.enum(["CUSTOMER", "TECHNICIAN", "ADMIN"]).optional(),
    isActive: z.coerce.boolean().optional(),
    search: z.string().optional(),
});

export const updateUserStatusSchema = z.object({
    isActive: z.boolean(),
});

export const adminBookingQuerySchema = paginationSchema.extend({
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

export type AdminUserQuery = z.infer<typeof adminUserQuerySchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type AdminBookingQuery = z.infer<typeof adminBookingQuerySchema>;
