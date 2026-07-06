import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import {
    adminBookingQuerySchema,
    adminUserQuerySchema,
    updateUserStatusSchema,
} from "./admin.interface.js";
import * as adminService from "./admin.service.js";

export const getUsers = catchAsync(async (req: Request, res: Response) => {
    const query = adminUserQuerySchema.parse(req.query);
    const result = await adminService.getAllUsers(query);

    res.status(200).json({
        success: true,
        message: "Users fetched successfully",
        meta: result.meta,
        data: result.users,
    });
});

export const updateUserStatus = catchAsync(
    async (req: Request, res: Response) => {
        const payload = updateUserStatusSchema.parse(req.body);
        const user = await adminService.updateUserStatus(
            req.params.id as string,
            payload
        );

        res.status(200).json({
            success: true,
            message: "User status updated successfully",
            data: user,
        });
    }
);

export const getBookings = catchAsync(async (req: Request, res: Response) => {
    const query = adminBookingQuerySchema.parse(req.query);
    const result = await adminService.getAllBookings(query);

    res.status(200).json({
        success: true,
        message: "Bookings fetched successfully",
        meta: result.meta,
        data: result.bookings,
    });
});

export const getCategories = catchAsync(async (req: Request, res: Response) => {
    const categories = await adminService.getAdminCategories();

    res.status(200).json({
        success: true,
        message: "Categories fetched successfully",
        data: categories,
    });
});
