import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { authenticate } from "../controllers/auth.middleware";
import gmailRoutes from "./../routes/oauthRoutes/google.routes";
// import plaidRoutes from "./../routes/oauthRoutes/plaid.routes";
import notionRoutes from "./../routes/oauthRoutes/notion.routes";

const router = Router();

// Basic Auth
router.post("/signup", AuthController.signup);
router.post("/login", AuthController.login);
router.get("/me", authenticate, AuthController.getMe);

// Provider OAuth
// router.use("/plaid", plaidRoutes);
router.use("/google", gmailRoutes);
router.use("/notion", notionRoutes);

export default router;
