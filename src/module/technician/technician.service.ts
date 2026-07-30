import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import {
    CreateAvailabilitySlotInput,
    SlotsQuery,
    TechnicianQuery,
    UpdateAvailabilitySlotInput,
    UpdateCategoriesInput,
    UpdateProfileInput,
    UpdateSkillsInput,
    VerifyTechnicianInput,
} from "./technician.interface.js";

const technicianListSelect = {
    id: true,
    trade: true,
    bio: true,
    initials: true,
    visitFee: true,
    experienceYrs: true,
    jobsCompleted: true,
    ratingAvg: true,
    reviewCount: true,
    online: true,
    verified: true,
    coverKm: true,
    replyMins: true,
    area: {
        select: { id: true, name: true },
    },
    user: {
        select: {
            id: true,
            name: true,
            phone: true,
        },
    },
    categories: {
        select: {
            category: {
                select: { id: true, name: true, slug: true },
            },
        },
    },
    skills: {
        select: { id: true, name: true },
    },
} satisfies Prisma.TechnicianProfileSelect;

const profileSelect = {
    ...technicianListSelect,
    createdAt: true,
    updatedAt: true,
    user: {
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
        },
    },
} satisfies Prisma.TechnicianProfileSelect;

const getInitials = (name: string) => {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
};

export const getTechnicianProfileByUserId = async (userId: string) => {
    const existingProfile = await prisma.technicianProfile.findUnique({
        where: { userId },
    });

    if (existingProfile) {
        return existingProfile;
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, role: true, isActive: true },
    });

    if (!user || user.role !== "TECHNICIAN") {
        throw new AppError("Technician profile not found", 404);
    }

    if (!user.isActive) {
        throw new AppError("Your account has been banned", 403);
    }

    return prisma.technicianProfile.create({
        data: {
            userId,
            trade: "General",
            initials: getInitials(user.name),
            visitFee: 0,
        },
    });
};

const buildOrderBy = (
    sort?: TechnicianQuery["sort"]
): Prisma.TechnicianProfileOrderByWithRelationInput[] => {
    switch (sort) {
        case "rating":
            return [{ ratingAvg: "desc" }];
        case "price-asc":
            return [{ visitFee: "asc" }];
        case "price-desc":
            return [{ visitFee: "desc" }];
        case "pop":
            return [{ jobsCompleted: "desc" }, { ratingAvg: "desc" }];
        default:
            return [{ ratingAvg: "desc" }];
    }
};

export const getAllTechnicians = async (query: TechnicianQuery) => {
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const search = query.q || query.search;
    const categoryId = query.cat || query.categoryId;
    const areaFilter = query.area || query.areaId;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const where: Prisma.TechnicianProfileWhereInput = {
        user: { isActive: true },
        AND: [
            ...(areaFilter
                ? [
                      {
                          OR: [
                              { areaId: areaFilter },
                              {
                                  area: {
                                      name: {
                                          equals: areaFilter,
                                          mode: "insensitive" as const,
                                      },
                                  },
                              },
                          ],
                      },
                  ]
                : []),
            ...(search
                ? [
                      {
                          OR: [
                              {
                                  user: {
                                      name: {
                                          contains: search,
                                          mode: "insensitive" as const,
                                      },
                                  },
                              },
                              {
                                  trade: {
                                      contains: search,
                                      mode: "insensitive" as const,
                                  },
                              },
                              {
                                  bio: {
                                      contains: search,
                                      mode: "insensitive" as const,
                                  },
                              },
                          ],
                      },
                  ]
                : []),
        ],
        ...(query.minRating !== undefined && { ratingAvg: { gte: query.minRating } }),
        ...(query.maxRate !== undefined && { visitFee: { lte: query.maxRate } }),
        ...(query.online !== undefined && { online: query.online }),
        ...(categoryId && {
            categories: { some: { categoryId } },
        }),
        ...(query.today && {
            slots: {
                some: {
                    isBooked: false,
                    date: { gte: todayStart, lt: todayEnd },
                },
            },
        }),
    };

    const [technicians, total] = await Promise.all([
        prisma.technicianProfile.findMany({
            where,
            select: technicianListSelect,
            skip,
            take: limit,
            orderBy: buildOrderBy(query.sort),
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

export const getTopTechnicians = async () => {
    return prisma.technicianProfile.findMany({
        where: { user: { isActive: true }, verified: true },
        select: technicianListSelect,
        take: 3,
        orderBy: [{ ratingAvg: "desc" }, { jobsCompleted: "desc" }],
    });
};

export const getTechnicianById = async (id: string) => {
    const technician = await prisma.technicianProfile.findFirst({
        where: {
            id,
            user: { isActive: true },
        },
        select: {
            ...profileSelect,
            categories: {
                select: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            services: {
                                where: { isActive: true },
                                select: {
                                    id: true,
                                    title: true,
                                    price: true,
                                    duration: true,
                                    ratingAvg: true,
                                    tag: true,
                                },
                                take: 8,
                            },
                        },
                    },
                },
            },
        },
    });

    if (!technician) {
        throw new AppError("Technician not found", 404);
    }

    const offeredServices = technician.categories.flatMap((item) =>
        item.category.services.map((service) => ({
            ...service,
            category: {
                id: item.category.id,
                name: item.category.name,
                slug: item.category.slug,
            },
        }))
    );

    return {
        ...technician,
        categories: technician.categories.map((item) => ({
            id: item.category.id,
            name: item.category.name,
            slug: item.category.slug,
        })),
        offeredServices,
    };
};

export const getTechnicianSlots = async (id: string, query: SlotsQuery) => {
    const technician = await prisma.technicianProfile.findFirst({
        where: { id, user: { isActive: true } },
        select: { id: true },
    });

    if (!technician) {
        throw new AppError("Technician not found", 404);
    }

    const from = query.from ? new Date(query.from) : new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + query.days);

    return prisma.availabilitySlot.findMany({
        where: {
            technicianId: id,
            date: { gte: from, lt: to },
        },
        select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true,
            isBooked: true,
        },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });
};

export const updateTechnicianProfile = async (
    userId: string,
    payload: UpdateProfileInput
) => {
    const profile = await getTechnicianProfileByUserId(userId);

    return prisma.technicianProfile.update({
        where: { id: profile.id },
        data: payload,
        select: profileSelect,
    });
};

export const updateTechnicianSkills = async (
    userId: string,
    payload: UpdateSkillsInput
) => {
    const profile = await getTechnicianProfileByUserId(userId);
    const uniqueSkills = [
        ...new Set(payload.skills.map((skill) => skill.trim()).filter(Boolean)),
    ];

    return prisma.$transaction(async (tx) => {
        await tx.technicianSkill.deleteMany({
            where: { technicianId: profile.id },
        });

        if (uniqueSkills.length > 0) {
            await tx.technicianSkill.createMany({
                data: uniqueSkills.map((name) => ({
                    technicianId: profile.id,
                    name,
                })),
            });
        }

        return tx.technicianProfile.findUniqueOrThrow({
            where: { id: profile.id },
            select: profileSelect,
        });
    });
};

export const updateTechnicianCategories = async (
    userId: string,
    payload: UpdateCategoriesInput
) => {
    const profile = await getTechnicianProfileByUserId(userId);
    const uniqueCategoryIds = [...new Set(payload.categoryIds)];

    if (uniqueCategoryIds.length > 0) {
        const count = await prisma.category.count({
            where: { id: { in: uniqueCategoryIds } },
        });

        if (count !== uniqueCategoryIds.length) {
            throw new AppError("One or more categories were not found", 404);
        }
    }

    return prisma.$transaction(async (tx) => {
        await tx.technicianCategory.deleteMany({
            where: { technicianId: profile.id },
        });

        if (uniqueCategoryIds.length > 0) {
            await tx.technicianCategory.createMany({
                data: uniqueCategoryIds.map((categoryId) => ({
                    technicianId: profile.id,
                    categoryId,
                })),
            });
        }

        return tx.technicianProfile.findUniqueOrThrow({
            where: { id: profile.id },
            select: profileSelect,
        });
    });
};

export const createTechnicianAvailabilitySlot = async (
    userId: string,
    payload: CreateAvailabilitySlotInput
) => {
    const profile = await getTechnicianProfileByUserId(userId);

    const existing = await prisma.availabilitySlot.findUnique({
        where: {
            technicianId_date_startTime: {
                technicianId: profile.id,
                date: payload.date,
                startTime: payload.startTime,
            },
        },
    });

    if (existing) {
        throw new AppError("A slot already exists for this date and time", 409);
    }

    return prisma.availabilitySlot.create({
        data: {
            technicianId: profile.id,
            date: payload.date,
            startTime: payload.startTime,
            endTime: payload.endTime,
        },
    });
};

export const updateTechnicianAvailabilitySlot = async (
    userId: string,
    slotId: string,
    payload: UpdateAvailabilitySlotInput
) => {
    const profile = await getTechnicianProfileByUserId(userId);

    const slot = await prisma.availabilitySlot.findFirst({
        where: { id: slotId, technicianId: profile.id },
    });

    if (!slot) {
        throw new AppError("Availability slot not found", 404);
    }

    if (slot.isBooked && (payload.date || payload.startTime)) {
        throw new AppError("Cannot reschedule a booked slot", 400);
    }

    return prisma.availabilitySlot.update({
        where: { id: slotId },
        data: {
            ...(payload.date !== undefined && { date: payload.date }),
            ...(payload.startTime !== undefined && { startTime: payload.startTime }),
            ...(payload.endTime !== undefined && { endTime: payload.endTime }),
            ...(payload.isBooked !== undefined && { isBooked: payload.isBooked }),
        },
    });
};

export const deleteTechnicianAvailabilitySlot = async (
    userId: string,
    slotId: string
) => {
    const profile = await getTechnicianProfileByUserId(userId);

    const slot = await prisma.availabilitySlot.findFirst({
        where: { id: slotId, technicianId: profile.id },
    });

    if (!slot) {
        throw new AppError("Availability slot not found", 404);
    }

    if (slot.isBooked) {
        throw new AppError("Cannot delete a slot that is already booked", 400);
    }

    await prisma.availabilitySlot.delete({ where: { id: slotId } });

    return slot;
};

export const verifyTechnician = async (
    technicianId: string,
    payload: VerifyTechnicianInput
) => {
    const technician = await prisma.technicianProfile.findUnique({
        where: { id: technicianId },
    });

    if (!technician) {
        throw new AppError("Technician not found", 404);
    }

    return prisma.technicianProfile.update({
        where: { id: technicianId },
        data: { verified: payload.verified },
        select: profileSelect,
    });
};
