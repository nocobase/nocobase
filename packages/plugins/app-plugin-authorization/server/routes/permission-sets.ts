import { ApiError, parseApiInput } from '@nocobase/app-server/router';
import type { Context } from 'hono';
import { validator } from 'hono/validator';
import {
  parseAuthorizationTitle,
  type AuthorizationRouteHandler,
  type AuthorizationTitle,
  dataScopeTarget,
  type CompositeResourceApi,
  type PermissionGrant,
  type Principal,
  type RecordAccessRegistry,
} from '@nocobase/authorization/core';
import {
  PermissionSetProtectedError,
  type AssignPermissionSetInput,
  type CreatePermissionSetInput,
  type PermissionSet,
  type PermissionSetProtectionInfo,
  type PermissionSetsApi,
} from '@nocobase/authorization/permission-sets';
import {
  AUTHORIZATION_ERROR_DOMAIN,
  createRouteHandler,
  createSettingsRouter,
  requireSettings,
  settingsAccess,
  type SettingsRouterEnv,
} from '../extension/http.js';
import { databaseHost } from '../database/api.js';
import { databaseGrantViolations } from '../database/grant-validation.js';
import { createSubjectRoutes } from '../extension/options.js';
import type { AuthorizationExtensionHost } from '../host.js';
import { authorizationOptions } from '../options.js';
import {
  AssignmentParams,
  AssignPermissionSetBody,
  CreatePermissionSetBody,
  ListPermissionSetsQuery,
  PermissionSetParams,
  UpdatePermissionSetBody,
} from './schemas.js';

/** A Permission Set as the read endpoints report it. */
export interface PermissionSetSummary extends PermissionSet {
  /** Present when the set is protected; `allow` lists what the generic API may still do. */
  readonly protection?: PermissionSetProtectionInfo;
  /** True when holding this set grants unrestricted access. */
  readonly unrestricted?: boolean;
}

export const PERMISSION_SETS_SETTINGS = 'authorization.permission-sets';

type Api = Omit<PermissionSetsApi, 'withTransaction'>;

/** Every `/permissionSets` route, gated by `settings:authorization.permission-sets`. */
export function createPermissionSetHandler(
  host: AuthorizationExtensionHost,
  api: Api,
): AuthorizationRouteHandler {
  const routes = createSettingsRouter();
  const require = (context: Context<SettingsRouterEnv>, action: string) =>
    requireSettings(
      context.env.authorization,
      PERMISSION_SETS_SETTINGS,
      action,
    );
  const notFound = (key: string) =>
    new ApiError({
      status: 'NOT_FOUND',
      reason: 'PERMISSION_SET_NOT_FOUND',
      domain: AUTHORIZATION_ERROR_DOMAIN,
      message: `Permission Set ${key} was not found.`,
    });

  // Fixed segments are registered before `/permissionSets/:key`, which would otherwise match them.
  routes.get('/permissionSets/options', async (context) => {
    await require(context, 'read');
    return context.json({ data: await authorizationOptions(host) });
  });
  routes.route(
    '/',
    createSubjectRoutes(
      host,
      '/permissionSets',
      PERMISSION_SETS_SETTINGS,
      'read',
    ),
  );
  routes.get(
    '/permissionSets',
    settingsAccess(PERMISSION_SETS_SETTINGS, 'read'),
    validator('query', (value) =>
      parseApiInput(ListPermissionSetsQuery, value),
    ),
    async (context) => {
      const { subjectType, subjectId } = context.req.valid('query');
      if ((subjectType === undefined) !== (subjectId === undefined))
        throw new ApiError({
          status: 'INVALID_ARGUMENT',
          reason: 'INVALID_INPUT',
          domain: AUTHORIZATION_ERROR_DOMAIN,
          message: 'subjectType and subjectId are given together.',
          fieldViolations: [
            {
              field: subjectType === undefined ? 'subjectType' : 'subjectId',
              description: 'Required when the other subject field is given.',
            },
          ],
        });
      const principal: Principal | undefined =
        subjectType !== undefined && subjectId !== undefined
          ? { type: subjectType, id: subjectId }
          : undefined;
      const sets = principal
        ? await api.getEffective({ principal })
        : await api.list();
      // A bounded configuration list: every matching Permission Set, with `meta.total`.
      return context.json({
        data: sets.map((set) => summarize(api, set)),
        meta: { total: sets.length },
      });
    },
  );
  routes.post(
    '/permissionSets',
    settingsAccess(PERMISSION_SETS_SETTINGS, 'create'),
    validator('json', (value) => parseApiInput(CreatePermissionSetBody, value)),
    async (context) => {
      const input = permissionSetInput(context.req.valid('json'));
      validateGrants(host, input);
      await validateWriteGrants(host, input.grants);
      api.assertWritable(input.key, 'create');
      return context.json(
        { data: summarize(api, await api.create(input)) },
        201,
      );
    },
  );
  routes.get(
    '/permissionSets/:key/assignments',
    settingsAccess(PERMISSION_SETS_SETTINGS, 'read'),
    validator('param', (value) => parseApiInput(PermissionSetParams, value)),
    async (context) => {
      const { key } = context.req.valid('param');
      if (!(await api.get(key))) throw notFound(key);
      const assignments = await api.listAssignments(key);
      return context.json({
        data: assignments,
        meta: { total: assignments.length },
      });
    },
  );
  routes.post(
    '/permissionSets/:key/assignments',
    settingsAccess(PERMISSION_SETS_SETTINGS, 'assign'),
    validator('param', (value) => parseApiInput(PermissionSetParams, value)),
    validator('json', (value) => parseApiInput(AssignPermissionSetBody, value)),
    async (context) => {
      const { key } = context.req.valid('param');
      const { id, subject } = context.req.valid('json');
      const input: AssignPermissionSetInput = {
        ...(id === undefined ? {} : { id }),
        subject,
        permissionSet: key,
      };
      api.assertWritable(key, 'assign');
      return context.json({ data: await api.assign(input) }, 201);
    },
  );
  routes.delete(
    '/permissionSets/:key/assignments/:assignmentId',
    settingsAccess(PERMISSION_SETS_SETTINGS, 'assign'),
    validator('param', (value) => parseApiInput(AssignmentParams, value)),
    async (context) => {
      const { key, assignmentId } = context.req.valid('param');
      const assignment = (await api.listAssignments(key)).find(
        (item) => item.id === assignmentId,
      );
      if (!assignment)
        throw new ApiError({
          status: 'NOT_FOUND',
          reason: 'ASSIGNMENT_NOT_FOUND',
          domain: AUTHORIZATION_ERROR_DOMAIN,
          message: `Assignment ${assignmentId} of Permission Set ${key} was not found.`,
        });
      api.assertWritable(key, 'revoke');
      await api.revoke(assignmentId);
      return context.body(null, 204);
    },
  );
  routes.get(
    '/permissionSets/:key',
    settingsAccess(PERMISSION_SETS_SETTINGS, 'read'),
    validator('param', (value) => parseApiInput(PermissionSetParams, value)),
    async (context) => {
      const { key } = context.req.valid('param');
      const permissionSet = await api.get(key);
      if (!permissionSet) throw notFound(key);
      return context.json({ data: summarize(api, permissionSet) });
    },
  );
  routes.patch(
    '/permissionSets/:key',
    settingsAccess(PERMISSION_SETS_SETTINGS, 'update'),
    validator('param', (value) => parseApiInput(PermissionSetParams, value)),
    validator('json', (value) => parseApiInput(UpdatePermissionSetBody, value)),
    async (context) => {
      const { key } = context.req.valid('param');
      const existing = await api.get(key);
      if (!existing) throw notFound(key);
      const changes = context.req.valid('json');
      const input = permissionSetInput({
        key: changes.key ?? existing.key,
        title: changes.title === undefined ? existing.title : changes.title,
        grants: changes.grants ?? existing.grants,
      });
      validateGrants(host, input);
      // Stored grants are checked only when the body replaces them, so a title change still saves a set whose grants a
      // later schema change invalidated; startup reports those.
      if (changes.grants !== undefined)
        await validateWriteGrants(host, input.grants);
      api.assertWritable(key, 'update');
      if (input.key !== key)
        for (const candidate of [key, input.key]) {
          const protection = api.protection(candidate);
          if (protection)
            throw new PermissionSetProtectedError(
              candidate,
              protection.owner,
              'update',
            );
        }
      return context.json({
        data: summarize(api, await api.update(key, input)),
      });
    },
  );
  routes.delete(
    '/permissionSets/:key',
    settingsAccess(PERMISSION_SETS_SETTINGS, 'delete'),
    validator('param', (value) => parseApiInput(PermissionSetParams, value)),
    async (context) => {
      const { key } = context.req.valid('param');
      api.assertWritable(key, 'delete');
      if (!(await api.get(key))) throw notFound(key);
      await api.delete(key);
      return context.body(null, 204);
    },
  );
  return createRouteHandler(routes);
}

function summarize(
  api: Api,
  permissionSet: PermissionSet,
): PermissionSetSummary {
  const protection = api.protection(permissionSet.key);
  return {
    ...permissionSet,
    ...(protection === undefined ? {} : { protection }),
    ...(protection?.unrestricted ? { unrestricted: true } : {}),
  };
}

/**
 * A composite grant's data scope values must name record access that exists
 * and applies to the scope's target; the composite registry checks the rest.
 */
function validateGrants(
  host: {
    compositeResources: CompositeResourceApi;
    recordAccess: RecordAccessRegistry;
  },
  input: CreatePermissionSetInput,
): void {
  for (const grant of input.grants) {
    if (grant.resource.type !== 'composite') continue;
    for (const entry of grant.actions) {
      const action = host.compositeResources.getAction(
        grant.resource.id,
        entry.action,
      );
      if (!action)
        throw new TypeError(
          `Unknown composite resource action: ${grant.resource.id}.${entry.action}`,
        );
      const scopes: unknown = entry.policy?.scopes;
      if (entry.policy === undefined) continue;
      if (
        entry.policy.type !== 'composite' ||
        !scopes ||
        typeof scopes !== 'object' ||
        Array.isArray(scopes)
      )
        throw new TypeError('Invalid composite resource grant policy');
      for (const [key, value] of Object.entries(scopes)) {
        const scope = action.dataScopes?.find((item) => item.key === key);
        if (!scope) throw new TypeError(`Unknown data scope: ${key}`);
        const recordAccess: unknown =
          typeof value === 'string'
            ? value
            : value &&
                typeof value === 'object' &&
                Reflect.get(value, 'type') === 'recordAccess'
              ? Reflect.get(value, 'key')
              : undefined;
        if (recordAccess === undefined) continue;
        const target = dataScopeTarget(action, key).id;
        const definition =
          typeof recordAccess === 'string'
            ? host.recordAccess.get(recordAccess)
            : undefined;
        if (
          !definition ||
          !definition.collections.some(
            (name) => name === '*' || name === target,
          ) ||
          (scope.options && !scope.options.includes(definition.key))
        )
          throw new TypeError('Unknown or inapplicable record access');
      }
    }
  }
}

/**
 * A `database.collection` create or update grant may name only fields and relations a write can use; otherwise every
 * write it allows would fail. Answers `400 INVALID_ARGUMENT` with one field violation per offending member.
 */
async function validateWriteGrants(
  host: Pick<AuthorizationExtensionHost, 'database'>,
  grants: readonly PermissionGrant[],
): Promise<void> {
  const checker = databaseHost(host.database);
  if (!checker) return;
  const violations = await databaseGrantViolations(checker, grants);
  if (!violations.length) return;
  throw new ApiError({
    status: 'INVALID_ARGUMENT',
    reason: 'INVALID_AUTHORIZATION_INPUT',
    domain: AUTHORIZATION_ERROR_DOMAIN,
    message: `A create or update grant names fields or relations a write cannot use: ${violations[0].description}`,
    fieldViolations: violations,
  });
}

/** The validated body as the Permission Set API takes it; a cleared title is omitted. */
function permissionSetInput(body: {
  readonly key: string;
  readonly title?: AuthorizationTitle | null | undefined;
  readonly grants: readonly PermissionGrant[];
}): CreatePermissionSetInput {
  const title = parseAuthorizationTitle(body.title);
  return {
    key: body.key,
    ...(title === undefined ? {} : { title }),
    grants: body.grants.map((grant) => ({
      resource: { type: grant.resource.type, id: grant.resource.id },
      actions: grant.actions.map(({ action, policy }) =>
        policy === undefined ? { action } : { action, policy },
      ),
    })),
  };
}
