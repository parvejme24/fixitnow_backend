import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { CreateCategoryInput, UpdateCategoryInput } from "./category.interface.js";

const categorySelect = {
    id: true,
    name: true,
    slug: true,
    sortOrder: true,
    jobsDone: true,
    createdAt: true,
};

export const getAllCategories = async () => {
    const categories = await prisma.category.findMany({
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

    return categories.map(({ _count, ...category }) => ({
        ...category,
        serviceCount: _count.services,
        technicianCount: _count.technicianCategories,
    }));
};

export const getCategoryById = async (id: string) => {
    const category = await prisma.category.findUnique({
        where: { id },
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

    const { _count, ...rest } = category;
    return {
        ...rest,
        serviceCount: _count.services,
        technicianCount: _count.technicianCategories,
    };
};

export const getAllAreas = async () => {
    return prisma.area.findMany({
        select: {
            id: true,
            name: true,
            _count: { select: { technicians: true } },
        },
        orderBy: { name: "asc" },
    });
};

export const createCategory = async (payload: CreateCategoryInput) => {
    const existingCategory = await prisma.category.findFirst({
        where: {
            OR: [{ id: payload.id }, { name: payload.name }, { slug: payload.slug }],
        },
    });

    if (existingCategory) {
        throw new AppError("Category with this id, name or slug already exists", 409);
    }

    return prisma.category.create({
        data: payload,
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
