import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { CreateAreaInput, UpdateAreaInput } from "./area.interface.js";

const areaSelect = {
    id: true,
    name: true,
    _count: { select: { technicians: true } },
};

export const getAllAreas = async () => {
    return prisma.area.findMany({
        select: areaSelect,
        orderBy: { name: "asc" },
    });
};

export const getAreaById = async (id: string) => {
    const area = await prisma.area.findUnique({
        where: { id },
        select: areaSelect,
    });

    if (!area) {
        throw new AppError("Area not found", 404);
    }

    return area;
};

export const createArea = async (payload: CreateAreaInput) => {
    const existing = await prisma.area.findUnique({
        where: { name: payload.name },
    });

    if (existing) {
        throw new AppError("Area with this name already exists", 409);
    }

    return prisma.area.create({
        data: { name: payload.name },
        select: areaSelect,
    });
};

export const updateArea = async (id: string, payload: UpdateAreaInput) => {
    const area = await prisma.area.findUnique({ where: { id } });

    if (!area) {
        throw new AppError("Area not found", 404);
    }

    if (payload.name !== area.name) {
        const existing = await prisma.area.findUnique({
            where: { name: payload.name },
        });

        if (existing) {
            throw new AppError("Area with this name already exists", 409);
        }
    }

    return prisma.area.update({
        where: { id },
        data: { name: payload.name },
        select: areaSelect,
    });
};

export const deleteArea = async (id: string) => {
    const area = await prisma.area.findUnique({
        where: { id },
        include: {
            _count: { select: { technicians: true } },
        },
    });

    if (!area) {
        throw new AppError("Area not found", 404);
    }

    if (area._count.technicians > 0) {
        throw new AppError(
            "Cannot delete area that technicians still cover",
            400
        );
    }

    await prisma.area.delete({ where: { id } });

    return {
        id: area.id,
        name: area.name,
        _count: area._count,
    };
};
