import { z } from 'zod';

export const RuleParams: z.ZodObject<{ ruleName: z.ZodString }> = z.object({
  ruleName: z.string().min(1),
});

/** The body is optional: `start` without one keeps the rule's interval. */
export const StartRuleInput: z.ZodObject<
  { every: z.ZodOptional<z.ZodNumber> },
  z.core.$strict
> = z.strictObject({
  every: z.number().int().positive().optional(),
});

export type StartRuleInput = z.infer<typeof StartRuleInput>;
