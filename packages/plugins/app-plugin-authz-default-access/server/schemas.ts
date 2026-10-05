import { DataScopeRuleSchema } from '@nocobase/app-plugin-authorization/server/extension';
import type { z } from 'zod';

/**
 * A default-access rule as the routes answer it, for the API document at `/api/swagger/docs`; nothing validates a response
 * against it.
 */
export const RuleSchema: z.ZodType = DataScopeRuleSchema.meta({
  ref: 'AuthorizationDefaultAccessRule',
  description:
    'A default-access rule gives every identity records for each action of one resource, in addition to its grants.',
});
