import {
  defineAppConfig,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import { z } from 'zod';

import type { CodePolicy } from './contracts.js';

interface SmsDestination {
  readonly channel: string;
  readonly template: string;
}

export interface VerificationConfig {
  readonly defaults?: Partial<CodePolicy>;
  readonly ipHourlyLimit?: number;
  readonly userHourlyLimit?: number;
  readonly stepUpTtlSeconds?: number;
  readonly bindPhone?: SmsDestination;
  readonly stepUp?: SmsDestination;
}

interface ResolvedVerificationConfig extends VerificationConfig {
  readonly defaults: CodePolicy;
  readonly ipHourlyLimit: number;
  readonly userHourlyLimit: number;
  readonly stepUpTtlSeconds: number;
}

const seconds = z.number().int().min(1).max(3600);
export const policySchema: z.ZodType<CodePolicy> = z.strictObject({
  ttlSeconds: seconds.default(300),
  resendSeconds: seconds.default(60),
  hourlyLimit: z.number().int().min(1).max(1000).default(5),
  maxAttempts: z.number().int().min(1).max(10).default(5),
});
export const nameSchema: z.ZodString = z
  .string()
  .regex(/^[A-Za-z][A-Za-z0-9._-]{0,63}$/);
const destination = z.strictObject({
  channel: z.string().min(1).max(128),
  template: z.string().min(1).max(128),
});
export const verificationConfigSchema: z.ZodType<ResolvedVerificationConfig> =
  z.strictObject({
    defaults: policySchema.default({
      ttlSeconds: 300,
      resendSeconds: 60,
      hourlyLimit: 5,
      maxAttempts: 5,
    }),
    ipHourlyLimit: z.number().int().min(1).max(10000).default(20),
    userHourlyLimit: z.number().int().min(1).max(10000).default(20),
    stepUpTtlSeconds: seconds.default(300),
    bindPhone: destination.optional(),
    stepUp: destination.optional(),
  });

export function defineVerificationConfig(
  defaults: VerificationConfig = {},
): AppConfigFactory<VerificationConfig> {
  return defineAppConfig<VerificationConfig>({
    defaults,
    validate: (value) => {
      verificationConfigSchema.parse(value);
    },
  });
}
