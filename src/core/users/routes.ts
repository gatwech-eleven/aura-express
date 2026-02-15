import { Router } from "express";
import * as controllers from "./controllers";
import validator from "@/shared/middlewares/validationMiddleware";
import { updateProfileSchema } from "@/shared/schemas/profile.schema";

const router = Router();

router.get("/users/me", controllers.getCurrentUser);
router.patch(
  "/profile",
  validator(updateProfileSchema),
  controllers.updateProfile,
);

export default router;
