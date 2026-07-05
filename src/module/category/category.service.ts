import { prisma } from "../../lib/prisma.js";

export const getAllCategories = async () => {
    return prisma.category.findMany({
        select: {
            id: true,
            name: true,
            description: true,
            icon: true,
            createdAt: true,
            _count: {
                select: {
                    services: {
                        where: { isActive: true },
                    },
                },
            },
        },
        orderBy: { name: "asc" },
    });
};
