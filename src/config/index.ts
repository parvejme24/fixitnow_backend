const vercelUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : undefined;

const backendUrl =
    process.env.BACKEND_URL || vercelUrl || "http://localhost:5001";

const corsOrigins = [
    process.env.APP_URL || "http://localhost:3000",
    backendUrl,
    vercelUrl,
    process.env.CORS_ORIGINS,
]
    .filter(Boolean)
    .flatMap((origin) => origin!.split(",").map((o) => o.trim()))
    .filter(Boolean);

const config = {
    port: Number(process.env.PORT) || 5001,
    database_url: process.env.DATABASE_URL || "",
    app_url: process.env.APP_URL || "http://localhost:3000",
    backend_url: backendUrl,
    cors_origins: [...new Set(corsOrigins)],
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
        `${backendUrl}/api/payments/shurjopay/callback`,
    node_env: process.env.NODE_ENV || "development",
    is_production: process.env.NODE_ENV === "production",
};

export default config;
