import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.js";

export const requireCustomer = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.user) {
        return next(new AppError("Unauthorized", 401));
    }

    if (req.user.role !== "CUSTOMER") {
        return next(new AppError("Customer access required", 403));
    }

    next();
};
