import { SubjectRuleSchema } from '@nocobase/app-plugin-authorization/server/extension';
import type { z } from 'zod';

/**
 * A sharing rule as the routes answer it, for the API document at `/api/swagger/docs`; nothing validates a response
 * against it.
 */
export const RuleSchema: z.ZodType = SubjectRuleSchema.meta({
  ref: 'AuthorizationSharingRule',
  description:
    'A sharing rule gives the listed subjects extra records for each action, in addition to their grants; it never selects all records.',
});
