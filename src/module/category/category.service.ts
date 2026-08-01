import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import {
    CreateCategoryInput,
    ToggleCategoryVisibilityInput,
    UpdateCategoryInput,
} from "./category.interface.js";

const categorySelect = {
    id: true,
    name: true,
    slug: true,
    icon: true,
    isVisible: true,
    sortOrder: true,
    jobsDone: true,
    createdAt: true,
    updatedAt: true,
};

const mapCategory = <
    T extends {
        _count: { services: number; technicianCategories: number };
    },
>(
    category: T
) => {
    const { _count, ...rest } = category;
    return {
        ...rest,
        serviceCount: _count.services,
        technicianCount: _count.technicianCategories,
    };
};

/** Public: only visible categories (customer cards / search) */
export const getAllCategories = async (options?: { includeHidden?: boolean }) => {
    const categories = await prisma.category.findMany({
        where: options?.includeHidden ? undefined : { isVisible: true },
        select: {
            ...categorySelect,
            _count: {
                select: {
                    services: { where: { isActive: true } },
                    technicianCategories: true,
                },
            },
        },
        orderBy: { sortOrder: "asc" },
    });

    return categories.map(mapCategory);
};

export const getCategoryById = async (
    id: string,
    options?: { includeHidden?: boolean }
) => {
    const category = await prisma.category.findFirst({
        where: {
            id,
            ...(options?.includeHidden ? {} : { isVisible: true }),
        },
        select: {
            ...categorySelect,
            _count: {
                select: {
                    services: { where: { isActive: true } },
                    technicianCategories: true,
                },
            },
        },
    });

    if (!category) {
        throw new AppError("Category not found", 404);
    }

    return mapCategory(category);
};

export const createCategory = async (payload: CreateCategoryInput) => {
    const existingCategory = await prisma.category.findFirst({
        where: {
            OR: [{ name: payload.name }, { slug: payload.slug }],
        },
    });

    if (existingCategory) {
        throw new AppError("Category with this name or slug already exists", 409);
    }

    return prisma.category.create({
        data: {
            name: payload.name,
            slug: payload.slug,
            icon: payload.icon,
            isVisible: payload.isVisible ?? true,
            sortOrder: payload.sortOrder,
        },
        select: categorySelect,
    });
};

export const updateCategory = async (id: string, payload: UpdateCategoryInput) => {
    const category = await prisma.category.findUnique({
        where: { id },
    });

    if (!category) {
        throw new AppError("Category not found", 404);
    }

    if (payload.name && payload.name !== category.name) {
        const existingCategory = await prisma.category.findUnique({
            where: { name: payload.name },
        });

        if (existingCategory) {
            throw new AppError("Category with this name already exists", 409);
        }
    }

    if (payload.slug && payload.slug !== category.slug) {
        const existingSlug = await prisma.category.findUnique({
            where: { slug: payload.slug },
        });

        if (existingSlug) {
            throw new AppError("Category with this slug already exists", 409);
        }
    }

    return prisma.category.update({
        where: { id },
        data: payload,
        select: categorySelect,
    });
};

/** Hide / unhide category on customer UI cards */
export const toggleCategoryVisibility = async (
    id: string,
    payload: ToggleCategoryVisibilityInput
) => {
    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
        throw new AppError("Category not found", 404);
    }

    return prisma.category.update({
        where: { id },
        data: { isVisible: payload.isVisible },
        select: categorySelect,
    });
};

/** Category dashboard cards: total, live in search, services, jobs all-time */
export const getCategoryStats = async () => {
    const [categories, liveInSearch, servicesListed, jobsAgg] =
        await Promise.all([
            prisma.category.count(),
            prisma.category.count({ where: { isVisible: true } }),
            prisma.service.count({ where: { isActive: true } }),
            prisma.category.aggregate({
                _sum: { jobsDone: true },
            }),
        ]);

    return {
        categories,
        liveInSearch,
        servicesListed,
        jobsAllTime: jobsAgg._sum.jobsDone || 0,
    };
};

export const deleteCategory = async (id: string) => {
    const category = await prisma.category.findUnique({
        where: { id },
        include: {
            _count: {
                select: { services: true },
            },
        },
    });

    if (!category) {
        throw new AppError("Category not found", 404);
    }

    if (category._count.services > 0) {
        throw new AppError(
            "Cannot delete category that has linked services",
            400
        );
    }

    await prisma.category.delete({
        where: { id },
    });

    return category;
};
