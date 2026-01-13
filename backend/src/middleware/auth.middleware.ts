import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import { Request, Response, NextFunction } from "express";

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    (req as any).user = session.user;
    (req as any).session = session.session;

    next();
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    // Ensure requireAuth is run first
    const user = (req as any).user;

    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    if (user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: Only authorized personnel can create clubs" });
    }

    next();
};
