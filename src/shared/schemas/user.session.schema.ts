import { z } from "zod";

export const userSessionSchema = z.object({
  body: z.object({
    email: z.string({ message: "Email is required" }).email("Invalid email"),
    password: z.string({ message: "Password is required" }),
  }),
});
