import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { ServiceQuery } from "./service.interface.js";

const serviceSelect = {
    id: true,
    title: true,
    description: true,
    price: true,
    isActive: true,
    createdAt: true,
    category: {
        select: {
            id: true,
            name: true,
            icon: true,
        },
    },
    technician: {
        select: {
            id: true,
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
        },
    },
} satisfies Prisma.ServiceSelect;

export const getAllServices = async (query: ServiceQuery) => {
    const { page, limit, categoryId, location, minRating, minPrice, maxPrice, search } =
        query;
    const skip = (page - 1) * limit;

    const where: Prisma.ServiceWhereInput = {
        isActive: true,
        technician: {
            user: { status: "ACTIVE" },
            ...(location && {
                location: { contains: location, mode: "insensitive" },
            }),
            ...(minRating !== undefined && { avgRating: { gte: minRating } }),
        },
        ...(categoryId && { categoryId }),
        ...((minPrice !== undefined || maxPrice !== undefined) && {
            price: {
                ...(minPrice !== undefined && { gte: minPrice }),
                ...(maxPrice !== undefined && { lte: maxPrice }),
            },
        }),
        ...(search && {
            OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ],
        }),
    };

    const [services, total] = await Promise.all([
        prisma.service.findMany({
            where,
            select: serviceSelect,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
        }),
        prisma.service.count({ where }),
    ]);

    return {
        services,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};
