import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import {
    initiatePaymentSchema,
    paymentHistoryQuerySchema,
    webhookPaymentSchema,
} from "./payment.interface.js";
import * as paymentService from "./payment.service.js";

const getClientIp = (req: Request) => {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.length > 0) {
        return forwarded.split(",")[0]?.trim();
    }
    return req.ip || req.socket.remoteAddress || "127.0.0.1";
};

const getOrderIdFromCallback = (req: Request) => {
    const fromQuery =
        (req.query.order_id as string | undefined) ||
        (req.query.orderId as string | undefined);
    const fromBody =
        (req.body?.order_id as string | undefined) ||
        (req.body?.orderId as string | undefined);

    return fromQuery || fromBody || "";
};

export const initiatePayment = catchAsync(async (req: Request, res: Response) => {
    const payload = initiatePaymentSchema.parse(req.body);
    const result = await paymentService.initiatePayment(
        req.user!.userId,
        payload,
        getClientIp(req)
    );

    res.status(201).json({
        success: true,
        data: result,
    });
});

export const getMyPaymentHistory = catchAsync(
    async (req: Request, res: Response) => {
        const query = paymentHistoryQuerySchema.parse(req.query);
        const result = await paymentService.getCustomerPaymentHistory(
            req.user!.userId,
            query
        );

        res.status(200).json({
            success: true,
            meta: result.meta,
            data: result.payments,
        });
    }
);

export const getMyPaymentSummary = catchAsync(
    async (req: Request, res: Response) => {
        const summary = await paymentService.getCustomerPaymentSummary(
            req.user!.userId
        );

        res.status(200).json({
            success: true,
            data: summary,
        });
    }
);

export const shurjoPayCallback = catchAsync(
    async (req: Request, res: Response) => {
        const orderId = getOrderIdFromCallback(req);
        const result = await paymentService.handleShurjoPayCallback(orderId);

        // Browser return from ShurjoPay → send user back to frontend
        if (req.method === "GET" || req.accepts(["html", "json"]) === "html") {
            res.redirect(result.redirectUrl);
            return;
        }

        res.status(200).json({
            success: result.status === "SUCCESS",
            data: {
                status: result.status,
                payment: result.payment,
                redirectUrl: result.redirectUrl,
            },
        });
    }
);

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
    const payment = await paymentService.refundPayment(
        req.params.id as string,
        { userId: req.user!.userId, role: req.user!.role }
    );

    res.status(200).json({
        success: true,
        data: payment,
    });
});
