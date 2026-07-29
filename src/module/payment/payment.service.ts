import { prisma } from "../../lib/prisma.js";
import config from "../../config/index.js";
import { AppError } from "../../utils/AppError.js";
import {
    InitiatePaymentInput,
    WebhookPaymentInput,
} from "./payment.interface.js";

const paymentSelect = {
    id: true,
    bookingId: true,
    userId: true,
    amount: true,
    method: true,
    status: true,
    providerTxnId: true,
    paidAt: true,
    failedAt: true,
    createdAt: true,
    updatedAt: true,
    booking: {
        select: {
            id: true,
            refCode: true,
            status: true,
            scheduledAt: true,
            service: {
                select: {
                    id: true,
                    title: true,
                    price: true,
                },
            },
            technician: {
                select: {
                    id: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
        },
    },
};

const generateProviderTxnId = () => {
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `TXN-${Date.now()}-${random}`;
};

export const initiatePayment = async (
    customerId: string,
    payload: InitiatePaymentInput
) => {
    const booking = await prisma.booking.findFirst({
        where: {
            OR: [{ id: payload.bookingId }, { refCode: payload.bookingId }],
            customerId,
        },
        include: { payment: true },
    });

    if (!booking) {
        throw new AppError("Booking not found", 404);
    }

    if (booking.status !== "ACCEPTED") {
        throw new AppError(
            `Payment can only be initiated for ACCEPTED bookings. Current: ${booking.status}`,
            400
        );
    }

    if (booking.payment?.status === "SUCCESS") {
        throw new AppError("Booking is already paid", 400);
    }

    const payment = await prisma.payment.upsert({
        where: { bookingId: booking.id },
        update: {
            amount: booking.totalAmount,
            method: payload.method,
            status: "PENDING",
            paidAt: null,
            failedAt: null,
        },
        create: {
            bookingId: booking.id,
            userId: customerId,
            amount: booking.totalAmount,
            method: payload.method,
            status: "PENDING",
        },
        select: paymentSelect,
    });

    return {
        payment,
        redirect: {
            successUrl: `${config.app_url}/payment/success?paymentId=${payment.id}`,
            cancelUrl: `${config.app_url}/payment/cancel?paymentId=${payment.id}`,
        },
    };
};

export const handlePaymentWebhook = async (payload: WebhookPaymentInput) => {
    const payment = await prisma.payment.findUnique({
        where: { id: payload.paymentId },
    });

    if (!payment) {
        throw new AppError("Payment not found", 404);
    }

    if (payment.status === "SUCCESS" && payload.status === "SUCCESS") {
        return prisma.payment.findUniqueOrThrow({
            where: { id: payment.id },
            select: paymentSelect,
        });
    }

    if (payload.status === "SUCCESS") {
        return prisma.$transaction(async (tx) => {
            const updatedPayment = await tx.payment.update({
                where: { id: payment.id },
                data: {
                    status: "SUCCESS",
                    providerTxnId: payload.providerTxnId || generateProviderTxnId(),
                    paidAt: new Date(),
                },
                select: paymentSelect,
            });

            await tx.booking.update({
                where: { id: payment.bookingId },
                data: { status: "PAID", paidAt: new Date() },
            });

            return updatedPayment;
        });
    }

    return prisma.payment.update({
        where: { id: payment.id },
        data: {
            status: payload.status,
            failedAt: payload.status === "FAILED" ? new Date() : null,
            providerTxnId: payload.providerTxnId,
        },
        select: paymentSelect,
    });
};

export const getPaymentById = async (userId: string, role: string, paymentId: string) => {
    const payment = await prisma.payment.findFirst({
        where: {
            id: paymentId,
            ...(role === "ADMIN"
                ? {}
                : {
                      OR: [
                          { userId },
                          { booking: { technician: { userId } } },
                      ],
                  }),
        },
        select: paymentSelect,
    });

    if (!payment) {
        throw new AppError("Payment not found", 404);
    }

    return payment;
};

export const refundPayment = async (paymentId: string) => {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { booking: true },
    });

    if (!payment) {
        throw new AppError("Payment not found", 404);
    }

    if (payment.status !== "SUCCESS") {
        throw new AppError("Only successful payments can be refunded", 400);
    }

    return prisma.$transaction(async (tx) => {
        const updated = await tx.payment.update({
            where: { id: paymentId },
            data: { status: "REFUNDED" },
            select: paymentSelect,
        });

        if (
            payment.booking.status !== "CANCELLED" &&
            payment.booking.status !== "COMPLETED"
        ) {
            await tx.booking.update({
                where: { id: payment.bookingId },
                data: { status: "CANCELLED", cancelledAt: new Date() },
            });
        }

        return updated;
    });
};
