import { Request, Response, NextFunction } from "express";

export const globalErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const statusCode = err.statusCode || 500;
  const message    = err.isOperational ? err.message : "An unexpected error occurred";

  if (!err.isOperational || statusCode >= 500) {
    console.error("🔥 ERROR:", err);
  }

  res.status(statusCode).json({
    status:  statusCode >= 500 ? "error" : "fail",
    message,
  });
};
