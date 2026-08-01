import { Prisma } from "../../../generated/prisma/client.js";
import { uploadServiceImage } from "../../lib/cloudinary.js";
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
    image: true,
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
            icon: true,
        },
    },
} satisfies Prisma.ServiceSelect;

const buildServiceWhere = (query: ServiceQuery): Prisma.ServiceWhereInput => {
    const search = query.q || query.search;
    const categoryId = query.cat || query.categoryId;
    const areaFilter = query.area || query.areaId;

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
        // Services offered by at least one technician covering this area
        ...(areaFilter && {
            category: {
                technicianCategories: {
                    some: {
                        technician: {
                            user: { isActive: true },
                            areas: {
                                some: {
                                    OR: [
                                        { areaId: areaFilter },
                                        {
                                            area: {
                                                name: {
                                                    equals: areaFilter,
                                                    mode: "insensitive",
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
            },
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

export const createService = async (
    payload: CreateServiceInput,
    file?: Express.Multer.File
) => {
    const category = await prisma.category.findUnique({
        where: { id: payload.categoryId },
    });

    if (!category) {
        throw new AppError("Category not found", 404);
    }

    let image: string | undefined;
    if (file) {
        const uploaded = await uploadServiceImage(file.buffer);
        image = uploaded.url;
    }

    return prisma.service.create({
        data: {
            categoryId: payload.categoryId,
            title: payload.title,
            description: payload.description,
            price: payload.price,
            duration: payload.duration,
            tag: payload.tag ?? undefined,
            isFeatured: payload.isFeatured,
            sortOrder: payload.sortOrder,
            image,
        },
        select: serviceSelect,
    });
};

export const updateService = async (
    id: string,
    payload: UpdateServiceInput,
    file?: Express.Multer.File
) => {
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

    const data: Prisma.ServiceUpdateInput = {
        ...(payload.categoryId !== undefined && {
            category: { connect: { id: payload.categoryId } },
        }),
        ...(payload.title !== undefined && { title: payload.title }),
        ...(payload.description !== undefined && {
            description: payload.description,
        }),
        ...(payload.price !== undefined && { price: payload.price }),
        ...(payload.duration !== undefined && { duration: payload.duration }),
        ...(payload.tag !== undefined && { tag: payload.tag }),
        ...(payload.isFeatured !== undefined && { isFeatured: payload.isFeatured }),
        ...(payload.isActive !== undefined && { isActive: payload.isActive }),
        ...(payload.sortOrder !== undefined && { sortOrder: payload.sortOrder }),
    };

    if (file) {
        const uploaded = await uploadServiceImage(file.buffer);
        data.image = uploaded.url;
    }

    if (Object.keys(data).length === 0) {
        throw new AppError("Provide service fields and/or an image file", 400);
    }

    return prisma.service.update({
        where: { id },
        data,
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
