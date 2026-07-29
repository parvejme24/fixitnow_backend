import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import {
    bookingQuerySchema,
    createBookingSchema,
    updateBookingStatusSchema,
} from "./booking.interface.js";
import * as bookingService from "./booking.service.js";

export const createBooking = catchAsync(async (req: Request, res: Response) => {
    const payload = createBookingSchema.parse(req.body);
    const booking = await bookingService.createBooking(
        req.user!.userId,
        payload
    );

    res.status(201).json({
        success: true,
        data: booking,
    });
});

export const getBookings = catchAsync(async (req: Request, res: Response) => {
    const query = bookingQuerySchema.parse(req.query);
    const result = await bookingService.getMyBookings(
        req.user!.userId,
        req.user!.role,
        query
    );

    res.status(200).json({
        success: true,
        meta: result.meta,
        data: result.bookings,
    });
});

export const getBookingDetails = catchAsync(
    async (req: Request, res: Response) => {
        const booking = await bookingService.getBookingById(
            req.user!.userId,
            req.user!.role,
            req.params.id as string
        );

        res.status(200).json({
            success: true,
            data: booking,
        });
    }
);

export const acceptBooking = catchAsync(async (req: Request, res: Response) => {
    const booking = await bookingService.acceptBooking(
        req.user!.userId,
        req.params.id as string
    );

    res.status(200).json({
        success: true,
        data: booking,
    });
});

export const declineBooking = catchAsync(async (req: Request, res: Response) => {
    const booking = await bookingService.declineBooking(
        req.user!.userId,
        req.params.id as string
    );

    res.status(200).json({
        success: true,
        data: booking,
    });
});

export const cancelBooking = catchAsync(async (req: Request, res: Response) => {
    const booking = await bookingService.cancelBooking(
        req.user!.userId,
        req.params.id as string
    );

    res.status(200).json({
        success: true,
        data: booking,
    });
});

export const updateBookingStatus = catchAsync(
    async (req: Request, res: Response) => {
        const payload = updateBookingStatusSchema.parse(req.body);
        const booking = await bookingService.updateBookingStatus(
            req.user!.userId,
            req.user!.role,
            req.params.id as string,
            payload
        );

        res.status(200).json({
            success: true,
            data: booking,
        });
    }
);
