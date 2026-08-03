import { z } from "zod";
import { paginationSchema } from "../service/service.interface.js";

export const adminUserQuerySchema = paginationSchema.extend({
    role: z.enum(["CUSTOMER", "TECHNICIAN", "ADMIN"]).optional(),
    isActive: z.coerce.boolean().optional(),
    /** Filter technicians by verification status */
    verified: z.coerce.boolean().optional(),
    search: z.string().optional(),
});

export const updateUserStatusSchema = z
    .object({
        isActive: z.boolean().optional(),
        /** Verify / unverify technician (TECHNICIAN users only) */
        verified: z.boolean().optional(),
    })
    .refine(
        (data) => data.isActive !== undefined || data.verified !== undefined,
        { message: "Provide isActive and/or verified" }
    );

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

export const adminSalesQuerySchema = paginationSchema.extend({
    /** Filter by calendar day (ISO date) — defaults to all-time when omitted */
    from: z.string().optional(),
    to: z.string().optional(),
    today: z.coerce.boolean().optional(),
});

export type AdminUserQuery = z.infer<typeof adminUserQuerySchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type AdminBookingQuery = z.infer<typeof adminBookingQuerySchema>;
export type AdminSalesQuery = z.infer<typeof adminSalesQuerySchema>;
