import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.js";

export const requireAdmin = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.user) {
        return next(new AppError("Unauthorized", 401));
    }

    if (req.user.role !== "ADMIN") {
        return next(new AppError("Admin access required", 403));
    }

    next();
};
