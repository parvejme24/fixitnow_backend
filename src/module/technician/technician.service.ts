import { BookingStatus } from "../../../generated/prisma/enums.js";
import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import {
    TechnicianBookingQuery,
    TechnicianQuery,
    UpdateAvailabilityInput,
    UpdateBookingStatusInput,
    UpdateProfileInput,
} from "./technician.interface.js";

const technicianListSelect = {
    id: true,
    bio: true,
    skills: true,
    experienceYears: true,
    hourlyRate: true,
    location: true,
    avgRating: true,
    totalReviews: true,
    user: {
        select: {
            id: true,
            name: true,
            phone: true,
        },
    },
    services: {
        where: { isActive: true },
        select: {
            id: true,
            title: true,
            price: true,
            category: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        take: 3,
    },
} satisfies Prisma.TechnicianProfileSelect;

const profileSelect = {
    id: true,
    bio: true,
    skills: true,
    experienceYears: true,
    hourlyRate: true,
    location: true,
    avgRating: true,
    totalReviews: true,
    createdAt: true,
    updatedAt: true,
    user: {
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
        },
    },
    availability: {
        select: {
            id: true,
            day: true,
            startTime: true,
            endTime: true,
        },
        orderBy: { day: "asc" as const },
    },
};

const bookingSelect = {
    id: true,
    scheduledAt: true,
    address: true,
    notes: true,
    status: true,
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
    service: {
        select: {
            id: true,
            title: true,
            price: true,
            category: {
                select: {
                    id: true,
                    name: true,
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
        },
    },
};

const technicianStatusTransitions: Partial<
    Record<BookingStatus, BookingStatus[]>
> = {
    REQUESTED: ["ACCEPTED", "DECLINED"],
    PAID: ["IN_PROGRESS"],
    IN_PROGRESS: ["COMPLETED"],
};

const getTechnicianProfileByUserId = async (userId: string) => {
    const existingProfile = await prisma.technicianProfile.findUnique({
        where: { userId },
    });

    if (existingProfile) {
        return existingProfile;
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, status: true },
    });

    if (!user || user.role !== "TECHNICIAN") {
        throw new AppError("Technician profile not found", 404);
    }

    if (user.status === "BANNED") {
        throw new AppError("Your account has been banned", 403);
    }

    return prisma.technicianProfile.create({
        data: { userId },
    });
};

const validateTimeRange = (startTime: string, endTime: string) => {
    if (startTime >= endTime) {
        throw new AppError("startTime must be before endTime", 400);
    }
};

export const getAllTechnicians = async (query: TechnicianQuery) => {
    const { page, limit, location, minRating, categoryId, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TechnicianProfileWhereInput = {
        user: { status: "ACTIVE" },
        ...(location && {
            location: { contains: location, mode: "insensitive" },
        }),
        ...(minRating !== undefined && { avgRating: { gte: minRating } }),
        ...(categoryId && {
            services: { some: { categoryId, isActive: true } },
        }),
        ...(search && {
            OR: [
                { user: { name: { contains: search, mode: "insensitive" } } },
                { location: { contains: search, mode: "insensitive" } },
                { bio: { contains: search, mode: "insensitive" } },
            ],
        }),
    };

    const [technicians, total] = await Promise.all([
        prisma.technicianProfile.findMany({
            where,
            select: technicianListSelect,
            skip,
            take: limit,
            orderBy: { avgRating: "desc" },
        }),
        prisma.technicianProfile.count({ where }),
    ]);

    return {
        technicians,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

export const getTechnicianById = async (id: string) => {
    const technician = await prisma.technicianProfile.findFirst({
        where: {
            id,
            user: { status: "ACTIVE" },
        },
        select: {
            id: true,
            bio: true,
            skills: true,
            experienceYears: true,
            hourlyRate: true,
            location: true,
            avgRating: true,
            totalReviews: true,
            createdAt: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    email: true,
                },
            },
            services: {
                where: { isActive: true },
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
            availability: {
                select: {
                    id: true,
                    day: true,
                    startTime: true,
                    endTime: true,
                },
                orderBy: { day: "asc" },
            },
            reviews: {
                select: {
                    id: true,
                    rating: true,
                    comment: true,
                    createdAt: true,
                    customer: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            },
        },
    });

    if (!technician) {
        throw new AppError("Technician not found", 404);
    }

    return technician;
};

export const updateTechnicianProfile = async (
    userId: string,
    payload: UpdateProfileInput
) => {
    const profile = await getTechnicianProfileByUserId(userId);

    return prisma.technicianProfile.update({
        where: { id: profile.id },
        data: payload,
        select: profileSelect,
    });
};

export const updateTechnicianAvailability = async (
    userId: string,
    payload: UpdateAvailabilityInput
) => {
    const profile = await getTechnicianProfileByUserId(userId);

    const uniqueDays = new Set(payload.slots.map((slot) => slot.day));
    if (uniqueDays.size !== payload.slots.length) {
        throw new AppError("Duplicate days are not allowed in availability", 400);
    }

    payload.slots.forEach((slot) => {
        validateTimeRange(slot.startTime, slot.endTime);
    });

    return prisma.$transaction(async (tx) => {
        await tx.availabilitySlot.deleteMany({
            where: { technicianId: profile.id },
        });

        await tx.availabilitySlot.createMany({
            data: payload.slots.map((slot) => ({
                technicianId: profile.id,
                day: slot.day,
                startTime: slot.startTime,
                endTime: slot.endTime,
            })),
        });

        return tx.technicianProfile.findUniqueOrThrow({
            where: { id: profile.id },
            select: profileSelect,
        });
    });
};

export const getTechnicianBookings = async (
    userId: string,
    query: TechnicianBookingQuery
) => {
    const profile = await getTechnicianProfileByUserId(userId);
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const where = {
        technicianId: profile.id,
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

export const updateTechnicianBookingStatus = async (
    userId: string,
    bookingId: string,
    payload: UpdateBookingStatusInput
) => {
    const profile = await getTechnicianProfileByUserId(userId);

    const booking = await prisma.booking.findFirst({
        where: {
            id: bookingId,
            technicianId: profile.id,
        },
    });

    if (!booking) {
        throw new AppError("Booking not found", 404);
    }

    const allowedStatuses = technicianStatusTransitions[booking.status];

    if (!allowedStatuses?.includes(payload.status)) {
        throw new AppError(
            `Cannot change booking status from ${booking.status} to ${payload.status}`,
            400
        );
    }

    return prisma.booking.update({
        where: { id: bookingId },
        data: { status: payload.status },
        select: bookingSelect,
    });
};
