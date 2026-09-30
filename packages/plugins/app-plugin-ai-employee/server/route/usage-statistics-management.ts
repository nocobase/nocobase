import type { AuthorizationEnv } from '@nocobase/app-plugin-authorization';
import type { MiddlewareHandler } from 'hono';

import { forbiddenError, type UsageStatisticsActor } from '../types.js';

declare module 'hono' {
  interface ContextVariableMap {
    usageStatisticsActor: UsageStatisticsActor;
  }
}

export function requireUsageStatistics(): MiddlewareHandler<AuthorizationEnv> {
  return async (context, next) => {
    const authorization = context.get('authz');
    // Usage statistics reuse AI settings access rather than a separate page.
    const permitted = await authorization.can({
      resource: { type: 'page', id: 'ai.settings' },
      action: 'access',
    });
    if (!permitted) {
      throw forbiddenError('AI settings access is required');
    }
    context.set('usageStatisticsActor', {
      id: authorization.identity.principal.id,
      canReadUsageStatistics: true,
    });
    await next();
  };
}
