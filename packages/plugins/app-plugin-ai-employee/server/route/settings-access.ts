import type { AuthorizationEnv } from '@nocobase/app-plugin-authorization';
import type { Hono, MiddlewareHandler } from 'hono';

import {
  forbiddenError,
  type ConversationManagementActor,
  type SkillsManagementActor,
  type ToolsManagementActor,
  type UsageStatisticsActor,
} from '../types.js';

/** What a caller who may open the AI settings page is allowed to read across every user. */
export type AISettingsActor = ConversationManagementActor &
  SkillsManagementActor &
  ToolsManagementActor &
  UsageStatisticsActor;

declare module 'hono' {
  interface ContextVariableMap {
    /** Whether the signed-in user can open the AI settings page, checked once. */
    canAccessAISettings: () => Promise<boolean>;
    /** Set only on a route guarded by `AIRouteGuards.settings`, once the check has passed. */
    aiSettingsActor: AISettingsActor;
  }
}

/** Answers `canAccessAISettings` for the rest of the request, on first use. */
export function provideAISettingsAccess(): MiddlewareHandler<AuthorizationEnv> {
  return async (context, next) => {
    let permitted: Promise<boolean> | undefined;
    context.set(
      'canAccessAISettings',
      () =>
        (permitted ??= context.get('authz').can({
          resource: { type: 'page', id: 'ai.settings' },
          action: 'access',
        })),
    );
    await next();
  };
}

/** Who may call a route: any signed-in user, or only one who may open the AI settings page. */
export type AIRouteAccess = 'signedIn' | 'settings';

/**
 * The middleware each route names to say who may call it. Both end by readying the AI services, so nothing is
 * initialized for a caller the route refuses.
 */
export interface AIRouteGuards {
  /** Any signed-in user: the chat, its files, and the non-secret model catalog. */
  readonly signedIn: MiddlewareHandler;
  /**
   * Only a user who can open the AI settings page. Configuring AI, and reading every user's conversations and usage,
   * is that page's job.
   */
  readonly settings: MiddlewareHandler;
}

const guardAccess = new WeakMap<object, AIRouteAccess>();

/** `ready` runs once the caller is admitted: it readies the services and handles the rest of the request. */
export function createAIRouteGuards(ready: MiddlewareHandler): AIRouteGuards {
  const signedIn: MiddlewareHandler = (context, next) => ready(context, next);
  const settings: MiddlewareHandler<AuthorizationEnv> = async (
    context,
    next,
  ) => {
    if (!(await context.get('canAccessAISettings')()))
      throw forbiddenError('AI settings access is required');
    context.set('aiSettingsActor', {
      id: context.get('authz').identity.principal.id,
      canReadAllConversations: true,
      canReadAllSkills: true,
      canReadAllTools: true,
      canReadUsageStatistics: true,
    });
    return ready(context, next);
  };
  guardAccess.set(signedIn, 'signedIn');
  guardAccess.set(settings, 'settings');
  return { signedIn, settings: settings as MiddlewareHandler };
}

/**
 * Who may call each `METHOD /path` of `router`, read from the guard its registration names first. A route whose first
 * handler is no guard is listed as `undefined`, which the route tests refuse.
 */
export function listAIRouteAccess(
  router: Hono,
): Record<string, AIRouteAccess | undefined> {
  const access: Record<string, AIRouteAccess | undefined> = {};
  for (const route of router.routes) {
    if (route.method === 'ALL') continue;
    const key = `${route.method} ${route.path}`;
    if (!(key in access)) access[key] = guardAccess.get(route.handler);
  }
  return access;
}
