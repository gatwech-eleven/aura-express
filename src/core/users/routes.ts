import { Router } from "express";
import * as controllers from "./controllers";

const router = Router();

router.get("/users/me", controllers.getCurrentUser);
router.patch("/profile", controllers.updateProfile);

export default router;
