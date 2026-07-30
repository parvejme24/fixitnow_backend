import { z } from "zod";

export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const serviceQuerySchema = paginationSchema.extend({
    q: z.string().optional(),
    search: z.string().optional(),
    cat: z.string().optional(),
    categoryId: z.string().optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    sort: z.enum(["pop", "rating", "price-asc", "price-desc"]).optional(),
    featured: z.coerce.boolean().optional(),
    tag: z.enum(["MOST_BOOKED", "TOP_RATED", "EMERGENCY"]).optional(),
});

export const createServiceSchema = z.object({
    categoryId: z.string().min(1, "Category is required"),
    title: z.string().min(2, "Title is required"),
    description: z.string().min(1, "Description is required"),
    price: z.coerce.number().int().min(0),
    duration: z.string().min(1, "Duration is required"),
    tag: z.enum(["MOST_BOOKED", "TOP_RATED", "EMERGENCY"]).optional().nullable(),
    isFeatured: z.boolean().optional(),
    sortOrder: z.coerce.number().int().optional(),
});

export const updateServiceSchema = z
    .object({
        categoryId: z.string().min(1).optional(),
        title: z.string().min(2).optional(),
        description: z.string().min(1).optional(),
        price: z.coerce.number().int().min(0).optional(),
        duration: z.string().min(1).optional(),
        tag: z.enum(["MOST_BOOKED", "TOP_RATED", "EMERGENCY"]).optional().nullable(),
        isFeatured: z.boolean().optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.coerce.number().int().optional(),
    })
    .refine((data) => Object.values(data).some((value) => value !== undefined), {
        message: "At least one field is required to update",
    });

export type ServiceQuery = z.infer<typeof serviceQuerySchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
