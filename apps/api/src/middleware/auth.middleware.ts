import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { HttpStatus, Role } from "@repo/types";
import env from "../config/env.config.js";
import { prisma } from "@repo/database";

// Add AccountStatus enum
export enum AccountStatus {
  ACTIVE = "ACTIVE",
  PENDING = "PENDING",
  SUSPENDED = "SUSPENDED",
  DELETED = "DELETED",
}

interface JwtPayload {
  userId: string;
  role: Role;
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const currentUser = await prisma.user.findUnique({ 
      where: { id: decoded.userId },
      include: { tenant: true }
    });

    if (!currentUser) {
      res.clearCookie("token", {
        httpOnly: true,
        secure: env.isProduction,
        sameSite: env.isProduction ? "none" : "lax",
        path: "/",
      });
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: "User no longer exists" });
    }

    if (currentUser.accountStatus === AccountStatus.SUSPENDED) {
      return res.status(HttpStatus.FORBIDDEN).json({ message: "Your account has been suspended" });
    }

    if (currentUser.tenant && currentUser.tenant.subscriptionStatus === "SUSPENDED") {
      return res.status(HttpStatus.FORBIDDEN).json({ message: "Your organization's account has been suspended" });
    }

    if (currentUser.accountStatus === AccountStatus.DELETED) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: "User no longer exists" });
    }

    req.user = {
      userId: currentUser.id,
      role:   currentUser.role as Role,
      email:  currentUser.email,
      tenantId: currentUser.tenantId || undefined,
      siteId: currentUser.siteId || undefined,
    };

    next();
  } catch (error: any) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: "Invalid or expired session" });
    }
    // For database or other errors, pass to global error handler
    next(error);
  }
};

export const restrictTo = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role as Role)) {
      return res.status(HttpStatus.FORBIDDEN).json({
        status: "fail",
        message: "Insufficient permissions for this operation",
      });
    }
    next();
  };
};