import "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email?: string;
        role?: string;
        name?: string | null;
      };
    }
  }
}

export {};
