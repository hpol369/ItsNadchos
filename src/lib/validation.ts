import { z } from 'zod';

/**
 * Schema for validate-token endpoint
 */
export const validateTokenSchema = z.object({
  token: z.string().uuid('Invalid token format'),
});

/**
 * Schema for checkout endpoint
 */
export const checkoutSchema = z.object({
  token: z.string().uuid('Invalid token format'),
  packageId: z.string().uuid('Invalid package ID format'),
});

/**
 * Schema for admin messages endpoint
 */
export const adminMessagesSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
});

/**
 * Validation result type
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Validate data against a schema and return a structured result
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }

  // Format the first error message
  const firstError = result.error.errors[0];
  const errorMessage = firstError
    ? `${firstError.path.join('.')}: ${firstError.message}`
    : 'Validation failed';

  return { success: false, error: errorMessage };
}

/**
 * Validate query parameters against a schema
 */
export function validateQuery<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): ValidationResult<T> {
  const data: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    data[key] = value;
  });
  return validate(schema, data);
}
