import { BookingStatus } from "../../../generated/prisma/enums.js";
import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { getTechnicianProfileByUserId } from "../technician/technician.service.js";
import {
    BookingQuery,
    CreateBookingInput,
    UpdateBookingStatusInput,
} from "./booking.interface.js";

const bookingSelect = {
    id: true,
    refCode: true,
    status: true,
    scheduledAt: true,
    slotLabel: true,
    servicePrice: true,
    visitFee: true,
    totalAmount: true,
    notes: true,
    requestedAt: true,
    acceptedAt: true,
    declinedAt: true,
    paidAt: true,
    completedAt: true,
    cancelledAt: true,
    createdAt: true,
    updatedAt: true,
    customer: {
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
        },
    },
    technician: {
        select: {
            id: true,
            trade: true,
            initials: true,
            ratingAvg: true,
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
                },
            },
        },
    },
    slot: {
        select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true,
        },
    },
    payment: {
        select: {
            id: true,
            status: true,
            amount: true,
            method: true,
            paidAt: true,
        },
    },
    review: {
        select: {
            id: true,
            rating: true,
            body: true,
        },
    },
} satisfies Prisma.BookingSelect;

const slotLabelFormatter = (date: Date, startTime: string) => {
    const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "short" });
    return `${weekday} ${day} ${month} · ${startTime}`;
};

const generateRefCode = async () => {
    for (let attempt = 0; attempt < 10; attempt++) {
        const n = 4830 + Math.floor(Math.random() * 60);
        const refCode = `FIX-${n}`;
        const existing = await prisma.booking.findUnique({ where: { refCode } });
        if (!existing) {
            return refCode;
        }
    }

    return `FIX-${Date.now().toString().slice(-6)}`;
};

const findBookingForOwner = async (
    bookingKey: string,
    userId: string,
    role: string
) => {
    const whereBase: Prisma.BookingWhereInput = {
        OR: [{ id: bookingKey }, { refCode: bookingKey }],
    };

    if (role === "ADMIN") {
        return prisma.booking.findFirst({
            where: whereBase,
            select: bookingSelect,
        });
    }

    if (role === "TECHNICIAN") {
        const profile = await getTechnicianProfileByUserId(userId);
        return prisma.booking.findFirst({
            where: { ...whereBase, technicianId: profile.id },
            select: bookingSelect,
        });
    }

    return prisma.booking.findFirst({
        where: { ...whereBase, customerId: userId },
        select: bookingSelect,
    });
};

export const createBooking = async (
    customerId: string,
    payload: CreateBookingInput
) => {
    const service = await prisma.service.findFirst({
        where: { id: payload.serviceId, isActive: true },
        select: { id: true, price: true },
    });

    if (!service) {
        throw new AppError("Service not found or unavailable", 404);
    }

    const technician = await prisma.technicianProfile.findFirst({
        where: { id: payload.technicianId, user: { isActive: true } },
        select: { id: true, visitFee: true },
    });

    if (!technician) {
        throw new AppError("Technician not found or unavailable", 404);
    }

    const slot = await prisma.availabilitySlot.findFirst({
        where: {
            id: payload.slotId,
            technicianId: technician.id,
            isBooked: false,
        },
    });

    if (!slot) {
        throw new AppError("Selected slot is not available", 400);
    }

    const servicePrice = service.price;
    const visitFee = technician.visitFee;
    const totalAmount = servicePrice + visitFee;
    const refCode = await generateRefCode();

    const booking = await prisma.$transaction(async (tx) => {
        await tx.availabilitySlot.update({
            where: { id: payload.slotId },
            data: { isBooked: true },
        });

        return tx.booking.create({
            data: {
                refCode,
                customerId,
                technicianId: technician.id,
                serviceId: service.id,
                slotId: payload.slotId,
                scheduledAt: slot.date,
                slotLabel: slotLabelFormatter(slot.date, slot.startTime),
                servicePrice,
                visitFee,
                totalAmount,
                notes: payload.notes,
                status: "REQUESTED",
            },
            select: {
                id: true,
                refCode: true,
                totalAmount: true,
                status: true,
            },
        });
    });

    return booking;
};

export const getMyBookings = async (
    userId: string,
    role: string,
    query: BookingQuery
) => {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    let where: Prisma.BookingWhereInput = {
        ...(status && { status }),
    };

    if (role === "TECHNICIAN") {
        const profile = await getTechnicianProfileByUserId(userId);
        where = { ...where, technicianId: profile.id };
    } else if (role === "ADMIN") {
        // admin sees all
    } else {
        where = { ...where, customerId: userId };
    }

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

export const getBookingById = async (
    userId: string,
    role: string,
    bookingKey: string
) => {
    const booking = await findBookingForOwner(bookingKey, userId, role);

    if (!booking) {
        throw new AppError("Booking not found", 404);
    }

    return booking;
};

const cancellableStatuses = ["REQUESTED", "ACCEPTED", "PAID"] as const;

export const cancelBooking = async (customerId: string, bookingKey: string) => {
    const booking = await prisma.booking.findFirst({
        where: {
            customerId,
            OR: [{ id: bookingKey }, { refCode: bookingKey }],
        },
    });

    if (!booking) {
        throw new AppError("Booking not found", 404);
    }

    if (
        !cancellableStatuses.includes(
            booking.status as (typeof cancellableStatuses)[number]
        )
    ) {
        throw new AppError(
            `Booking cannot be cancelled when status is ${booking.status}`,
            400
        );
    }

    return prisma.$transaction(async (tx) => {
        if (booking.slotId) {
            await tx.availabilitySlot.update({
                where: { id: booking.slotId },
                data: { isBooked: false },
            });
        }

        return tx.booking.update({
            where: { id: booking.id },
            data: { status: "CANCELLED", cancelledAt: new Date() },
            select: bookingSelect,
        });
    });
};

export const acceptBooking = async (userId: string, bookingKey: string) => {
    const profile = await getTechnicianProfileByUserId(userId);

    const booking = await prisma.booking.findFirst({
        where: {
            technicianId: profile.id,
            OR: [{ id: bookingKey }, { refCode: bookingKey }],
        },
    });

    if (!booking) {
        throw new AppError("Booking not found", 404);
    }

    if (booking.status !== "REQUESTED") {
        throw new AppError(
            `Only REQUESTED bookings can be accepted. Current: ${booking.status}`,
            400
        );
    }

    return prisma.booking.update({
        where: { id: booking.id },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
        select: bookingSelect,
    });
};

export const declineBooking = async (userId: string, bookingKey: string) => {
    const profile = await getTechnicianProfileByUserId(userId);

    const booking = await prisma.booking.findFirst({
        where: {
            technicianId: profile.id,
            OR: [{ id: bookingKey }, { refCode: bookingKey }],
        },
    });

    if (!booking) {
        throw new AppError("Booking not found", 404);
    }

    if (booking.status !== "REQUESTED") {
        throw new AppError(
            `Only REQUESTED bookings can be declined. Current: ${booking.status}`,
            400
        );
    }

    return prisma.$transaction(async (tx) => {
        if (booking.slotId) {
            await tx.availabilitySlot.update({
                where: { id: booking.slotId },
                data: { isBooked: false },
            });
        }

        return tx.booking.update({
            where: { id: booking.id },
            data: { status: "DECLINED", declinedAt: new Date() },
            select: bookingSelect,
        });
    });
};

const statusTransitions: Partial<Record<BookingStatus, BookingStatus[]>> = {
    PAID: ["EN_ROUTE"],
    EN_ROUTE: ["ON_SITE"],
    ON_SITE: ["COMPLETED"],
};

export const updateBookingStatus = async (
    userId: string,
    role: string,
    bookingKey: string,
    payload: UpdateBookingStatusInput
) => {
    let booking;

    if (role === "ADMIN") {
        booking = await prisma.booking.findFirst({
            where: {
                OR: [{ id: bookingKey }, { refCode: bookingKey }],
            },
        });
    } else {
        const profile = await getTechnicianProfileByUserId(userId);
        booking = await prisma.booking.findFirst({
            where: {
                technicianId: profile.id,
                OR: [{ id: bookingKey }, { refCode: bookingKey }],
            },
        });
    }

    if (!booking) {
        throw new AppError("Booking not found", 404);
    }

    const allowed = statusTransitions[booking.status];
    if (!allowed?.includes(payload.status)) {
        throw new AppError(
            `Cannot change booking status from ${booking.status} to ${payload.status}`,
            400
        );
    }

    return prisma.$transaction(async (tx) => {
        const updated = await tx.booking.update({
            where: { id: booking.id },
            data: {
                status: payload.status,
                ...(payload.status === "COMPLETED" && {
                    completedAt: new Date(),
                }),
            },
            select: bookingSelect,
        });

        if (payload.status === "COMPLETED") {
            await tx.technicianProfile.update({
                where: { id: booking.technicianId },
                data: { jobsCompleted: { increment: 1 } },
            });
            await tx.category.updateMany({
                where: {
                    services: { some: { id: booking.serviceId } },
                },
                data: { jobsDone: { increment: 1 } },
            });
        }

        return updated;
    });
};
