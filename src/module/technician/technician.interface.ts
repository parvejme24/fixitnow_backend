import { z } from "zod";
import { paginationSchema } from "../service/service.interface.js";

const timeSchema = z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in HH:mm format");

export const technicianQuerySchema = paginationSchema.extend({
    location: z.string().optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    categoryId: z.string().optional(),
    search: z.string().optional(),
});

export const updateProfileSchema = z
    .object({
        bio: z.string().optional(),
        skills: z.array(z.string().min(1)).optional(),
        experienceYears: z.coerce.number().int().min(0).optional(),
        hourlyRate: z.coerce.number().min(0).optional(),
        location: z.string().optional(),
    })
    .refine((data) => Object.values(data).some((value) => value !== undefined), {
        message: "At least one field is required to update",
    });

export const availabilitySlotSchema = z.object({
    day: z.enum([
        "SATURDAY",
        "SUNDAY",
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
    ]),
    startTime: timeSchema,
    endTime: timeSchema,
});

export const updateAvailabilitySchema = z.object({
    slots: z.array(availabilitySlotSchema).min(1, "At least one slot is required"),
});

export const technicianBookingQuerySchema = paginationSchema.extend({
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

export const updateBookingStatusSchema = z.object({
    status: z.enum(["ACCEPTED", "DECLINED", "IN_PROGRESS", "COMPLETED"]),
});

export const createServiceSchema = z.object({
    title: z.string().min(2, "Title must be at least 2 characters"),
    description: z.string().optional(),
    price: z.coerce.number().positive("Price must be greater than 0"),
    categoryId: z.string().min(1, "Category is required"),
});

export const updateServiceSchema = z
    .object({
        title: z.string().min(2, "Title must be at least 2 characters").optional(),
        description: z.string().optional(),
        price: z.coerce.number().positive("Price must be greater than 0").optional(),
        categoryId: z.string().optional(),
        isActive: z.boolean().optional(),
    })
    .refine((data) => Object.values(data).some((value) => value !== undefined), {
        message: "At least one field is required to update",
    });

export type TechnicianQuery = z.infer<typeof technicianQuerySchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
export type TechnicianBookingQuery = z.infer<typeof technicianBookingQuerySchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
