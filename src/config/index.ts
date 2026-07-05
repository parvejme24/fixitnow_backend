const config = {
    port: Number(process.env.PORT) || 5001,
    app_url: process.env.APP_URL || "http://localhost:3000",
    jwt_secret: process.env.JWT_SECRET || "fixitnow-jwt-secret",
    jwt_expires_in: process.env.JWT_EXPIRES_IN || "7d",
    stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET || "",
    node_env: process.env.NODE_ENV || "development",
};

export default config;
