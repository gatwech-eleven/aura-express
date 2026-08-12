import { z } from "zod";

/*
  validating the user sign up fields
  on server side
*/
export const signupUserSchema = z.object({
  body: z.object({
    name: z.string({ message: "User name field is required" }),
    email: z.string({ message: "User email field is required" }).email(
      "Invalid email",
    ),
    password: z.string({ message: "User password field is required" }).min(
      8,
      "Password is too short! It should be atleast 8 characters",
    ),
    imageUrl: z.string().optional(),
  }),
});

/*
  validating the user sign in fields on server side
*/
export const loginUserSchema = z.object({
  body: z.object({
    email: z.string({ message: "User email field is required" }).email(
      "Invalid email",
    ),
    password: z.string({ message: "User password field is required" }),
  }),
});
