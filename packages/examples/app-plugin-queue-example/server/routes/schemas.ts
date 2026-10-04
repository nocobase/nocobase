import { z } from 'zod';

/** Longest delay the greeting route accepts, in milliseconds. */
export const MAX_DELAY_MS = 600_000;

/** The body is optional: a greeting without one is published at once. */
export const GreetInput: z.ZodObject<
  { delay: z.ZodOptional<z.ZodNumber> },
  z.core.$strict
> = z.strictObject({
  delay: z.number().int().min(0).max(MAX_DELAY_MS).optional(),
});

export type GreetInput = z.infer<typeof GreetInput>;
