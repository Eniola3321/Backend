import "express";

declare global {
  namespace Express {
    interface User {
      userId: string;
      email?: string;
      role?: string;
      name?: string | null;
    }

    interface Request {
      user?: User;
    }
  }
}
