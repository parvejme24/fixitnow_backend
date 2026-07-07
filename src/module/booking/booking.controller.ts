import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { bookingQuerySchema, cancelBookingSchema, createBookingSchema } from "./booking.interface.js";
import * as bookingService from "./booking.service.js";

export const createBooking = catchAsync(async (req: Request, res: Response) => {
    const payload = createBookingSchema.parse(req.body);
    const booking = await bookingService.createBooking(
        req.user!.userId,
        payload
    );

    res.status(201).json({
        success: true,
        message: "Booking created successfully",
        data: booking,
    });
});

export const getBookings = catchAsync(async (req: Request, res: Response) => {
    const query = bookingQuerySchema.parse(req.query);
    const result = await bookingService.getCustomerBookings(
        req.user!.userId,
        query
    );

    res.status(200).json({
        success: true,
        message: "Bookings fetched successfully",
        meta: result.meta,
        data: result.bookings,
    });
});

export const getBookingDetails = catchAsync(
    async (req: Request, res: Response) => {
        const booking = await bookingService.getBookingById(
            req.user!.userId,
            req.params.id as string
        );

        res.status(200).json({
            success: true,
            message: "Booking details fetched successfully",
            data: booking,
        });
    }
);

export const cancelBooking = catchAsync(async (req: Request, res: Response) => {
    const payload = cancelBookingSchema.parse(req.body);
    const booking = await bookingService.cancelBooking(
        req.user!.userId,
        req.params.id as string,
        payload
    );

    res.status(200).json({
        success: true,
        message: "Booking cancelled successfully",
        data: booking,
    });
});
