import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.js";

export const requireTechnician = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.user) {
        return next(new AppError("Unauthorized", 401));
    }

    if (req.user.role !== "TECHNICIAN") {
        return next(new AppError("Technician access required", 403));
    }

    next();
};
