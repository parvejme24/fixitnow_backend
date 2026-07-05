import { z } from "zod";

export const createCategorySchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
    icon: z.string().optional(),
});

export const updateCategorySchema = z
    .object({
        name: z.string().min(2, "Name must be at least 2 characters").optional(),
        description: z.string().optional(),
        icon: z.string().optional(),
    })
    .refine((data) => Object.values(data).some((value) => value !== undefined), {
        message: "At least one field is required to update",
    });

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
