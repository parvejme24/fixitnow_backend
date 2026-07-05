import { z } from "zod";
import { paginationSchema } from "../service/service.interface.js";

export const technicianQuerySchema = paginationSchema.extend({
    location: z.string().optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    categoryId: z.string().optional(),
    search: z.string().optional(),
});

export type TechnicianQuery = z.infer<typeof technicianQuerySchema>;
