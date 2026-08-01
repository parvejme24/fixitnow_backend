import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/AppError.js";
import {
    createServiceSchema,
    serviceQuerySchema,
    updateServiceSchema,
} from "./service.interface.js";
import * as serviceService from "./service.service.js";

export const getServices = catchAsync(async (req: Request, res: Response) => {
    const query = serviceQuerySchema.parse(req.query);
    const result = await serviceService.getAllServices(query);

    res.status(200).json({
        success: true,
        meta: result.meta,
        data: result.services,
    });
});

export const getFeaturedServices = catchAsync(
    async (req: Request, res: Response) => {
        const services = await serviceService.getFeaturedServices();

        res.status(200).json({
            success: true,
            data: services,
        });
    }
);

export const getServiceDetails = catchAsync(
    async (req: Request, res: Response) => {
        const service = await serviceService.getServiceById(
            req.params.id as string
        );

        res.status(200).json({
            success: true,
            data: service,
        });
    }
);

export const createService = catchAsync(async (req: Request, res: Response) => {
    const payload = createServiceSchema.parse(req.body ?? {});
    const service = await serviceService.createService(payload, req.file);

    res.status(201).json({
        success: true,
        data: service,
    });
});

export const updateService = catchAsync(async (req: Request, res: Response) => {
    const body = req.body ?? {};
    const hasTextFields = Object.keys(body).some(
        (key) => body[key] !== undefined && body[key] !== ""
    );

    let payload: ReturnType<typeof updateServiceSchema.parse> = {};

    if (hasTextFields) {
        payload = updateServiceSchema.parse(body);
    } else if (!req.file) {
        throw new AppError("Provide service fields and/or an image file", 400);
    }

    const service = await serviceService.updateService(
        req.params.id as string,
        payload,
        req.file
    );

    res.status(200).json({
        success: true,
        data: service,
    });
});

export const deleteService = catchAsync(async (req: Request, res: Response) => {
    const service = await serviceService.softDeleteService(
        req.params.id as string
    );

    res.status(200).json({
        success: true,
        data: service,
    });
});
