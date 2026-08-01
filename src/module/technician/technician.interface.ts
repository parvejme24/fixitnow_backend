import { z } from "zod";
import { paginationSchema } from "../service/service.interface.js";

export const technicianQuerySchema = paginationSchema.extend({
    q: z.string().optional(),
    search: z.string().optional(),
    cat: z.string().optional(),
    categoryId: z.string().optional(),
    area: z.string().optional(),
    areaId: z.string().optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    maxRate: z.coerce.number().min(0).optional(),
    today: z.coerce.boolean().optional(),
    online: z.coerce.boolean().optional(),
    sort: z.enum(["pop", "rating", "price-asc", "price-desc"]).optional(),
});

export const slotsQuerySchema = z.object({
    from: z.string().optional(),
    days: z.coerce.number().int().min(1).max(30).default(7),
});

export const updateProfileSchema = z
    .object({
        trade: z.string().min(2, "Trade must be at least 2 characters").optional(),
        bio: z.string().optional(),
        visitFee: z.coerce.number().min(0).optional(),
        experienceYrs: z.coerce.number().int().min(0).optional(),
        coverKm: z.coerce.number().int().min(0).optional(),
        replyMins: z.coerce.number().int().min(0).optional(),
        online: z.boolean().optional(),
        initials: z.string().min(1).max(4).optional(),
    })
    .refine((data) => Object.values(data).some((value) => value !== undefined), {
        message: "At least one field is required to update",
    });

export const updateSkillsSchema = z.object({
    skills: z.array(z.string().min(1)),
});

export const updateCategoriesSchema = z.object({
    categoryIds: z.array(z.string().min(1)),
});

/** Replace technician service zones (must be admin-created areas) */
export const updateAreasSchema = z.object({
    areaIds: z.array(z.string().min(1)).min(1, "Select at least one area"),
});

export const createAvailabilitySlotSchema = z.object({
    date: z.coerce.date({ message: "Valid date is required" }),
    startTime: z.string().min(1, "startTime is required"),
    endTime: z.string().optional(),
});

export const updateAvailabilitySlotSchema = z
    .object({
        date: z.coerce.date().optional(),
        startTime: z.string().min(1).optional(),
        endTime: z.string().optional().nullable(),
        isBooked: z.boolean().optional(),
    })
    .refine((data) => Object.values(data).some((value) => value !== undefined), {
        message: "At least one field is required to update",
    });

export const verifyTechnicianSchema = z.object({
    verified: z.boolean(),
});

export type TechnicianQuery = z.infer<typeof technicianQuerySchema>;
export type SlotsQuery = z.infer<typeof slotsQuerySchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateSkillsInput = z.infer<typeof updateSkillsSchema>;
export type UpdateCategoriesInput = z.infer<typeof updateCategoriesSchema>;
export type UpdateAreasInput = z.infer<typeof updateAreasSchema>;
export type CreateAvailabilitySlotInput = z.infer<typeof createAvailabilitySlotSchema>;
export type UpdateAvailabilitySlotInput = z.infer<typeof updateAvailabilitySlotSchema>;
export type VerifyTechnicianInput = z.infer<typeof verifyTechnicianSchema>;
