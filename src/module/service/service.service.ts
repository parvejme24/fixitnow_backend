import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import {
    CreateServiceInput,
    ServiceQuery,
    UpdateServiceInput,
} from "./service.interface.js";

const serviceSelect = {
    id: true,
    categoryId: true,
    title: true,
    description: true,
    price: true,
    duration: true,
    ratingAvg: true,
    reviewCount: true,
    tag: true,
    isFeatured: true,
    isActive: true,
    sortOrder: true,
    createdAt: true,
    category: {
        select: {
            id: true,
            name: true,
            slug: true,
        },
    },
} satisfies Prisma.ServiceSelect;

const buildServiceWhere = (query: ServiceQuery): Prisma.ServiceWhereInput => {
    const search = query.q || query.search;
    const categoryId = query.cat || query.categoryId;

    return {
        isActive: true,
        ...(categoryId && { categoryId }),
        ...(query.featured !== undefined && { isFeatured: query.featured }),
        ...(query.tag && { tag: query.tag }),
        ...(query.minRating !== undefined && {
            ratingAvg: { gte: query.minRating },
        }),
        ...((query.minPrice !== undefined || query.maxPrice !== undefined) && {
            price: {
                ...(query.minPrice !== undefined && { gte: query.minPrice }),
                ...(query.maxPrice !== undefined && { lte: query.maxPrice }),
            },
        }),
        ...(search && {
            OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ],
        }),
    };
};

const buildOrderBy = (
    sort?: ServiceQuery["sort"]
): Prisma.ServiceOrderByWithRelationInput[] => {
    switch (sort) {
        case "rating":
            return [{ ratingAvg: "desc" }];
        case "price-asc":
            return [{ price: "asc" }];
        case "price-desc":
            return [{ price: "desc" }];
        case "pop":
            return [{ reviewCount: "desc" }, { ratingAvg: "desc" }];
        default:
            return [{ sortOrder: "asc" }, { createdAt: "desc" }];
    }
};

export const getAllServices = async (query: ServiceQuery) => {
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const where = buildServiceWhere(query);

    const [services, total] = await Promise.all([
        prisma.service.findMany({
            where,
            select: serviceSelect,
            skip,
            take: limit,
            orderBy: buildOrderBy(query.sort),
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

export const getFeaturedServices = async () => {
    return prisma.service.findMany({
        where: { isActive: true, isFeatured: true },
        select: serviceSelect,
        take: 4,
        orderBy: [{ sortOrder: "asc" }, { ratingAvg: "desc" }],
    });
};

export const getServiceById = async (id: string) => {
    const service = await prisma.service.findFirst({
        where: { id, isActive: true },
        select: serviceSelect,
    });

    if (!service) {
        throw new AppError("Service not found", 404);
    }

    return service;
};

export const createService = async (payload: CreateServiceInput) => {
    const category = await prisma.category.findUnique({
        where: { id: payload.categoryId },
    });

    if (!category) {
        throw new AppError("Category not found", 404);
    }

    return prisma.service.create({
        data: {
            ...payload,
            tag: payload.tag ?? undefined,
        },
        select: serviceSelect,
    });
};

export const updateService = async (id: string, payload: UpdateServiceInput) => {
    const service = await prisma.service.findUnique({ where: { id } });

    if (!service) {
        throw new AppError("Service not found", 404);
    }

    if (payload.categoryId) {
        const category = await prisma.category.findUnique({
            where: { id: payload.categoryId },
        });
        if (!category) {
            throw new AppError("Category not found", 404);
        }
    }

    return prisma.service.update({
        where: { id },
        data: {
            ...payload,
            tag: payload.tag === null ? null : payload.tag,
        },
        select: serviceSelect,
    });
};

export const softDeleteService = async (id: string) => {
    const service = await prisma.service.findUnique({ where: { id } });

    if (!service) {
        throw new AppError("Service not found", 404);
    }

    return prisma.service.update({
        where: { id },
        data: { isActive: false },
        select: serviceSelect,
    });
};
