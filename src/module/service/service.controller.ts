import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { serviceQuerySchema } from "./service.interface.js";
import * as serviceService from "./service.service.js";

export const getServices = catchAsync(async (req: Request, res: Response) => {
    const query = serviceQuerySchema.parse(req.query);
    const result = await serviceService.getAllServices(query);

    res.status(200).json({
        success: true,
        message: "Services fetched successfully",
        meta: result.meta,
        data: result.services,
    });
});
