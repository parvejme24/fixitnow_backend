import { z } from "zod";

export const createCategorySchema = z.object({
    id: z.string().min(1, "Id is required"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    slug: z.string().min(2, "Slug must be at least 2 characters"),
    sortOrder: z.coerce.number().int().optional(),
});

export const updateCategorySchema = z
    .object({
        name: z.string().min(2, "Name must be at least 2 characters").optional(),
        slug: z.string().min(2, "Slug must be at least 2 characters").optional(),
        sortOrder: z.coerce.number().int().optional(),
    })
    .refine((data) => Object.values(data).some((value) => value !== undefined), {
        message: "At least one field is required to update",
    });

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
