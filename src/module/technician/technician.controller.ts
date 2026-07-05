import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { technicianQuerySchema } from "./technician.interface.js";
import * as technicianService from "./technician.service.js";

export const getTechnicians = catchAsync(async (req: Request, res: Response) => {
    const query = technicianQuerySchema.parse(req.query);
    const result = await technicianService.getAllTechnicians(query);

    res.status(200).json({
        success: true,
        message: "Technicians fetched successfully",
        meta: result.meta,
        data: result.technicians,
    });
});

export const getTechnicianProfile = catchAsync(
    async (req: Request, res: Response) => {
        const technician = await technicianService.getTechnicianById(
            req.params.id as string
        );

        res.status(200).json({
            success: true,
            message: "Technician profile fetched successfully",
            data: technician,
        });
    }
);
