import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { authMiddleware } from "../controllers/auth.middleware";
import passport from "passport";

const router = Router();
router.post("/signup", AuthController.signup);
router.post("/login", AuthController.login);
router.get("/google", googleAuth);
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  googleCallback
);

export default router;
