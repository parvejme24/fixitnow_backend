import { prisma } from "../../lib/prisma.js";
import config from "../../config/index.js";
import {
    generateShurjoOrderId,
    initShurjoPayPayment,
    isShurjoPayCancelled,
    isShurjoPaySuccess,
    mapShurjoMethod,
    verifyShurjoPayPayment,
} from "../../lib/shurjoPay.js";
import { AppError } from "../../utils/AppError.js";
import {
    InitiatePaymentInput,
    PaymentHistoryQuery,
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
            slotLabel: true,
            servicePrice: true,
            visitFee: true,
            totalAmount: true,
            notes: true,
            service: {
                select: {
                    id: true,
                    title: true,
                    price: true,
                    image: true,
                    duration: true,
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            icon: true,
                        },
                    },
                },
            },
            technician: {
                select: {
                    id: true,
                    trade: true,
                    initials: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            profileImage: true,
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
    payload: InitiatePaymentInput,
    clientIp?: string
) => {
    const booking = await prisma.booking.findFirst({
        where: {
            OR: [{ id: payload.bookingId }, { refCode: payload.bookingId }],
            customerId,
        },
        include: {
            payment: true,
            customer: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
            service: {
                select: {
                    title: true,
                },
            },
        },
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

    if (!booking.customer.phone) {
        throw new AppError(
            "Phone number is required on your profile before paying",
            400
        );
    }

    const payment = await prisma.payment.upsert({
        where: { bookingId: booking.id },
        update: {
            amount: booking.totalAmount,
            method: payload.method,
            status: "PENDING",
            paidAt: null,
            failedAt: null,
            providerTxnId: null,
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

    const merchantOrderId = generateShurjoOrderId();

    const checkout = await initShurjoPayPayment({
        orderId: merchantOrderId,
        amount: booking.totalAmount,
        customerName: booking.customer.name,
        customerEmail: booking.customer.email,
        customerPhone: booking.customer.phone,
        customerAddress: booking.notes || "Dhaka, Bangladesh",
        paymentId: payment.id,
        bookingId: booking.id,
        clientIp,
    });

    const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
            providerTxnId: checkout.orderId,
        },
        select: paymentSelect,
    });

    return {
        payment: updatedPayment,
        checkoutUrl: checkout.checkoutUrl,
        orderId: checkout.orderId,
        redirect: {
            checkoutUrl: checkout.checkoutUrl,
            successUrl: `${config.app_url}/payment/success?paymentId=${payment.id}`,
            cancelUrl: `${config.app_url}/payment/cancel?paymentId=${payment.id}`,
            failUrl: `${config.app_url}/payment/fail?paymentId=${payment.id}`,
        },
    };
};

export const handleShurjoPayCallback = async (orderId: string) => {
    if (!orderId) {
        throw new AppError("ShurjoPay order_id is required", 400);
    }

    const verified = await verifyShurjoPayPayment(orderId);
    const spCode = verified.spCode;

    const paymentId = verified.value1;
    const payment = paymentId
        ? await prisma.payment.findUnique({ where: { id: paymentId } })
        : await prisma.payment.findFirst({
              where: { providerTxnId: orderId },
          });

    if (!payment) {
        throw new AppError("Payment not found for this ShurjoPay order", 404);
    }

    if (payment.status === "SUCCESS") {
        return {
            payment: await prisma.payment.findUniqueOrThrow({
                where: { id: payment.id },
                select: paymentSelect,
            }),
            status: "SUCCESS" as const,
            redirectUrl: `${config.app_url}/payment/success?paymentId=${payment.id}&order_id=${orderId}`,
        };
    }

    if (isShurjoPaySuccess(spCode)) {
        const updated = await prisma.$transaction(async (tx) => {
            const updatedPayment = await tx.payment.update({
                where: { id: payment.id },
                data: {
                    status: "SUCCESS",
                    method: mapShurjoMethod(verified.method),
                    providerTxnId: orderId,
                    paidAt: new Date(),
                    failedAt: null,
                },
                select: paymentSelect,
            });

            await tx.booking.update({
                where: { id: payment.bookingId },
                data: { status: "PAID", paidAt: new Date() },
            });

            return updatedPayment;
        });

        return {
            payment: updated,
            status: "SUCCESS" as const,
            redirectUrl: `${config.app_url}/payment/success?paymentId=${payment.id}&order_id=${orderId}`,
        };
    }

    const failedStatus = isShurjoPayCancelled(spCode) ? "CANCELLED" : "FAILED";

    const updated = await prisma.payment.update({
        where: { id: payment.id },
        data: {
            status: failedStatus,
            providerTxnId: orderId,
            failedAt: new Date(),
        },
        select: paymentSelect,
    });

    return {
        payment: updated,
        status: failedStatus,
        redirectUrl: `${config.app_url}/payment/${
            failedStatus === "CANCELLED" ? "cancel" : "fail"
        }?paymentId=${payment.id}&order_id=${orderId}`,
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
                    providerTxnId:
                        payload.providerTxnId || generateProviderTxnId(),
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

export const getPaymentById = async (
    userId: string,
    role: string,
    paymentId: string
) => {
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

/** Customer payment history (own payments only) */
export const getCustomerPaymentHistory = async (
    customerId: string,
    query: PaymentHistoryQuery
) => {
    const { page, limit, status, method, bookingId, q } = query;
    const skip = (page - 1) * limit;

    const where = {
        userId: customerId,
        ...(status && { status }),
        ...(method && { method }),
        ...(bookingId && {
            OR: [{ bookingId }, { booking: { refCode: bookingId } }],
        }),
        ...(q && {
            OR: [
                { providerTxnId: { contains: q, mode: "insensitive" as const } },
                {
                    booking: {
                        refCode: { contains: q, mode: "insensitive" as const },
                    },
                },
                {
                    booking: {
                        service: {
                            title: {
                                contains: q,
                                mode: "insensitive" as const,
                            },
                        },
                    },
                },
                {
                    booking: {
                        technician: {
                            user: {
                                name: {
                                    contains: q,
                                    mode: "insensitive" as const,
                                },
                            },
                        },
                    },
                },
            ],
        }),
    };

    const [payments, total] = await Promise.all([
        prisma.payment.findMany({
            where,
            select: paymentSelect,
            skip,
            take: limit,
            orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
        }),
        prisma.payment.count({ where }),
    ]);

    return {
        payments,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 0,
        },
    };
};

/** Summary cards for customer payment history UI */
export const getCustomerPaymentSummary = async (customerId: string) => {
    const [totalPayments, successAgg, pendingCount, failedCount, refundedCount] =
        await Promise.all([
            prisma.payment.count({ where: { userId: customerId } }),
            prisma.payment.aggregate({
                where: { userId: customerId, status: "SUCCESS" },
                _sum: { amount: true },
                _count: { id: true },
            }),
            prisma.payment.count({
                where: { userId: customerId, status: "PENDING" },
            }),
            prisma.payment.count({
                where: {
                    userId: customerId,
                    status: { in: ["FAILED", "CANCELLED"] },
                },
            }),
            prisma.payment.count({
                where: { userId: customerId, status: "REFUNDED" },
            }),
        ]);

    return {
        totalPayments,
        successfulPayments: successAgg._count.id,
        totalSpent: successAgg._sum.amount || 0,
        pendingPayments: pendingCount,
        failedOrCancelled: failedCount,
        refundedPayments: refundedCount,
    };
};

export const refundPayment = async (
    paymentId: string,
    actor: { userId: string; role: string }
) => {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
            booking: {
                include: {
                    technician: {
                        select: { id: true, userId: true },
                    },
                },
            },
        },
    });

    if (!payment) {
        throw new AppError("Payment not found", 404);
    }

    if (actor.role === "TECHNICIAN") {
        if (payment.booking.technician.userId !== actor.userId) {
            throw new AppError(
                "You can only refund payments for your own bookings",
                403
            );
        }
    } else if (actor.role !== "ADMIN") {
        throw new AppError("Only the assigned technician can refund", 403);
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
