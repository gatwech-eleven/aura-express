import { z } from "zod";

/**
 * Schema for updating user profile
 * Validates profile fields including E2EE encryption keys
 */
export const updateProfileSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .min(1, "Name cannot be empty")
        .max(100, "Name is too long")
        .optional(),

      imageUrl: z.url("Invalid image URL").optional(),

      // E2EE fields - must be valid base64 strings if provided
      publicKey: z.string().min(1, "Public key cannot be empty").optional(),

      encryptedPrivateKey: z
        .string()
        .min(1, "Encrypted private key cannot be empty")
        .optional(),

      privateKeyIv: z
        .string()
        .min(1, "Private key IV cannot be empty")
        .optional(),

      privateKeySalt: z
        .string()
        .min(1, "Private key salt cannot be empty")
        .optional(),

      bio: z.string().max(500, "Bio is too long").optional(),
    })
    .refine(
      (data) => {
        // If any E2EE field is provided, all must be provided together
        const e2eeFields = [
          data.encryptedPrivateKey,
          data.privateKeyIv,
          data.privateKeySalt,
        ];
        const providedCount = e2eeFields.filter(Boolean).length;
        return providedCount === 0 || providedCount === 3;
      },
      {
        message:
          "All E2EE fields (encryptedPrivateKey, privateKeyIv, privateKeySalt) must be provided together",
      },
    ),
});
