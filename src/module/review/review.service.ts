import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { CreateReviewInput } from "./review.interface.js";

const reviewSelect = {
    id: true,
    rating: true,
    comment: true,
    createdAt: true,
    booking: {
        select: {
            id: true,
            status: true,
            service: {
                select: {
                    id: true,
                    title: true,
                },
            },
        },
    },
    technician: {
        select: {
            id: true,
            avgRating: true,
            totalReviews: true,
            user: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    },
};

export const createReview = async (
    customerId: string,
    payload: CreateReviewInput
) => {
    const booking = await prisma.booking.findFirst({
        where: {
            id: payload.bookingId,
            customerId,
        },
        include: {
            review: true,
        },
    });

    if (!booking) {
        throw new AppError("Booking not found", 404);
    }

    if (booking.status !== "COMPLETED") {
        throw new AppError("Review can only be created for completed bookings", 400);
    }

    if (booking.review) {
        throw new AppError("Review already exists for this booking", 409);
    }

    return prisma.$transaction(async (tx) => {
        const review = await tx.review.create({
            data: {
                bookingId: booking.id,
                customerId,
                technicianId: booking.technicianId,
                rating: payload.rating,
                comment: payload.comment,
            },
            select: reviewSelect,
        });

        const stats = await tx.review.aggregate({
            where: { technicianId: booking.technicianId },
            _avg: { rating: true },
            _count: { rating: true },
        });

        await tx.technicianProfile.update({
            where: { id: booking.technicianId },
            data: {
                avgRating: stats._avg.rating || 0,
                totalReviews: stats._count.rating,
            },
        });

        return review;
    });
};
