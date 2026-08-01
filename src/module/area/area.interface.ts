import { z } from "zod";

export const createAreaSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(80),
});

export const updateAreaSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(80),
});

export type CreateAreaInput = z.infer<typeof createAreaSchema>;
export type UpdateAreaInput = z.infer<typeof updateAreaSchema>;
