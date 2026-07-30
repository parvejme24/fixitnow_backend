import { v2 as cloudinary } from "cloudinary";
import config from "../config/index.js";
import { AppError } from "../utils/AppError.js";

cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
});

export const uploadProfileImage = async (
    fileBuffer: Buffer,
    folder = "fixitnow/profiles"
): Promise<{ url: string; publicId: string }> => {
    if (
        !config.cloudinary.cloudName ||
        !config.cloudinary.apiKey ||
        !config.cloudinary.apiSecret
    ) {
        throw new AppError("Cloudinary is not configured", 500);
    }

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image",
                transformation: [
                    { width: 512, height: 512, crop: "fill", gravity: "face" },
                    { quality: "auto", fetch_format: "auto" },
                ],
            },
            (error, result) => {
                if (error || !result) {
                    reject(
                        new AppError(
                            error?.message || "Failed to upload image",
                            500
                        )
                    );
                    return;
                }

                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                });
            }
        );

        stream.end(fileBuffer);
    });
};
