import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import config from "../config/index.js";
import { JwtPayload } from "../module/auth/auth.interface.js";
import { AppError } from "../utils/AppError.js";

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;
        const token =
            (authHeader?.startsWith("Bearer ")
                ? authHeader.split(" ")[1]
                : undefined) || req.cookies?.accessToken;

        if (!token) {
            throw new AppError("Access token is required", 401);
        }

        const decoded = jwt.verify(token, config.jwt_secret) as JwtPayload;

        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
        };

        next();
    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }

        next(new AppError("Invalid or expired token", 401));
    }
};
