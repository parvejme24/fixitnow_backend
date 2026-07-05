import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import {
    createServiceSchema,
    technicianBookingQuerySchema,
    technicianQuerySchema,
    updateAvailabilitySchema,
    updateBookingStatusSchema,
    updateProfileSchema,
    updateServiceSchema,
} from "./technician.interface.js";
import * as technicianService from "./technician.service.js";

export const getTechnicians = catchAsync(async (req: Request, res: Response) => {
    const query = technicianQuerySchema.parse(req.query);
    const result = await technicianService.getAllTechnicians(query);

    res.status(200).json({
        success: true,
        message: "Technicians fetched successfully",
        meta: result.meta,
        data: result.technicians,
    });
});

export const getTechnicianProfile = catchAsync(
    async (req: Request, res: Response) => {
        const technician = await technicianService.getTechnicianById(
            req.params.id as string
        );

        res.status(200).json({
            success: true,
            message: "Technician profile fetched successfully",
            data: technician,
        });
    }
);

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
    const payload = updateProfileSchema.parse(req.body);
    const profile = await technicianService.updateTechnicianProfile(
        req.user!.userId,
        payload
    );

    res.status(200).json({
        success: true,
        message: "Technician profile updated successfully",
        data: profile,
    });
});

export const updateAvailability = catchAsync(
    async (req: Request, res: Response) => {
        const payload = updateAvailabilitySchema.parse(req.body);
        const profile = await technicianService.updateTechnicianAvailability(
            req.user!.userId,
            payload
        );

        res.status(200).json({
            success: true,
            message: "Availability updated successfully",
            data: profile,
        });
    }
);

export const getBookings = catchAsync(async (req: Request, res: Response) => {
    const query = technicianBookingQuerySchema.parse(req.query);
    const result = await technicianService.getTechnicianBookings(
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

export const updateBookingStatus = catchAsync(
    async (req: Request, res: Response) => {
        const payload = updateBookingStatusSchema.parse(req.body);
        const booking = await technicianService.updateTechnicianBookingStatus(
            req.user!.userId,
            req.params.id as string,
            payload
        );

        res.status(200).json({
            success: true,
            message: "Booking status updated successfully",
            data: booking,
        });
    }
);

export const getServices = catchAsync(async (req: Request, res: Response) => {
    const services = await technicianService.getTechnicianServices(
        req.user!.userId
    );

    res.status(200).json({
        success: true,
        message: "Services fetched successfully",
        data: services,
    });
});

export const createService = catchAsync(async (req: Request, res: Response) => {
    const payload = createServiceSchema.parse(req.body);
    const service = await technicianService.createTechnicianService(
        req.user!.userId,
        payload
    );

    res.status(201).json({
        success: true,
        message: "Service created successfully",
        data: service,
    });
});

export const updateService = catchAsync(async (req: Request, res: Response) => {
    const payload = updateServiceSchema.parse(req.body);
    const service = await technicianService.updateTechnicianService(
        req.user!.userId,
        req.params.id as string,
        payload
    );

    res.status(200).json({
        success: true,
        message: "Service updated successfully",
        data: service,
    });
});

export const deleteService = catchAsync(async (req: Request, res: Response) => {
    const service = await technicianService.deleteTechnicianService(
        req.user!.userId,
        req.params.id as string
    );

    res.status(200).json({
        success: true,
        message: "Service deleted successfully",
        data: service,
    });
});
