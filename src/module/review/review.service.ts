import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { CreateReviewInput } from "./review.interface.js";

const reviewSelect = {
    id: true,
    rating: true,
    body: true,
    target: true,
    authorName: true,
    authorInitials: true,
    serviceId: true,
    technicianId: true,
    bookingId: true,
    createdAt: true,
};

const recalcServiceRating = async (serviceId: string) => {
    const stats = await prisma.review.aggregate({
        where: { serviceId, target: "SERVICE" },
        _avg: { rating: true },
        _count: { rating: true },
    });

    await prisma.service.update({
        where: { id: serviceId },
        data: {
            ratingAvg: stats._avg.rating || 0,
            reviewCount: stats._count.rating,
        },
    });
};

const recalcTechnicianRating = async (technicianId: string) => {
    const stats = await prisma.review.aggregate({
        where: { technicianId, target: "TECHNICIAN" },
        _avg: { rating: true },
        _count: { rating: true },
    });

    await prisma.technicianProfile.update({
        where: { id: technicianId },
        data: {
            ratingAvg: stats._avg.rating || 0,
            reviewCount: stats._count.rating,
        },
    });
};

export const getServiceReviews = async (serviceId: string) => {
    const service = await prisma.service.findFirst({
        where: { id: serviceId, isActive: true },
        select: { id: true },
    });

    if (!service) {
        throw new AppError("Service not found", 404);
    }

    return prisma.review.findMany({
        where: { serviceId, target: "SERVICE" },
        select: reviewSelect,
        orderBy: { createdAt: "desc" },
    });
};

export const getTechnicianReviews = async (technicianId: string) => {
    const technician = await prisma.technicianProfile.findFirst({
        where: { id: technicianId, user: { isActive: true } },
        select: { id: true },
    });

    if (!technician) {
        throw new AppError("Technician not found", 404);
    }

    return prisma.review.findMany({
        where: { technicianId, target: "TECHNICIAN" },
        select: reviewSelect,
        orderBy: { createdAt: "desc" },
    });
};

export const createReview = async (
    customerId: string,
    payload: CreateReviewInput
) => {
    const author = await prisma.user.findUnique({
        where: { id: customerId },
        select: { name: true, initials: true },
    });

    if (!author) {
        throw new AppError("User not found", 404);
    }

    let serviceId = payload.serviceId;
    let technicianId = payload.technicianId;
    let bookingId = payload.bookingId;

    if (bookingId) {
        const booking = await prisma.booking.findFirst({
            where: { id: bookingId, customerId },
            include: { review: true },
        });

        if (!booking) {
            throw new AppError("Booking not found", 404);
        }

        if (booking.status !== "COMPLETED") {
            throw new AppError(
                "Review can only be created for completed bookings",
                400
            );
        }

        if (booking.review) {
            throw new AppError("Review already exists for this booking", 409);
        }

        serviceId = serviceId || booking.serviceId;
        technicianId = technicianId || booking.technicianId;
    }

    if (payload.target === "SERVICE" && !serviceId) {
        throw new AppError("serviceId is required", 400);
    }

    if (payload.target === "TECHNICIAN" && !technicianId) {
        throw new AppError("technicianId is required", 400);
    }

    const authorInitials =
        author.initials ||
        author.name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? "")
            .join("");

    return prisma.$transaction(async (tx) => {
        const review = await tx.review.create({
            data: {
                bookingId,
                authorId: customerId,
                authorName: author.name,
                authorInitials,
                rating: payload.rating,
                body: payload.body,
                target: payload.target,
                serviceId: payload.target === "SERVICE" ? serviceId : undefined,
                technicianId:
                    payload.target === "TECHNICIAN" ? technicianId : undefined,
            },
            select: reviewSelect,
        });

        if (payload.target === "TECHNICIAN" && technicianId) {
            const stats = await tx.review.aggregate({
                where: { technicianId, target: "TECHNICIAN" },
                _avg: { rating: true },
                _count: { rating: true },
            });

            await tx.technicianProfile.update({
                where: { id: technicianId },
                data: {
                    ratingAvg: stats._avg.rating || 0,
                    reviewCount: stats._count.rating,
                },
            });
        }

        if (payload.target === "SERVICE" && serviceId) {
            const stats = await tx.review.aggregate({
                where: { serviceId, target: "SERVICE" },
                _avg: { rating: true },
                _count: { rating: true },
            });

            await tx.service.update({
                where: { id: serviceId },
                data: {
                    ratingAvg: stats._avg.rating || 0,
                    reviewCount: stats._count.rating,
                },
            });
        }

        return review;
    });
};

export const deleteReview = async (
    userId: string,
    role: string,
    reviewId: string
) => {
    const review = await prisma.review.findUnique({
        where: { id: reviewId },
    });

    if (!review) {
        throw new AppError("Review not found", 404);
    }

    if (role !== "ADMIN" && review.authorId !== userId) {
        throw new AppError("You can only delete your own reviews", 403);
    }

    await prisma.review.delete({ where: { id: reviewId } });

    if (review.target === "SERVICE" && review.serviceId) {
        await recalcServiceRating(review.serviceId);
    }

    if (review.target === "TECHNICIAN" && review.technicianId) {
        await recalcTechnicianRating(review.technicianId);
    }

    return review;
};
