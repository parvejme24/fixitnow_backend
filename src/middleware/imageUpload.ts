import { NextFunction, Request, Response } from "express";
import multer, { MulterError } from "multer";
import { AppError } from "../utils/AppError.js";

const storage = multer.memoryStorage();

const allowedMimeTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
]);

function createImageUploader(fieldName: string) {
    return multer({
        storage,
        limits: {
            fileSize: 4 * 1024 * 1024,
        },
        fileFilter: (_req, file, cb) => {
            if (!allowedMimeTypes.has(file.mimetype)) {
                cb(
                    new AppError(
                        "Only JPEG, PNG, WEBP, or GIF images are allowed",
                        400,
                        "INVALID_IMAGE_TYPE"
                    )
                );
                return;
            }
            cb(null, true);
        },
    }).single(fieldName);
}

function asUploadMiddleware(
    uploader: (
        req: Request,
        res: Response,
        cb: (error: unknown) => void
    ) => void
) {
    return (req: Request, res: Response, next: NextFunction) => {
        uploader(req, res, (err: unknown) => {
            if (!err) {
                next();
                return;
            }

            if (err instanceof AppError) {
                next(err);
                return;
            }

            if (err instanceof MulterError) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    next(
                        new AppError(
                            "Image must be 4MB or smaller",
                            400,
                            "FILE_TOO_LARGE"
                        )
                    );
                    return;
                }

                next(new AppError(err.message, 400, "UPLOAD_ERROR"));
                return;
            }

            next(
                new AppError(
                    err instanceof Error ? err.message : "File upload failed",
                    400,
                    "UPLOAD_ERROR"
                )
            );
        });
    };
}

export const uploadProfileImageMiddleware = asUploadMiddleware(
    createImageUploader("profileImage")
);

export const uploadServiceImageMiddleware = asUploadMiddleware(
    createImageUploader("image")
);
