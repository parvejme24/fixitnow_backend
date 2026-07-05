import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { BookingQuery, CreateBookingInput } from "./booking.interface.js";

const bookingSelect = {
    id: true,
    scheduledAt: true,
    address: true,
    notes: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    technician: {
        select: {
            id: true,
            location: true,
            avgRating: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                },
            },
        },
    },
    service: {
        select: {
            id: true,
            title: true,
            description: true,
            price: true,
            category: {
                select: {
                    id: true,
                    name: true,
                    icon: true,
                },
            },
        },
    },
    payment: {
        select: {
            id: true,
            status: true,
            amount: true,
            provider: true,
            paidAt: true,
        },
    },
    review: {
        select: {
            id: true,
            rating: true,
            comment: true,
        },
    },
};

export const createBooking = async (
    customerId: string,
    payload: CreateBookingInput
) => {
    if (payload.scheduledAt <= new Date()) {
        throw new AppError("Scheduled time must be in the future", 400);
    }

    const service = await prisma.service.findFirst({
        where: {
            id: payload.serviceId,
            isActive: true,
            technician: {
                user: { status: "ACTIVE" },
            },
        },
        select: {
            id: true,
            technicianId: true,
        },
    });

    if (!service) {
        throw new AppError("Service not found or unavailable", 404);
    }

    return prisma.booking.create({
        data: {
            customerId,
            technicianId: service.technicianId,
            serviceId: service.id,
            scheduledAt: payload.scheduledAt,
            address: payload.address,
            notes: payload.notes,
            status: "REQUESTED",
        },
        select: bookingSelect,
    });
};

export const getCustomerBookings = async (
    customerId: string,
    query: BookingQuery
) => {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const where = {
        customerId,
        ...(status && { status }),
    };

    const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
            where,
            select: bookingSelect,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
        }),
        prisma.booking.count({ where }),
    ]);

    return {
        bookings,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

export const getBookingById = async (customerId: string, bookingId: string) => {
    const booking = await prisma.booking.findFirst({
        where: {
            id: bookingId,
            customerId,
        },
        select: bookingSelect,
    });

    if (!booking) {
        throw new AppError("Booking not found", 404);
    }

    return booking;
};
