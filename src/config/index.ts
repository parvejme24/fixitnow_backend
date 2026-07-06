const config = {
    port: Number(process.env.PORT) || 5001,
    app_url: process.env.APP_URL || "http://localhost:3000",
    backend_url: process.env.BACKEND_URL || "http://localhost:5001",
    jwt_secret: process.env.JWT_SECRET || "fixitnow-jwt-secret",
    jwt_expires_in: process.env.JWT_EXPIRES_IN || "7d",
    stripe_secret_key: process.env.STRIPE_SECRET_KEY || "",
    stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET || "",
    sslcommerz_store_id: process.env.SSLCOMMERZ_STORE_ID || "",
    sslcommerz_store_password: process.env.SSLCOMMERZ_STORE_PASSWORD || "",
    sslcommerz_is_live: process.env.SSLCOMMERZ_IS_LIVE === "true",
    sp_endpoint: process.env.SP_ENDPOINT || "https://sandbox.shurjopayment.com",
    sp_username: process.env.SP_USERNAME || "",
    sp_password: process.env.SP_PASSWORD || "",
    sp_prefix: process.env.SP_PREFIX || "SP",
    sp_return_url:
        process.env.SP_RETURN_URL ||
        `${process.env.BACKEND_URL || "http://localhost:5001"}/api/payments/shurjopay/callback`,
    node_env: process.env.NODE_ENV || "development",
};

export default config;
