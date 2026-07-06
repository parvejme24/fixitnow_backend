import { z } from "zod";

export const createReviewSchema = z.object({
    bookingId: z.string().min(1, "Booking ID is required"),
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
