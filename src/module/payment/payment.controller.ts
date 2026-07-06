import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/AppError.js";
import {
    confirmPaymentSchema,
    createPaymentSchema,
    paymentQuerySchema,
} from "./payment.interface.js";
import * as paymentService from "./payment.service.js";

export const createPayment = catchAsync(async (req: Request, res: Response) => {
    const payload = createPaymentSchema.parse(req.body);
    const result = await paymentService.createPayment(req.user!.userId, payload);

    res.status(201).json({
        success: true,
        message: "Payment session created successfully",
        data: result,
    });
});

export const confirmPayment = catchAsync(async (req: Request, res: Response) => {
    const payload = confirmPaymentSchema.parse(req.body);
    const payment = await paymentService.confirmPayment(
        req.user!.userId,
        payload
    );

    res.status(200).json({
        success: true,
        message: "Payment confirmed successfully",
        data: payment,
    });
});

export const getPayments = catchAsync(async (req: Request, res: Response) => {
    const query = paymentQuerySchema.parse(req.query);
    const result = await paymentService.getCustomerPayments(
        req.user!.userId,
        query
    );

    res.status(200).json({
        success: true,
        message: "Payments fetched successfully",
        meta: result.meta,
        data: result.payments,
    });
});

export const getPaymentDetails = catchAsync(
    async (req: Request, res: Response) => {
        const payment = await paymentService.getPaymentById(
            req.user!.userId,
            req.params.id as string
        );

        res.status(200).json({
            success: true,
            message: "Payment details fetched successfully",
            data: payment,
        });
    }
);

export const shurjoPayCallback = catchAsync(
    async (req: Request, res: Response) => {
        const orderId =
            (req.query.order_id as string) ||
            (req.body?.order_id as string) ||
            (req.query.orderId as string);

        if (!orderId) {
            throw new AppError("order_id is required", 400);
        }

        const payment = await paymentService.handleShurjoPayCallback(orderId);

        res.status(200).json({
            success: true,
            message: "ShurjoPay payment verified successfully",
            data: payment,
        });
    }
);
