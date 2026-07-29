export class AppError extends Error {
    statusCode: number;
    code: string;

    constructor(message: string, statusCode: number, code?: string) {
        super(message);
        this.statusCode = statusCode;
        this.code =
            code ||
            (statusCode === 400
                ? "BAD_REQUEST"
                : statusCode === 401
                  ? "UNAUTHORIZED"
                  : statusCode === 403
                    ? "FORBIDDEN"
                    : statusCode === 404
                      ? "NOT_FOUND"
                      : statusCode === 409
                        ? "CONFLICT"
                        : "INTERNAL_ERROR");
        this.name = "AppError";
    }
}
