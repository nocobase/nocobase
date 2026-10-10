import { z } from 'zod';

/** The public authentication capabilities returned without a session. */
export interface PasswordResetCapability {
  readonly passwordResetAvailable: boolean;
}

export const PasswordResetCapabilitySchema: z.ZodType<PasswordResetCapability> =
  z.object({ passwordResetAvailable: z.boolean() }).meta({
    ref: 'AuthenticationPasswordResetCapability',
    description: 'Whether email-based password reset is configured.',
  });
