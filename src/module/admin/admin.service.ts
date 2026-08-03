import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import {
    AdminBookingQuery,
    AdminSalesQuery,
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
            experienceYrs: true,
            ratingAvg: true,
            reviewCount: true,
            verified: true,
            online: true,
            areas: {
                select: {
                    area: {
                        select: { id: true, name: true },
                    },
                },
            },
        },
    },
    _count: {
        select: {
            bookings: true,
            reviews: true,
        },
    },
};

const mapAdminUser = <
    T extends {
        technicianProfile: {
            areas: { area: { id: string; name: string } }[];
        } | null;
    },
>(
    user: T
) => {
    if (!user.technicianProfile) {
        return user;
    }

    const { areas, ...profile } = user.technicianProfile;
    return {
        ...user,
        technicianProfile: {
            ...profile,
            areas: areas.map((item) => item.area),
        },
    };
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
    const { page, limit, role, isActive, verified, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
        ...(verified !== undefined && {
            technicianProfile: { verified },
        }),
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
        users: users.map(mapAdminUser),
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
        include: { technicianProfile: true },
    });

    if (!user) {
        throw new AppError("User not found", 404);
    }

    if (user.role === "ADMIN") {
        throw new AppError("Cannot change status of an admin user", 400);
    }

    if (payload.verified !== undefined) {
        if (user.role !== "TECHNICIAN" || !user.technicianProfile) {
            throw new AppError(
                "Only technician accounts can be verified or unverified",
                400
            );
        }

        await prisma.technicianProfile.update({
            where: { id: user.technicianProfile.id },
            data: { verified: payload.verified },
        });
    }

    if (payload.isActive !== undefined) {
        await prisma.user.update({
            where: { id: userId },
            data: { isActive: payload.isActive },
        });
    }

    const updated = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: userSelect,
    });

    return mapAdminUser(updated);
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
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const ADMIN_REVENUE_RATE = 0.4;

    const [
        totalUsers,
        totalCustomers,
        totalTechnicians,
        totalBookings,
        completedBookings,
        cancelledBookings,
        declinedBookings,
        totalSalesAgg,
        todaySalesAgg,
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
        prisma.payment.aggregate({
            where: {
                status: "SUCCESS",
                paidAt: { gte: todayStart, lt: tomorrowStart },
            },
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

    const totalSales = totalSalesAgg._sum.amount || 0;
    const todaySales = todaySalesAgg._sum.amount || 0;
    const adminRevenueTotal = Math.round(totalSales * ADMIN_REVENUE_RATE);
    const adminRevenueToday = Math.round(todaySales * ADMIN_REVENUE_RATE);
    const technicianShareTotal = totalSales - adminRevenueTotal;
    const technicianShareToday = todaySales - adminRevenueToday;

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
        sales: {
            /** Gross successful customer payments (all time) */
            totalSales,
            totalSalesCount: totalSalesAgg._count.id,
            /** Gross successful payments paid today */
            todaySales,
            todaySalesCount: todaySalesAgg._count.id,
            /** Platform keeps 40% of each successful payment */
            adminRevenueRate: ADMIN_REVENUE_RATE,
            adminRevenueTotal,
            adminRevenueToday,
            /** Technician share 60% */
            technicianShareTotal,
            technicianShareToday,
        },
        /** @deprecated use sales.* — kept for older clients */
        revenue: {
            totalBdt: totalSales,
            successfulPayments: totalSalesAgg._count.id,
            adminRevenueBdt: adminRevenueTotal,
            adminRevenueRate: ADMIN_REVENUE_RATE,
        },
        disputes: {
            cancelledPaidJobs: pendingRefunds,
            unverifiedTechnicians,
        },
    };
};

const ADMIN_REVENUE_RATE = 0.4;

/** Paginated successful payments with admin 40% cut per row */
export const getAdminSales = async (query: AdminSalesQuery) => {
    const { page, limit, from, to, today } = query;
    const skip = (page - 1) * limit;

    let paidAtFilter: { gte?: Date; lt?: Date } | undefined;

    if (today) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const tomorrowStart = new Date(todayStart);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        paidAtFilter = { gte: todayStart, lt: tomorrowStart };
    } else if (from || to) {
        paidAtFilter = {
            ...(from && { gte: new Date(from) }),
            ...(to && { lt: new Date(to) }),
        };
    }

    const where = {
        status: "SUCCESS" as const,
        ...(paidAtFilter && { paidAt: paidAtFilter }),
    };

    const [payments, total, salesAgg] = await Promise.all([
        prisma.payment.findMany({
            where,
            select: {
                id: true,
                amount: true,
                method: true,
                status: true,
                providerTxnId: true,
                paidAt: true,
                createdAt: true,
                booking: {
                    select: {
                        id: true,
                        refCode: true,
                        status: true,
                        service: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                        customer: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
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
                                    },
                                },
                            },
                        },
                    },
                },
            },
            skip,
            take: limit,
            orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
        }),
        prisma.payment.count({ where }),
        prisma.payment.aggregate({
            where,
            _sum: { amount: true },
        }),
    ]);

    const totalSales = salesAgg._sum.amount || 0;

    return {
        payments: payments.map((payment) => {
            const adminRevenue = Math.round(payment.amount * ADMIN_REVENUE_RATE);
            return {
                ...payment,
                adminRevenue,
                technicianEarning: payment.amount - adminRevenue,
                adminRevenueRate: ADMIN_REVENUE_RATE,
            };
        }),
        summary: {
            totalSales,
            adminRevenueTotal: Math.round(totalSales * ADMIN_REVENUE_RATE),
            technicianShareTotal:
                totalSales - Math.round(totalSales * ADMIN_REVENUE_RATE),
            adminRevenueRate: ADMIN_REVENUE_RATE,
        },
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 0,
        },
    };
};
