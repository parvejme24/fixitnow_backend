import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
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
    initials: true,
    profileImage: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    technicianProfile: {
        select: {
            id: true,
            trade: true,
            ratingAvg: true,
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
    refCode: true,
    scheduledAt: true,
    notes: true,
    status: true,
    servicePrice: true,
    visitFee: true,
    totalAmount: true,
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
            method: true,
        },
    },
};

export const getAllUsers = async (query: AdminUserQuery) => {
    const { page, limit, role, isActive, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
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
        data: { isActive: payload.isActive },
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

export const getAdminStats = async () => {
    const [
        totalUsers,
        totalCustomers,
        totalTechnicians,
        totalBookings,
        completedBookings,
        cancelledBookings,
        declinedBookings,
        revenueAgg,
        pendingRefunds,
        unverifiedTechnicians,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: "CUSTOMER" } }),
        prisma.user.count({ where: { role: "TECHNICIAN" } }),
        prisma.booking.count(),
        prisma.booking.count({ where: { status: "COMPLETED" } }),
        prisma.booking.count({ where: { status: "CANCELLED" } }),
        prisma.booking.count({ where: { status: "DECLINED" } }),
        prisma.payment.aggregate({
            where: { status: "SUCCESS" },
            _sum: { amount: true },
            _count: { id: true },
        }),
        prisma.payment.count({
            where: {
                status: "SUCCESS",
                booking: { status: "CANCELLED" },
            },
        }),
        prisma.technicianProfile.count({ where: { verified: false } }),
    ]);

    return {
        users: {
            total: totalUsers,
            customers: totalCustomers,
            technicians: totalTechnicians,
        },
        jobs: {
            total: totalBookings,
            completed: completedBookings,
            cancelled: cancelledBookings,
            declined: declinedBookings,
        },
        revenue: {
            totalBdt: revenueAgg._sum.amount || 0,
            successfulPayments: revenueAgg._count.id,
        },
        disputes: {
            cancelledPaidJobs: pendingRefunds,
            unverifiedTechnicians,
        },
    };
};
