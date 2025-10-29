import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";
import config from "../../config/config";
import { prisma } from "../../config/prisma";

interface JwtPayload {
  id: string;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email?: string;
    name?: string | null;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer")) {
      return res.status(401).json({ message: "Authorization token required" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = verify(token, config.jwtSecret) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res
        .status(401)
        .json({ message: "Invalid token or user not found" });
    }

    req.user = {
      userId: user.id,
      email: user.email,
      name: user.name,
    };

    next();
  } catch (error) {
    console.error("Authorization error:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
