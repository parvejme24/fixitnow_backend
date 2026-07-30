import { z } from "zod";

const booleanFromForm = z.preprocess((value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["true", "1", "yes", "on"].includes(normalized)) return true;
        if (["false", "0", "no", "off"].includes(normalized)) return false;
    }
    return value;
}, z.boolean());

export const createCategorySchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    slug: z.string().min(2, "Slug must be at least 2 characters"),
    icon: z.string().min(1, "Icon emoji is required").max(16),
    /** Show in customer search / category cards right away */
    isVisible: booleanFromForm.optional().default(true),
    sortOrder: z.coerce.number().int().optional(),
});

export const updateCategorySchema = z
    .object({
        name: z.string().min(2, "Name must be at least 2 characters").optional(),
        slug: z.string().min(2, "Slug must be at least 2 characters").optional(),
        icon: z.string().min(1).max(16).nullable().optional(),
        isVisible: booleanFromForm.optional(),
        sortOrder: z.coerce.number().int().optional(),
    })
    .refine((data) => Object.values(data).some((value) => value !== undefined), {
        message: "At least one field is required to update",
    });

export const toggleCategoryVisibilitySchema = z.object({
    isVisible: booleanFromForm,
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ToggleCategoryVisibilityInput = z.infer<
    typeof toggleCategoryVisibilitySchema
>;
