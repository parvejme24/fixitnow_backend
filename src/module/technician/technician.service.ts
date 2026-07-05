import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { TechnicianQuery } from "./technician.interface.js";

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
