import { v2 as cloudinary } from "cloudinary";
import config from "../config/index.js";
import { AppError } from "../utils/AppError.js";

const resolveCloudinaryConfig = () => {
    let cloudName = config.cloudinary.cloudName;
    let apiKey = config.cloudinary.apiKey;
    let apiSecret = config.cloudinary.apiSecret;

    const url = process.env.CLOUDINARY_URL;
    if ((!cloudName || !apiKey || !apiSecret) && url?.startsWith("cloudinary://")) {
        try {
            const parsed = new URL(url);
            apiKey = apiKey || decodeURIComponent(parsed.username);
            apiSecret = apiSecret || decodeURIComponent(parsed.password);
            cloudName = cloudName || parsed.hostname;
        } catch {
            // ignore parse errors
        }
    }

    return { cloudName, apiKey, apiSecret };
};

type UploadOptions = {
    folder?: string;
    width?: number;
    height?: number;
};

export const uploadImage = async (
    fileBuffer: Buffer,
    options: UploadOptions = {}
): Promise<{ url: string; publicId: string }> => {
    const { cloudName, apiKey, apiSecret } = resolveCloudinaryConfig();
    const folder = options.folder || "fixitnow";
    const width = options.width ?? 512;
    const height = options.height ?? 512;

    if (!cloudName || !apiKey || !apiSecret) {
        throw new AppError(
            "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET (or CLOUDINARY_URL) in environment variables.",
            500,
            "CLOUDINARY_NOT_CONFIGURED"
        );
    }

    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
    });

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image",
                transformation: [
                    { width, height, crop: "fill", gravity: "auto" },
                    { quality: "auto", fetch_format: "auto" },
                ],
            },
            (error, result) => {
                if (error || !result?.secure_url) {
                    reject(
                        new AppError(
                            error?.message || "Failed to upload image to Cloudinary",
                            500,
                            "CLOUDINARY_UPLOAD_FAILED"
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

export const uploadProfileImage = async (fileBuffer: Buffer) => {
    return uploadImage(fileBuffer, {
        folder: "fixitnow/profiles",
        width: 512,
        height: 512,
    });
};

export const uploadServiceImage = async (fileBuffer: Buffer) => {
    return uploadImage(fileBuffer, {
        folder: "fixitnow/services",
        width: 1200,
        height: 800,
    });
};
