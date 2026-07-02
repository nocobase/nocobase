/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { NoPermissionError, checkFilterParams, createUserProvider, parseJsonTemplate } from '@nocobase/acl';
import { Context } from '@nocobase/actions';

import { AGENT_GATEWAY_ACTIONS, AGENT_GATEWAY_RESOURCE } from '../security';

export const API_PREFIX = '/api/agent-gateway';
export const NOCOBASE_API_PREFIX = '/api';

const UNION_ROLE_KEY = '__union__';
const SYSTEM_ROLE_MODE_DEFAULT = 'default';
const SYSTEM_ROLE_MODE_ONLY_USE_UNION = 'only-use-union';

export type JsonRecord = Record<string, unknown>;

export const AGENT_GATEWAY_STANDARD_COLLECTIONS = [
  'agAgentActionAudits',
  'agAgentConversationEvents',
  'agAgentProfiles',
  'agAgentSessions',
  'agApiCallLogs',
  'agDispatchBindings',
  'agNodeInvitations',
  'agNodeSkillInstalls',
  'agNodes',
  'agPromptTemplates',
  'agRunArtifacts',
  'agRunControlRequests',
  'agRunEvents',
  'agRunSnapshots',
  'agRuns',
  'agSkillVersions',
  'agSkills',
] as const;

export interface ModelRecord {
  get(key: string): unknown;
  toJSON?(): JsonRecord;
}

interface CollectionLike {
  hasField?(name: string): boolean;
}

interface DatabaseWithCollectionLookup {
  hasCollection?(name: string): boolean;
  getCollection?(name: string): CollectionLike | undefined;
}

interface AuthenticatedContext extends Context {
  auth?: {
    user?: unknown;
  };
  app: Context['app'] & {
    authManager?: {
      options?: {
        authKey?: string;
        default?: string;
      };
      get(
        name: string,
        ctx: Context,
      ): Promise<{
        user?: unknown;
        check(): Promise<unknown>;
      }>;
    };
  };
}

export function isRecord(value: unknown): value is JsonRecord {
  return Object.prototype.toString.call(value) === '[object Object]';
}

export function getBodyValues(ctx: Context): JsonRecord {
  const body = ctx.request.body;
  return isRecord(body) ? body : {};
}

export function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeNocoBaseApiPath(pathname: string) {
  return pathname.startsWith(`${NOCOBASE_API_PREFIX}/`) ? pathname.slice(NOCOBASE_API_PREFIX.length) : pathname;
}

export function matchStandardCollectionAction(pathname: string, collectionNames: readonly string[]) {
  const standardPath = normalizeNocoBaseApiPath(pathname);
  for (const collectionName of collectionNames) {
    const prefix = `/${collectionName}:`;
    if (!standardPath.startsWith(prefix)) {
      continue;
    }

    const action = standardPath.slice(prefix.length).split('/')[0];
    if (action) {
      return {
        collectionName,
        action,
      };
    }
  }

  return null;
}

export function getPositiveInteger(value: unknown, fallback: number) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return fallback;
  }
  return numberValue;
}

export function getDate(value: unknown) {
  const rawValue = getString(value);
  if (!rawValue) {
    return null;
  }

  const date = new Date(rawValue);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getRecord(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

export function getArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function hasModelGetter(value: unknown): value is ModelRecord {
  return typeof (value as { get?: unknown } | null)?.get === 'function';
}

export function getModelValue(model: ModelRecord, key: string) {
  return model.get(key);
}

export function getModelString(model: ModelRecord, key: string) {
  return getString(getModelValue(model, key));
}

export function getModelNumber(model: ModelRecord, key: string, fallback = 0) {
  const value = getModelValue(model, key);
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

export function getModelTargetKey(model: ModelRecord, key: string) {
  const value = getModelValue(model, key);
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }

  throw new Error(`Invalid target key: ${key}`);
}

export function getModelJson(model: ModelRecord) {
  return model.toJSON ? model.toJSON() : {};
}

function getCollection(ctx: Context, collectionName: string) {
  const collection = (ctx.db as unknown as DatabaseWithCollectionLookup).getCollection?.(collectionName);
  if (!collection) {
    ctx.throw(400, `Collection not found: ${collectionName}`);
  }
  return collection;
}

export function getCurrentUserId(ctx: Context) {
  const stateUser = (ctx.state.currentUser || (ctx as AuthenticatedContext).auth?.user) as unknown;
  if (hasModelGetter(stateUser)) {
    const modelId = stateUser.get('id');
    if (typeof modelId === 'string' || typeof modelId === 'number') {
      return modelId;
    }
  }

  const userRecord = getRecord(stateUser);
  const id = userRecord.id;
  return typeof id === 'string' || typeof id === 'number' ? id : null;
}

function getRoleName(role: unknown) {
  if (typeof role === 'string') {
    return role;
  }

  if (hasModelGetter(role)) {
    return getModelString(role, 'name');
  }

  return getString(getRecord(role).name);
}

function getModelOrRecordString(value: unknown, key: string) {
  if (hasModelGetter(value)) {
    return getModelString(value, key);
  }

  return getString(getRecord(value)[key]);
}

function collectionExists(ctx: Context, name: string) {
  const db = ctx.db as unknown as DatabaseWithCollectionLookup;
  if (typeof db.hasCollection === 'function') {
    return db.hasCollection(name);
  }

  return Boolean(db.getCollection?.(name));
}

function collectionHasField(ctx: Context, collectionName: string, fieldName: string) {
  const db = ctx.db as unknown as DatabaseWithCollectionLookup;
  return Boolean(db.getCollection?.(collectionName)?.hasField?.(fieldName));
}

async function getSystemRoleMode(ctx: Context) {
  const settings = await ctx.db.getRepository('systemSettings').findOne({
    raw: true,
  });

  return getModelOrRecordString(settings, 'roleMode') || SYSTEM_ROLE_MODE_DEFAULT;
}

async function getDefaultRoleName(ctx: Context, userId: string | number) {
  const defaultRole = await ctx.db.getRepository('rolesUsers').findOne({
    where: {
      userId,
      default: true,
    },
  });

  return getModelOrRecordString(defaultRole, 'roleName');
}

async function getDepartmentRoleNames(ctx: Context, userId: string | number) {
  if (
    !collectionExists(ctx, 'departments') ||
    !collectionExists(ctx, 'departmentsUsers') ||
    !collectionExists(ctx, 'departmentsRoles') ||
    !collectionHasField(ctx, 'users', 'departments') ||
    !collectionHasField(ctx, 'roles', 'departments')
  ) {
    return [];
  }

  const departments = (await ctx.db.getRepository('users.departments', userId).find({
    raw: true,
  })) as unknown[];
  const departmentIds = departments
    .map((department) => {
      const id = getRecord(department).id;
      return typeof id === 'string' || typeof id === 'number' ? id : null;
    })
    .filter((id): id is string | number => id !== null);

  if (!departmentIds.length) {
    return [];
  }

  const roles = (await ctx.db.getRepository('roles').find({
    filter: {
      'departments.id': {
        $in: departmentIds,
      },
    },
    raw: true,
  })) as unknown[];

  return roles.map(getRoleName).filter(Boolean);
}

function mergeRoleNames(attachedRoleNames: string[], directRoleNames: string[]) {
  const roleNamesMap = new Map<string, string>();
  for (const roleName of attachedRoleNames) {
    roleNamesMap.set(roleName, roleName);
  }
  for (const roleName of directRoleNames) {
    roleNamesMap.set(roleName, roleName);
  }

  return Array.from(roleNamesMap.values());
}

function setCurrentRoles(ctx: Context, currentRole: string, currentRoles: string[]) {
  ctx.state.currentRole = currentRole;
  ctx.state.currentRoles = currentRoles;
  ctx.headers['x-role'] = currentRole;
  return currentRoles;
}

export async function getCurrentRoleNames(ctx: Context) {
  const existingRoles = Array.isArray(ctx.state.currentRoles)
    ? ctx.state.currentRoles.filter((role): role is string => typeof role === 'string')
    : [];
  if (existingRoles.length) {
    return existingRoles;
  }

  let selectedRole = getString(ctx.get('X-Role'));
  if (selectedRole === 'anonymous') {
    return setCurrentRoles(ctx, selectedRole, [selectedRole]);
  }

  const userId = getCurrentUserId(ctx);
  if (!userId) {
    return [];
  }

  const roles = (await ctx.db.getRepository('users.roles', userId).find({
    raw: true,
  })) as unknown[];
  const directRoleNames = roles.map(getRoleName).filter(Boolean);
  const attachedRoleNames = await getDepartmentRoleNames(ctx, userId);
  const roleNames = mergeRoleNames(attachedRoleNames, directRoleNames);
  if (!roleNames.length) {
    ctx.throw(401, 'The current user has no roles');
  }

  const roleMode = await getSystemRoleMode(ctx);

  if (selectedRole === UNION_ROLE_KEY && roleMode === SYSTEM_ROLE_MODE_DEFAULT) {
    selectedRole = roleNames[0];
  } else if (roleMode === SYSTEM_ROLE_MODE_ONLY_USE_UNION) {
    return setCurrentRoles(ctx, UNION_ROLE_KEY, roleNames);
  }

  if (selectedRole === UNION_ROLE_KEY) {
    return setCurrentRoles(ctx, UNION_ROLE_KEY, roleNames);
  }

  let currentRole: string | undefined;
  if (selectedRole) {
    if (!roleNames.includes(selectedRole)) {
      ctx.throw(401, 'The role does not belong to the user');
    }
    currentRole = selectedRole;
  }

  if (!currentRole) {
    currentRole = (await getDefaultRoleName(ctx, userId)) || roleNames[0];
  }

  if (currentRole === UNION_ROLE_KEY) {
    return setCurrentRoles(ctx, UNION_ROLE_KEY, roleNames);
  }

  return setCurrentRoles(ctx, currentRole, [currentRole]);
}

export async function requireLoggedIn(ctx: Context) {
  const authContext = ctx as AuthenticatedContext;
  if (!authContext.auth?.user && authContext.app.authManager) {
    const authKey = authContext.app.authManager.options?.authKey || 'X-Authenticator';
    const authenticatorName = ctx.get(authKey) || authContext.app.authManager.options?.default || 'basic';
    const auth = await authContext.app.authManager.get(authenticatorName, ctx);
    const user = await auth.check();
    if (user) {
      auth.user = user;
      authContext.auth = auth;
      ctx.state.currentUser = ctx.state.currentUser || user;
    }
  }

  if (!authContext.auth?.user) {
    ctx.throw(401, 'Authentication required');
  }
  ctx.state.currentUser = ctx.state.currentUser || authContext.auth.user;
}

export async function requireAgentGatewayPermission(ctx: Context, action: string, message: string) {
  await requireLoggedIn(ctx);

  const roles = await getCurrentRoleNames(ctx);
  const allowed = ctx.app.acl.can({
    roles,
    resource: AGENT_GATEWAY_RESOURCE,
    action,
  });

  if (!allowed) {
    ctx.throw(403, message);
  }
}

export async function requireManagePermission(ctx: Context) {
  await requireAgentGatewayPermission(
    ctx,
    AGENT_GATEWAY_ACTIONS.manage,
    'Agent Gateway management permission required',
  );
}

export async function getRunAclFilter(ctx: Context, action: 'get' | 'list' = 'get') {
  const roles = await getCurrentRoleNames(ctx);
  const permission = ctx.app.acl.can({
    roles,
    resource: 'agRuns',
    action,
  });

  if (!permission || typeof permission !== 'object') {
    ctx.throw(403, 'Agent Gateway run visibility permission required');
  }

  const params = getRecord(permission.params);
  const rawFilter = params.filter;
  if (rawFilter === undefined || rawFilter === null) {
    return null;
  }

  const collection = getCollection(ctx, 'agRuns');
  try {
    checkFilterParams(collection, rawFilter);
  } catch (error) {
    if (error instanceof NoPermissionError) {
      ctx.throw(403, 'Agent Gateway run visibility permission required');
    }
    throw error;
  }

  const parsedParams = getRecord(
    await parseJsonTemplate(params, {
      state: ctx.state,
      timezone: ctx.get('x-timezone'),
      userProvider: createUserProvider({
        db: ctx.db,
        currentUser: ctx.state.currentUser,
      }),
    }),
  );
  const parsedFilter = getRecord(parsedParams.filter);
  return Object.keys(parsedFilter).length ? parsedFilter : null;
}

export async function getVisibleRunFilter(ctx: Context, baseFilter: JsonRecord, action: 'get' | 'list' = 'get') {
  const visibilityFilter = await getRunAclFilter(ctx, action);
  return visibilityFilter
    ? {
        $and: [baseFilter, visibilityFilter],
      }
    : baseFilter;
}

export async function assertRunVisible(ctx: Context, runId: string, action: 'get' | 'list' = 'get') {
  const filter = await getVisibleRunFilter(
    ctx,
    {
      id: runId,
    },
    action,
  );
  const run = (await ctx.db.getRepository('agRuns').findOne({
    filter,
  })) as ModelRecord | null;
  if (!run) {
    ctx.throw(404, 'Run not found');
  }
  return run;
}
