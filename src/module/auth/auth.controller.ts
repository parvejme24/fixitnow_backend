import { Request, Response } from "express";
import config from "../../config/index.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/AppError.js";
import {
    authUserQuerySchema,
    changePasswordSchema,
    forgotPasswordSchema,
    loginSchema,
    registerSchema,
    resetPasswordSchema,
    updateMeSchema,
    updateUserRoleSchema,
} from "./auth.interface.js";
import * as authService from "./auth.service.js";

const setAuthCookie = (res: Response, token: string) => {
    res.cookie("accessToken", token, {
        httpOnly: true,
        secure: config.node_env === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};

export const register = catchAsync(async (req: Request, res: Response) => {
    const payload = registerSchema.parse(req.body);
    const result = await authService.registerUser(payload);

    setAuthCookie(res, result.token);

    res.status(201).json({
        success: true,
        data: result,
    });
});

export const login = catchAsync(async (req: Request, res: Response) => {
    const payload = loginSchema.parse(req.body);
    const result = await authService.loginUser(payload);

    setAuthCookie(res, result.token);

    res.status(200).json({
        success: true,
        data: result,
    });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
    res.clearCookie("accessToken");

    res.status(200).json({
        success: true,
        data: { message: "Logged out successfully" },
    });
});

export const getMe = catchAsync(async (req: Request, res: Response) => {
    const user = await authService.getCurrentUser(req.user!.userId);

    res.status(200).json({
        success: true,
        data: user,
    });
});

export const updateMe = catchAsync(async (req: Request, res: Response) => {
    const body = req.body ?? {};
    const hasTextFields = Object.keys(body).some(
        (key) => body[key] !== undefined && body[key] !== ""
    );

    let payload: {
        name?: string;
        phone?: string;
        initials?: string;
    } = {};

    if (hasTextFields) {
        payload = updateMeSchema.parse(body);
    } else if (!req.file) {
        throw new AppError(
            "Provide profile fields and/or a profileImage file",
            400
        );
    }

    const user = await authService.updateMe(
        req.user!.userId,
        payload,
        req.file
    );

    res.status(200).json({
        success: true,
        data: user,
    });
});

export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
    const payload = forgotPasswordSchema.parse(req.body);
    const result = await authService.forgotPassword(payload);

    res.status(200).json({
        success: true,
        data: result,
    });
});

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
    const payload = resetPasswordSchema.parse(req.body);
    const result = await authService.resetPassword(payload);

    res.status(200).json({
        success: true,
        data: result,
    });
});

export const changePassword = catchAsync(async (req: Request, res: Response) => {
    const payload = changePasswordSchema.parse(req.body);
    const result = await authService.changePassword(req.user!.userId, payload);

    res.status(200).json({
        success: true,
        data: result,
    });
});

export const getUsers = catchAsync(async (req: Request, res: Response) => {
    const query = authUserQuerySchema.parse(req.query);
    const result = await authService.getAllUsers(query);

    res.status(200).json({
        success: true,
        meta: result.meta,
        data: result.users,
    });
});

export const updateUserRole = catchAsync(async (req: Request, res: Response) => {
    const payload = updateUserRoleSchema.parse(req.body);
    const user = await authService.updateUserRole(
        req.params.id as string,
        payload,
        req.user!.userId
    );

    res.status(200).json({
        success: true,
        data: user,
    });
});
