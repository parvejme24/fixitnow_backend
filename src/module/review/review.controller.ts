import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { createReviewSchema } from "./review.interface.js";
import * as reviewService from "./review.service.js";

export const getServiceReviews = catchAsync(
    async (req: Request, res: Response) => {
        const reviews = await reviewService.getServiceReviews(
            req.params.id as string
        );

        res.status(200).json({
            success: true,
            data: reviews,
        });
    }
);

export const getTechnicianReviews = catchAsync(
    async (req: Request, res: Response) => {
        const reviews = await reviewService.getTechnicianReviews(
            req.params.id as string
        );

        res.status(200).json({
            success: true,
            data: reviews,
        });
    }
);

export const createReview = catchAsync(async (req: Request, res: Response) => {
    const payload = createReviewSchema.parse(req.body);
    const review = await reviewService.createReview(req.user!.userId, payload);

    res.status(201).json({
        success: true,
        data: review,
    });
});

export const deleteReview = catchAsync(async (req: Request, res: Response) => {
    const review = await reviewService.deleteReview(
        req.user!.userId,
        req.user!.role,
        req.params.id as string
    );

    res.status(200).json({
        success: true,
        data: review,
    });
});
