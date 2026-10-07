import type { AuthorizationEnv } from '@nocobase/app-plugin-authorization';
import type { Hono, MiddlewareHandler } from 'hono';

import {
  aiSettingsCheck,
  AI_SETTINGS,
  type AISettingsAction,
  type AISettingsItem,
  type AISettingsKey,
} from '../../shared/authorization.js';
import {
  forbiddenError,
  type ConversationManagementActor,
  type SkillsManagementActor,
  type ToolsManagementActor,
  type UsageStatisticsActor,
} from '../types.js';

/** What a caller admitted by a settings route may read across every user. */
export type AISettingsActor = ConversationManagementActor &
  SkillsManagementActor &
  ToolsManagementActor &
  UsageStatisticsActor;

declare module 'hono' {
  interface ContextVariableMap {
    /** Whether the signed-in user may read any user's uploaded AI files, checked on first use. */
    canReadAnyAIFile: () => Promise<boolean>;
    /** Set only on a route guarded by `AIRouteGuards.settings`, once the check has passed. */
    aiSettingsActor: AISettingsActor;
  }
}

/** One action on one AI settings item: `['llmServices', 'manage']`. */
export type AISettingsPermission = readonly [
  key: AISettingsKey,
  action: AISettingsAction,
];

/** How the route table writes a permission: `ai.llmServices:manage`. */
export type AISettingsPermissionName = `${AISettingsItem}:${AISettingsAction}`;

/** Who may call a route: any signed-in user, or a user granted any one of the listed settings permissions. */
export type AIRouteAccess = 'signedIn' | readonly AISettingsPermissionName[];

/**
 * The middleware each route names to say who may call it. Both end by readying the AI services, so nothing is
 * initialized for a caller the route refuses.
 */
export interface AIRouteGuards {
  /** Any signed-in user: the chat, its files, and the non-secret model catalog. */
  readonly signedIn: MiddlewareHandler;
  /**
   * Only a user granted at least one of `permissions` on the AI settings items. Reading every user's conversations and
   * usage, and configuring AI, is what those items grant. A route a page shares with another page names both.
   */
  settings(
    ...permissions: [AISettingsPermission, ...AISettingsPermission[]]
  ): MiddlewareHandler;
}

const guardAccess = new WeakMap<object, AIRouteAccess>();

/**
 * Answers `canReadAnyAIFile` for the rest of the request, on first use. The conversation center shows every user's
 * conversations with their attachments, so reading its item is what lets a user preview another user's file.
 */
export function provideAIFileAccess(): MiddlewareHandler<AuthorizationEnv> {
  return async (context, next) => {
    let permitted: Promise<boolean> | undefined;
    context.set(
      'canReadAnyAIFile',
      () =>
        (permitted ??= context
          .get('authz')
          .can(aiSettingsCheck('conversations'))),
    );
    await next();
  };
}

/** `ready` runs once the caller is admitted: it readies the services and handles the rest of the request. */
export function createAIRouteGuards(ready: MiddlewareHandler): AIRouteGuards {
  const signedIn: MiddlewareHandler = (context, next) => ready(context, next);
  guardAccess.set(signedIn, 'signedIn');
  return {
    signedIn,
    settings(...permissions) {
      const checks = permissions.map(([key, action]) =>
        aiSettingsCheck(key, action),
      );
      const guard: MiddlewareHandler<AuthorizationEnv> = async (
        context,
        next,
      ) => {
        const authz = context.get('authz');
        let permitted = false;
        for (const check of checks)
          if ((permitted = await authz.can(check))) break;
        if (!permitted)
          throw forbiddenError(
            `AI settings permission is required: ${checks.map(permissionName).join(' or ')}`,
          );
        // The route has checked what it serves, so the services may read across users for it.
        context.set('aiSettingsActor', {
          id: authz.identity.principal.id,
          canReadAllConversations: true,
          canReadAllSkills: true,
          canReadAllTools: true,
          canReadUsageStatistics: true,
        });
        return ready(context, next);
      };
      guardAccess.set(guard, checks.map(permissionName));
      return guard as MiddlewareHandler;
    },
  };
}

function permissionName({
  resource,
  action,
}: ReturnType<typeof aiSettingsCheck>): AISettingsPermissionName {
  return `${resource.id}:${action}`;
}

/** The description sentence of a route guarded by `settings(...permissions)`. */
export function requiresSettings(
  ...permissions: [AISettingsPermission, ...AISettingsPermission[]]
): string {
  const names = permissions.map(
    ([key, action]) => `\`${action}\` on \`${AI_SETTINGS[key]}\``,
  );
  return `Requires the AI settings permission ${names.join(' or ')}.`;
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
