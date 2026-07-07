import { Request, Response } from "express";
import config from "../../config/index.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { loginSchema, registerSchema, updateProfileSchema } from "./auth.interface.js";
import * as authService from "./auth.service.js";

export const register = catchAsync(async (req: Request, res: Response) => {
    const payload = registerSchema.parse(req.body);
    const result = await authService.registerUser(payload);

    res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: result,
    });
});

export const login = catchAsync(async (req: Request, res: Response) => {
    const payload = loginSchema.parse(req.body);
    const result = await authService.loginUser(payload);

    res.cookie("accessToken", result.token, {
        httpOnly: true,
        secure: config.node_env === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
        success: true,
        message: "Logged in successfully",
        data: result,
    });
});

export const getMe = catchAsync(async (req: Request, res: Response) => {
    const user = await authService.getCurrentUser(req.user!.userId);

    res.status(200).json({
        success: true,
        message: "User profile fetched successfully",
        data: user,
    });
});

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
    const payload = updateProfileSchema.parse(req.body);
    const user = await authService.updateUserProfile(req.user!.userId, payload);

    res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: user,
    });
});
