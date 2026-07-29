import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import {
    createAvailabilitySlotSchema,
    slotsQuerySchema,
    technicianQuerySchema,
    updateAvailabilitySlotSchema,
    updateCategoriesSchema,
    updateProfileSchema,
    updateSkillsSchema,
    verifyTechnicianSchema,
} from "./technician.interface.js";
import * as technicianService from "./technician.service.js";

export const getTechnicians = catchAsync(async (req: Request, res: Response) => {
    const query = technicianQuerySchema.parse(req.query);
    const result = await technicianService.getAllTechnicians(query);

    res.status(200).json({
        success: true,
        meta: result.meta,
        data: result.technicians,
    });
});

export const getTopTechnicians = catchAsync(
    async (req: Request, res: Response) => {
        const technicians = await technicianService.getTopTechnicians();

        res.status(200).json({
            success: true,
            data: technicians,
        });
    }
);

export const getTechnicianProfile = catchAsync(
    async (req: Request, res: Response) => {
        const technician = await technicianService.getTechnicianById(
            req.params.id as string
        );

        res.status(200).json({
            success: true,
            data: technician,
        });
    }
);

export const getTechnicianSlots = catchAsync(
    async (req: Request, res: Response) => {
        const query = slotsQuerySchema.parse(req.query);
        const slots = await technicianService.getTechnicianSlots(
            req.params.id as string,
            query
        );

        res.status(200).json({
            success: true,
            data: slots,
        });
    }
);

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
    const payload = updateProfileSchema.parse(req.body);
    const profile = await technicianService.updateTechnicianProfile(
        req.user!.userId,
        payload
    );

    res.status(200).json({
        success: true,
        data: profile,
    });
});

export const updateSkills = catchAsync(async (req: Request, res: Response) => {
    const payload = updateSkillsSchema.parse(req.body);
    const profile = await technicianService.updateTechnicianSkills(
        req.user!.userId,
        payload
    );

    res.status(200).json({
        success: true,
        data: profile,
    });
});

export const updateCategories = catchAsync(async (req: Request, res: Response) => {
    const payload = updateCategoriesSchema.parse(req.body);
    const profile = await technicianService.updateTechnicianCategories(
        req.user!.userId,
        payload
    );

    res.status(200).json({
        success: true,
        data: profile,
    });
});

export const createAvailability = catchAsync(
    async (req: Request, res: Response) => {
        const payload = createAvailabilitySlotSchema.parse(req.body);
        const slot = await technicianService.createTechnicianAvailabilitySlot(
            req.user!.userId,
            payload
        );

        res.status(201).json({
            success: true,
            data: slot,
        });
    }
);

export const updateAvailability = catchAsync(
    async (req: Request, res: Response) => {
        const payload = updateAvailabilitySlotSchema.parse(req.body);
        const slot = await technicianService.updateTechnicianAvailabilitySlot(
            req.user!.userId,
            req.params.slotId as string,
            payload
        );

        res.status(200).json({
            success: true,
            data: slot,
        });
    }
);

export const deleteAvailability = catchAsync(
    async (req: Request, res: Response) => {
        const slot = await technicianService.deleteTechnicianAvailabilitySlot(
            req.user!.userId,
            req.params.slotId as string
        );

        res.status(200).json({
            success: true,
            data: slot,
        });
    }
);

export const verifyTechnician = catchAsync(
    async (req: Request, res: Response) => {
        const payload = verifyTechnicianSchema.parse(req.body);
        const technician = await technicianService.verifyTechnician(
            req.params.id as string,
            payload
        );

        res.status(200).json({
            success: true,
            data: technician,
        });
    }
);
