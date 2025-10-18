import { Router } from "express";
import { AuthController } from "../auth/authController";

const router = Router();
router.post("/signup", AuthController.signup);
router.post("/login", AuthController.login);

export default router;
