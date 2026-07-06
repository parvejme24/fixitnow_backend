import { Prisma } from "../../../generated/prisma/client.js";
import config from "../../config/index.js";
import { prisma } from "../../lib/prisma.js";
import {
    createStripeCheckoutSession,
    generateTransactionId,
    initSSLCommerzPayment,
    isDevPaymentMode,
    validateSSLCommerzPayment,
    validateStripeSession,
} from "../../lib/paymentGateway.js";
import {
    generateShurjoOrderId,
    initShurjoPayPayment,
    verifyShurjoPayPayment,
} from "../../lib/shurjoPay.js";
import { AppError } from "../../utils/AppError.js";
import {
    ConfirmPaymentInput,
    CreatePaymentInput,
    PaymentQuery,
} from "./payment.interface.js";

const paymentSelect = {
    id: true,
    transactionId: true,
    bookingId: true,
    amount: true,
    currency: true,
    method: true,
    provider: true,
    status: true,
    paidAt: true,
    createdAt: true,
    updatedAt: true,
    booking: {
        select: {
            id: true,
            status: true,
            scheduledAt: true,
            address: true,
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

const completePayment = async (
    paymentId: string,
    gatewayData: Record<string, unknown>,
    method?: string
) => {
    return prisma.$transaction(async (tx) => {
        const payment = await tx.payment.findUniqueOrThrow({
            where: { id: paymentId },
        });

        if (payment.status === "COMPLETED") {
            return tx.payment.findUniqueOrThrow({
                where: { id: paymentId },
                select: paymentSelect,
            });
        }

        const updatedPayment = await tx.payment.update({
            where: { id: paymentId },
            data: {
                status: "COMPLETED",
                method,
                gatewayData: gatewayData as Prisma.InputJsonValue,
                paidAt: new Date(),
            },
            select: paymentSelect,
        });

        await tx.booking.update({
            where: { id: payment.bookingId },
            data: { status: "PAID" },
        });

        return updatedPayment;
    });
};

const verifyAndCompleteShurjoPayment = async (
    paymentId: string,
    orderId: string
) => {
    const verification = await verifyShurjoPayPayment(orderId);

    if (verification.sp_code !== 1000) {
        await prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: verification.sp_code === 1002 ? "CANCELLED" : "FAILED",
                gatewayData: verification as unknown as Prisma.InputJsonValue,
            },
        });

        throw new AppError(
            verification.sp_message || "ShurjoPay payment failed",
            400
        );
    }

    return completePayment(
        paymentId,
        verification as unknown as Record<string, unknown>,
        verification.method || "ShurjoPay"
    );
};

export const createPayment = async (
    customerId: string,
    payload: CreatePaymentInput
) => {
    const booking = await prisma.booking.findFirst({
        where: {
            id: payload.bookingId,
            customerId,
        },
        include: {
            service: true,
            customer: true,
            payment: true,
        },
    });

    if (!booking) {
        throw new AppError("Booking not found", 404);
    }

    if (booking.status !== "ACCEPTED") {
        throw new AppError(
            `Payment can only be created for accepted bookings. Current status: ${booking.status}. Ask the technician to accept the booking first.`,
            400
        );
    }

    if (booking.payment?.status === "COMPLETED") {
        throw new AppError("Booking is already paid", 400);
    }

    const amount = booking.service.price;
    let transactionId = generateTransactionId();
    let gatewayResponse: Record<string, unknown> = {};
    let gatewayUrl: string | null = null;
    let sessionId: string | null = null;

    if (payload.provider === "SHURJOPAY") {
        transactionId = generateShurjoOrderId();

        const pendingPayment = await prisma.payment.upsert({
            where: { bookingId: booking.id },
            update: {
                transactionId,
                amount,
                provider: "SHURJOPAY",
                currency: "BDT",
                status: "PENDING",
                paidAt: null,
            },
            create: {
                transactionId,
                bookingId: booking.id,
                amount,
                currency: "BDT",
                provider: "SHURJOPAY",
                status: "PENDING",
            },
            select: paymentSelect,
        });

        const response = await initShurjoPayPayment({
            orderId: transactionId,
            amount,
            customerName: booking.customer.name,
            customerEmail: booking.customer.email,
            customerPhone: booking.customer.phone || "01700000000",
            customerAddress: booking.address,
            paymentId: pendingPayment.id,
            bookingId: booking.id,
        });

        gatewayResponse = response as unknown as Record<string, unknown>;
        gatewayUrl = response.checkout_url || null;

        const payment = await prisma.payment.update({
            where: { id: pendingPayment.id },
            data: {
                gatewayData: gatewayResponse as Prisma.InputJsonValue,
            },
            select: paymentSelect,
        });

        return { payment, gatewayUrl, sessionId };
    }

    if (payload.provider === "SSLCOMMERZ") {
        try {
            gatewayResponse = await initSSLCommerzPayment({
                transactionId,
                amount,
                currency: "BDT",
                productName: booking.service.title,
                customerName: booking.customer.name,
                customerEmail: booking.customer.email,
                customerPhone: booking.customer.phone || "01700000000",
                customerAddress: booking.address,
            });
            gatewayUrl = (gatewayResponse.GatewayPageURL as string) || null;
        } catch (error) {
            if (!isDevPaymentMode()) {
                throw error;
            }

            gatewayResponse = {
                GatewayPageURL: `${config.backend_url}/api/payments/dev-mock?transactionId=${transactionId}`,
                status: "DEV_MOCK",
            };
            gatewayUrl = gatewayResponse.GatewayPageURL as string;
        }
    } else {
        try {
            const session = await createStripeCheckoutSession({
                transactionId,
                amount,
                currency: "usd",
                productName: booking.service.title,
                customerEmail: booking.customer.email,
            });

            gatewayResponse = {
                sessionId: session.id,
                GatewayPageURL: session.url,
            };
            gatewayUrl = session.url;
            sessionId = session.id;
        } catch (error) {
            if (!isDevPaymentMode()) {
                throw error;
            }

            gatewayResponse = {
                sessionId: `dev_session_${transactionId}`,
                GatewayPageURL: `${config.backend_url}/api/payments/dev-mock?transactionId=${transactionId}`,
                status: "DEV_MOCK",
            };
            gatewayUrl = gatewayResponse.GatewayPageURL as string;
            sessionId = gatewayResponse.sessionId as string;
        }
    }

    const payment = await prisma.payment.upsert({
        where: { bookingId: booking.id },
        update: {
            transactionId,
            amount,
            provider: payload.provider,
            status: "PENDING",
            gatewayData: gatewayResponse as Prisma.InputJsonValue,
            paidAt: null,
        },
        create: {
            transactionId,
            bookingId: booking.id,
            amount,
            currency: payload.provider === "STRIPE" ? "USD" : "BDT",
            provider: payload.provider,
            status: "PENDING",
            gatewayData: gatewayResponse as Prisma.InputJsonValue,
        },
        select: paymentSelect,
    });

    return { payment, gatewayUrl, sessionId };
};

export const confirmPayment = async (
    customerId: string,
    payload: ConfirmPaymentInput
) => {
    const payment = await prisma.payment.findFirst({
        where: {
            id: payload.paymentId,
            booking: { customerId },
        },
    });

    if (!payment) {
        throw new AppError("Payment not found", 404);
    }

    if (payment.status === "COMPLETED") {
        return prisma.payment.findUniqueOrThrow({
            where: { id: payment.id },
            select: paymentSelect,
        });
    }

    if (payment.provider === "SHURJOPAY") {
        const orderId = payload.orderId || payment.transactionId;
        return verifyAndCompleteShurjoPayment(payment.id, orderId);
    }

    let gatewayData: Record<string, unknown> = {};
    let method: string | undefined;

    if (payment.provider === "SSLCOMMERZ") {
        if (payload.val_id) {
            const validation = await validateSSLCommerzPayment(payload.val_id);
            gatewayData = validation;

            if (validation.status !== "VALID" && validation.status !== "VALIDATED") {
                throw new AppError("Payment validation failed", 400);
            }

            method = validation.card_type || validation.card_brand || "SSLCommerz";
        } else if (isDevPaymentMode()) {
            gatewayData = { status: "DEV_CONFIRMED" };
            method = "dev_mock";
        } else {
            throw new AppError("val_id is required for SSLCommerz confirmation", 400);
        }
    } else if (payment.provider === "STRIPE") {
        if (payload.sessionId) {
            const session = await validateStripeSession(payload.sessionId);
            gatewayData = session as unknown as Record<string, unknown>;

            if (session.payment_status !== "paid") {
                throw new AppError("Stripe payment is not completed", 400);
            }

            method = "card";
        } else if (isDevPaymentMode()) {
            gatewayData = { status: "DEV_CONFIRMED" };
            method = "dev_mock";
        } else {
            throw new AppError("sessionId is required for Stripe confirmation", 400);
        }
    }

    return completePayment(payment.id, gatewayData, method);
};

export const handleShurjoPayCallback = async (orderId: string) => {
    const payment = await prisma.payment.findFirst({
        where: {
            transactionId: orderId,
            provider: "SHURJOPAY",
        },
    });

    if (!payment) {
        throw new AppError("Payment not found for this ShurjoPay order", 404);
    }

    return verifyAndCompleteShurjoPayment(payment.id, orderId);
};

export const getCustomerPayments = async (
    customerId: string,
    query: PaymentQuery
) => {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const where = {
        booking: { customerId },
        ...(status && { status }),
    };

    const [payments, total] = await Promise.all([
        prisma.payment.findMany({
            where,
            select: paymentSelect,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
        }),
        prisma.payment.count({ where }),
    ]);

    return {
        payments,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

export const getPaymentById = async (customerId: string, paymentId: string) => {
    const payment = await prisma.payment.findFirst({
        where: {
            id: paymentId,
            booking: { customerId },
        },
        select: paymentSelect,
    });

    if (!payment) {
        throw new AppError("Payment not found", 404);
    }

    return payment;
};
