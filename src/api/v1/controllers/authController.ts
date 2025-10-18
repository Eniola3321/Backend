import { Request, Response } from "express";
import { AuthService } from "../services/authService";

export class AuthController {
  static async signup(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      const newUser = await AuthService.signup(email, password);
      return res.status(201).json({ status: "success", data: { newUser } });
    } catch (error: any) {
      console.error("Signup error:", error);
      return res
        .status(400)
        .json({ message: error.message || "Signup failed" });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      const login = await AuthService.login(email, password);
      return res.status(200).json({ status: "success", data: { login } });
    } catch (error: any) {
      console.error("Login error:", error);
      return res.status(401).json({ message: error.message || "Login failed" });
    }
  }
}
