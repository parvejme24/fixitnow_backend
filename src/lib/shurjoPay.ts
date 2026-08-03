import config from "../config/index.js";
import { AppError } from "../utils/AppError.js";

type ShurjoTokenResponse = {
    token?: string;
    store_id?: number;
    execute_url?: string;
    token_type?: string;
    sp_code?: number | string;
    message?: string;
};

type ShurjoCheckoutResponse = {
    checkout_url?: string;
    order_id?: string;
    sp_order_id?: string;
    customer_order_id?: string;
    sp_code?: number | string;
    message?: string;
};

export type ShurjoVerifyResponse = {
    id?: number | string;
    order_id?: string;
    customer_order_id?: string;
    currency?: string;
    amount?: number | string;
    payable_amount?: number | string;
    received_amount?: number | string;
    method?: string;
    bank_status?: string;
    sp_message?: string;
    sp_code?: number | string;
    value1?: string;
    value2?: string;
    value3?: string;
    value4?: string;
    [key: string]: unknown;
};

type ShurjoPaymentInput = {
    orderId: string;
    amount: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress?: string;
    paymentId: string;
    bookingId: string;
    clientIp?: string;
};

let cachedToken: { token: string; storeId: number; expiresAt: number } | null =
    null;

const toSpCode = (code: number | string | undefined) => {
    if (code === undefined || code === null) return undefined;
    return String(code);
};

const shurjoFetch = async <T>(
    path: string,
    options: RequestInit = {}
): Promise<T> => {
    const response = await fetch(`${config.sp_endpoint}${path}`, options);
    const text = await response.text();

    let data: T;
    try {
        data = JSON.parse(text) as T;
    } catch {
        throw new AppError(
            `ShurjoPay returned invalid JSON (${response.status})`,
            502
        );
    }

    if (!response.ok) {
        const message =
            (data as { message?: string })?.message ||
            `ShurjoPay request failed: ${response.statusText}`;
        throw new AppError(message, 502);
    }

    return data;
};

export const getShurjoPayToken = async () => {
    if (cachedToken && cachedToken.expiresAt > Date.now()) {
        return cachedToken;
    }

    if (!config.sp_username || !config.sp_password) {
        throw new AppError("ShurjoPay is not configured", 503);
    }

    const data = await shurjoFetch<ShurjoTokenResponse>("/api/get_token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: config.sp_username,
            password: config.sp_password,
        }),
    });

    if (!data.token || !data.store_id) {
        throw new AppError(
            data.message || "Failed to authenticate with ShurjoPay",
            502
        );
    }

    cachedToken = {
        token: data.token,
        storeId: data.store_id,
        expiresAt: Date.now() + 50 * 60 * 1000,
    };

    return cachedToken;
};

export const initShurjoPayPayment = async (input: ShurjoPaymentInput) => {
    const { token, storeId } = await getShurjoPayToken();

    const payload = {
        token,
        store_id: storeId,
        prefix: config.sp_prefix,
        currency: "BDT",
        return_url: config.sp_return_url,
        cancel_url: config.sp_return_url,
        amount: input.amount,
        order_id: input.orderId,
        discount_amount: 0,
        disc_percent: 0,
        client_ip: input.clientIp || "127.0.0.1",
        customer_name: input.customerName,
        customer_phone: input.customerPhone,
        customer_email: input.customerEmail,
        customer_address: input.customerAddress || "Dhaka",
        customer_city: "Dhaka",
        customer_state: "Dhaka",
        customer_postcode: "1000",
        customer_country: "Bangladesh",
        shipping_address: input.customerAddress || "Dhaka",
        shipping_city: "Dhaka",
        shipping_country: "Bangladesh",
        received_person_name: input.customerName,
        shipping_phone_number: input.customerPhone,
        value1: input.paymentId,
        value2: input.bookingId,
        value3: input.orderId,
        value4: "FixItNow",
    };

    const data = await shurjoFetch<ShurjoCheckoutResponse>("/api/secret-pay", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    const orderId = data.order_id || data.sp_order_id;

    if (!data.checkout_url || !orderId) {
        throw new AppError(
            data.message || "Failed to create ShurjoPay checkout",
            502
        );
    }

    return {
        checkoutUrl: data.checkout_url,
        orderId,
        customerOrderId: data.customer_order_id || input.orderId,
    };
};

export const verifyShurjoPayPayment = async (orderId: string) => {
    const { token } = await getShurjoPayToken();

    const data = await shurjoFetch<ShurjoVerifyResponse[] | ShurjoVerifyResponse>(
        "/api/verification",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ order_id: orderId }),
        }
    );

    const result = Array.isArray(data) ? data[0] : data;

    if (!result) {
        throw new AppError(
            "ShurjoPay verification returned empty response",
            502
        );
    }

    return {
        ...result,
        spCode: toSpCode(result.sp_code),
    };
};

export const isShurjoPaySuccess = (spCode: string | undefined) =>
    spCode === "1000";

export const isShurjoPayCancelled = (spCode: string | undefined) =>
    spCode === "1002";

export const generateShurjoOrderId = () => {
    return `${config.sp_prefix}${Date.now()}`;
};

export const mapShurjoMethod = (
    method?: string
): "BKASH" | "NAGAD" | "CARD" => {
    const normalized = (method || "").toLowerCase();
    if (normalized.includes("bkash") || normalized.includes("bKash")) {
        return "BKASH";
    }
    if (normalized.includes("nagad")) {
        return "NAGAD";
    }
    return "CARD";
};
