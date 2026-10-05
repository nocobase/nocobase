import { SubjectRuleSchema } from '@nocobase/app-plugin-authorization/server/extension';
import type { z } from 'zod';

/**
 * A restriction rule as the routes answer it, for the API document at `/api/swagger/docs`; nothing validates a response
 * against it.
 */
export const RuleSchema: z.ZodType = SubjectRuleSchema.meta({
  ref: 'AuthorizationRestrictionRule',
  description:
    'A restriction rule narrows the records the listed subjects reach for each action; it intersects every other source.',
});
