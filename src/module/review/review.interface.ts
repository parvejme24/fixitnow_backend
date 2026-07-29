import { z } from "zod";

export const createReviewSchema = z
    .object({
        target: z.enum(["SERVICE", "TECHNICIAN"]),
        serviceId: z.string().optional(),
        technicianId: z.string().optional(),
        bookingId: z.string().optional(),
        rating: z.coerce.number().int().min(1).max(5),
        body: z.string().min(1, "Review body is required"),
    })
    .superRefine((data, ctx) => {
        if (data.target === "SERVICE" && !data.serviceId && !data.bookingId) {
            ctx.addIssue({
                code: "custom",
                path: ["serviceId"],
                message: "serviceId or bookingId is required for SERVICE reviews",
            });
        }
        if (data.target === "TECHNICIAN" && !data.technicianId && !data.bookingId) {
            ctx.addIssue({
                code: "custom",
                path: ["technicianId"],
                message:
                    "technicianId or bookingId is required for TECHNICIAN reviews",
            });
        }
    });

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
