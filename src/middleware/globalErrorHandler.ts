import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";

export const globalErrorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error("[API Error]", {
        name: err.name,
        message: err.message,
        stack: err.stack,
        path: req.originalUrl,
        method: req.method,
    });

    if (err instanceof ZodError) {
        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: err.issues.map((issue) => issue.message).join("; "),
            },
        });
    }

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
            },
        });
    }

    if (
        err.message?.includes("Unknown argument") ||
        err.message?.includes("column") ||
        err.name === "PrismaClientValidationError"
    ) {
        return res.status(500).json({
            success: false,
            error: {
                code: "DATABASE_SCHEMA_MISMATCH",
                message:
                    err.message ||
                    "Database schema is out of date. Run prisma db push on production DATABASE_URL.",
            },
        });
    }

    res.status(500).json({
        success: false,
        error: {
            code: "INTERNAL_ERROR",
            message: err.message || "Internal Server Error",
        },
    });
};
