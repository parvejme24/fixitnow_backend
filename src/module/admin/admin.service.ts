import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { getAllCategories } from "../category/category.service.js";
import {
    AdminBookingQuery,
    AdminUserQuery,
    UpdateUserStatusInput,
} from "./admin.interface.js";

const userSelect = {
    id: true,
    name: true,
    email: true,
    phone: true,
    role: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    technicianProfile: {
        select: {
            id: true,
            location: true,
            avgRating: true,
        },
    },
    _count: {
        select: {
            bookings: true,
            reviews: true,
        },
    },
};

const adminBookingSelect = {
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
    technician: {
        select: {
            id: true,
            location: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
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

export const getAllUsers = async (query: AdminUserQuery) => {
    const { page, limit, role, status, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
        ...(role && { role }),
        ...(status && { status }),
        ...(search && {
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ],
        }),
    };

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            select: userSelect,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
        }),
        prisma.user.count({ where }),
    ]);

    return {
        users,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

export const updateUserStatus = async (
    userId: string,
    payload: UpdateUserStatusInput
) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new AppError("User not found", 404);
    }

    if (user.role === "ADMIN") {
        throw new AppError("Cannot change status of an admin user", 400);
    }

    return prisma.user.update({
        where: { id: userId },
        data: { status: payload.status },
        select: userSelect,
    });
};

export const getAllBookings = async (query: AdminBookingQuery) => {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const where = {
        ...(status && { status }),
    };

    const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
            where,
            select: adminBookingSelect,
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

export const getAdminCategories = async () => {
    return getAllCategories();
};
