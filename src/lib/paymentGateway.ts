import { createRequire } from "module";
import Stripe from "stripe";
import config from "../config/index.js";
import { AppError } from "../utils/AppError.js";

const require = createRequire(import.meta.url);
const SSLCommerzPayment = require("sslcommerz-lts");

export const generateTransactionId = () => {
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `FIXIT-${Date.now()}-${random}`;
};

const getStripe = () => {
    if (!config.stripe_secret_key) {
        throw new AppError("Stripe is not configured", 503);
    }

    return new Stripe(config.stripe_secret_key);
};

const getSSLCommerz = () => {
    if (!config.sslcommerz_store_id || !config.sslcommerz_store_password) {
        throw new AppError("SSLCommerz is not configured", 503);
    }

    return new SSLCommerzPayment(
        config.sslcommerz_store_id,
        config.sslcommerz_store_password,
        config.sslcommerz_is_live
    );
};

type SSLCommerzInitInput = {
    transactionId: string;
    amount: number;
    currency: string;
    productName: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress: string;
};

export const initSSLCommerzPayment = async (input: SSLCommerzInitInput) => {
    const sslcz = getSSLCommerz();

    const data = {
        total_amount: input.amount,
        currency: input.currency,
        tran_id: input.transactionId,
        success_url: `${config.backend_url}/api/payments/confirm?provider=SSLCOMMERZ`,
        fail_url: `${config.app_url}/payment/fail`,
        cancel_url: `${config.app_url}/payment/cancel`,
        ipn_url: `${config.backend_url}/api/payments/confirm`,
        shipping_method: "NO",
        product_name: input.productName,
        product_category: "Service",
        product_profile: "general",
        cus_name: input.customerName,
        cus_email: input.customerEmail,
        cus_add1: input.customerAddress,
        cus_city: "Dhaka",
        cus_state: "Dhaka",
        cus_postcode: "1000",
        cus_country: "Bangladesh",
        cus_phone: input.customerPhone || "01700000000",
    };

    return sslcz.init(data);
};

export const validateSSLCommerzPayment = async (valId: string) => {
    const sslcz = getSSLCommerz();
    return sslcz.validate({ val_id: valId });
};

type StripeSessionInput = {
    transactionId: string;
    amount: number;
    currency: string;
    productName: string;
    customerEmail: string;
};

export const createStripeCheckoutSession = async (input: StripeSessionInput) => {
    const stripe = getStripe();

    return stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: input.customerEmail,
        line_items: [
            {
                price_data: {
                    currency: input.currency.toLowerCase(),
                    product_data: {
                        name: input.productName,
                    },
                    unit_amount: Math.round(input.amount * 100),
                },
                quantity: 1,
            },
        ],
        metadata: {
            transactionId: input.transactionId,
        },
        success_url: `${config.app_url}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.app_url}/payment/cancel`,
    });
};

export const validateStripeSession = async (sessionId: string) => {
    const stripe = getStripe();
    return stripe.checkout.sessions.retrieve(sessionId);
};

export const isDevPaymentMode = () => {
    return config.node_env === "development";
};
