import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { createReviewSchema } from "./review.interface.js";
import * as reviewService from "./review.service.js";

export const createReview = catchAsync(async (req: Request, res: Response) => {
    const payload = createReviewSchema.parse(req.body);
    const review = await reviewService.createReview(req.user!.userId, payload);

    res.status(201).json({
        success: true,
        message: "Review created successfully",
        data: review,
    });
});
