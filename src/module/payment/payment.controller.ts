import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import {
    initiatePaymentSchema,
    webhookPaymentSchema,
} from "./payment.interface.js";
import * as paymentService from "./payment.service.js";

export const initiatePayment = catchAsync(async (req: Request, res: Response) => {
    const payload = initiatePaymentSchema.parse(req.body);
    const result = await paymentService.initiatePayment(
        req.user!.userId,
        payload
    );

    res.status(201).json({
        success: true,
        data: result,
    });
});

export const paymentWebhook = catchAsync(async (req: Request, res: Response) => {
    const payload = webhookPaymentSchema.parse(req.body);
    const payment = await paymentService.handlePaymentWebhook(payload);

    res.status(200).json({
        success: true,
        data: payment,
    });
});

export const getPaymentDetails = catchAsync(
    async (req: Request, res: Response) => {
        const payment = await paymentService.getPaymentById(
            req.user!.userId,
            req.user!.role,
            req.params.id as string
        );

        res.status(200).json({
            success: true,
            data: payment,
        });
    }
);

export const refundPayment = catchAsync(async (req: Request, res: Response) => {
    const payment = await paymentService.refundPayment(req.params.id as string);

    res.status(200).json({
        success: true,
        data: payment,
    });
});
