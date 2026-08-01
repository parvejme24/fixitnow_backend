import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { createAreaSchema, updateAreaSchema } from "./area.interface.js";
import * as areaService from "./area.service.js";

export const getAreas = catchAsync(async (_req: Request, res: Response) => {
    const areas = await areaService.getAllAreas();

    res.status(200).json({
        success: true,
        data: areas,
    });
});

export const getArea = catchAsync(async (req: Request, res: Response) => {
    const area = await areaService.getAreaById(req.params.id as string);

    res.status(200).json({
        success: true,
        data: area,
    });
});

export const createArea = catchAsync(async (req: Request, res: Response) => {
    const payload = createAreaSchema.parse(req.body);
    const area = await areaService.createArea(payload);

    res.status(201).json({
        success: true,
        data: area,
    });
});

export const updateArea = catchAsync(async (req: Request, res: Response) => {
    const payload = updateAreaSchema.parse(req.body);
    const area = await areaService.updateArea(
        req.params.id as string,
        payload
    );

    res.status(200).json({
        success: true,
        data: area,
    });
});

export const deleteArea = catchAsync(async (req: Request, res: Response) => {
    const area = await areaService.deleteArea(req.params.id as string);

    res.status(200).json({
        success: true,
        data: area,
    });
});
