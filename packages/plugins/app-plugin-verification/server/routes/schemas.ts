import { isE164 } from '@nocobase/app-plugin-notification-providers/sms';
import { z } from 'zod';

import { nameSchema } from '../config.js';
import type {
  BindPhoneInput,
  CodeTiming,
  IssueStepUpTokenInput,
  PhoneView,
  SendVerificationCodeInput,
  StepUpCredential,
} from '../../shared/contracts.js';

const otp = z
  .string()
  .regex(/^\d{6}$/)
  .meta({
    description: 'The six-digit code received over the registered channel.',
  });

export const sendInput: z.ZodType<SendVerificationCodeInput> = z.strictObject({
  scene: nameSchema,
  phone: z.string().min(1).max(256).optional().meta({
    description:
      'Target in E.164 format for SMS. Omit for a verified-phone scene.',
  }),
  purpose: nameSchema
    .optional()
    .meta({ description: 'The registered purpose, required for stepUp.' }),
});
export const stepUpInput: z.ZodType<IssueStepUpTokenInput> = z.strictObject({
  purpose: nameSchema,
  code: otp,
});
export const phoneInput: z.ZodType<BindPhoneInput> = z.strictObject({
  phone: z.string().refine(isE164, 'Expected an E.164 phone number.'),
  code: otp,
});
export const timingSchema: z.ZodType<CodeTiming> = z.object({
  expiresAt: z.iso.datetime(),
  resendAt: z.iso.datetime(),
});
export const stepUpSchema: z.ZodType<StepUpCredential> = z.object({
  token: z.string(),
  expiresAt: z.iso.datetime(),
});
export const phoneSchema: z.ZodType<PhoneView> = z.object({
  phone: z.string().nullable(),
});
