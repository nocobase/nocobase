import {
  ApiError,
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  describeRoute,
  emptyResponse,
  listResponse,
} from '@nocobase/app-server/router';
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
  settingsAccess,
} from '../extension/http.js';
import { databaseHost } from '../database/api.js';
import { databaseGrantViolations } from '../database/grant-validation.js';
import {
  AuthorizationOptionsSchema,
  TotalMetaSchema,
} from '../extension/schemas.js';
import {
  AUTHORIZATION_API_TAGS as tags,
  createSubjectRoutes,
} from '../extension/options.js';
import type { AuthorizationExtensionHost } from '../host.js';
import { authorizationOptions } from '../options.js';
import {
  AssignmentParams,
  AssignPermissionSetBody,
  CreatePermissionSetBody,
  ListPermissionSetsQuery,
  PermissionSetAssignmentSchema,
  PermissionSetParams,
  PermissionSetSchema,
  UpdatePermissionSetBody,
} from './schemas.js';

const protectedDescription =
  'Answers `400 FAILED_PRECONDITION` with reason `PROTECTED_PERMISSION_SET` when the set’s protection forbids the change.';

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
  const notFound = (key: string) =>
    new ApiError({
      status: 'NOT_FOUND',
      reason: 'PERMISSION_SET_NOT_FOUND',
      domain: AUTHORIZATION_ERROR_DOMAIN,
      message: `Permission Set ${key} was not found.`,
    });

  // Fixed segments are registered before `/permissionSets/:key`, which would otherwise match them.
  routes.get(
    '/permissionSets/options',
    settingsAccess(PERMISSION_SETS_SETTINGS, 'read'),
    describeRoute({
      tags,
      summary: 'List what a Permission Set can grant',
      operationId: 'authorizationListPermissionSetOptions',
      description:
        'The workspace catalogue: sections, subsections and the grantable resources in each, with the subject types, record access definitions and collections the Permission Set settings page offers. Requires `settings:authorization.permission-sets` `read`.',
      responses: {
        200: dataResponse(AuthorizationOptionsSchema),
        ...apiErrorResponses,
      },
    }),
    async (context) => context.json({ data: await authorizationOptions(host) }),
  );
  routes.route(
    '/',
    createSubjectRoutes(
      host,
      '/permissionSets',
      PERMISSION_SETS_SETTINGS,
      'read',
      'PermissionSet',
    ),
  );
  routes.get(
    '/permissionSets',
    settingsAccess(PERMISSION_SETS_SETTINGS, 'read'),
    describeRoute({
      tags,
      summary: 'List Permission Sets',
      operationId: 'authorizationListPermissionSets',
      description:
        'Every Permission Set, or with `subjectType` and `subjectId` (given together) only the sets that subject holds, including the default sets every subject holds. A bounded configuration list: it is not paged. Requires `settings:authorization.permission-sets` `read`.',
      responses: {
        200: listResponse(PermissionSetSchema, TotalMetaSchema),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', ListPermissionSetsQuery),
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
      // A hidden set is its owner's implementation detail (an API key's own grants, say): not listed here.
      const sets = (
        principal ? await api.getEffective({ principal }) : await api.list()
      ).filter((set) => !api.protection(set.key)?.hidden);
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
    describeRoute({
      tags,
      summary: 'Create a Permission Set',
      operationId: 'authorizationCreatePermissionSet',
      description: `A grant the registered resource types do not accept answers \`400\` with reason \`INVALID_AUTHORIZATION_INPUT\`, naming each offending field where it can. ${protectedDescription} Requires \`settings:authorization.permission-sets\` \`create\`.`,
      responses: {
        201: dataResponse(PermissionSetSchema, 'The created Permission Set.'),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'A grant the registered resource types do not accept (`INVALID_AUTHORIZATION_INPUT`), or the set’s protection forbids creating it (`PROTECTED_PERMISSION_SET`).',
        ),
        409: apiErrorResponse(
          409,
          'A Permission Set with this key already exists (`PERMISSION_SET_CONFLICT`).',
        ),
      },
    }),
    apiValidator('json', CreatePermissionSetBody),
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
    describeRoute({
      tags,
      summary: 'List the assignments of a Permission Set',
      operationId: 'authorizationListPermissionSetAssignments',
      description:
        'The subjects the set is assigned to. A bounded configuration list: it is not paged. Requires `settings:authorization.permission-sets` `read`.',
      responses: {
        200: listResponse(PermissionSetAssignmentSchema, TotalMetaSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(
          404,
          'The Permission Set does not exist (`PERMISSION_SET_NOT_FOUND`).',
        ),
      },
    }),
    apiValidator('param', PermissionSetParams),
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
    describeRoute({
      tags,
      summary: 'Assign a Permission Set to a subject',
      operationId: 'authorizationAssignPermissionSet',
      description: `\`id\` optionally names the new assignment. A subject type the set may not be assigned to answers \`400\` with reason \`PERMISSION_SET_SUBJECT_NOT_ALLOWED\`. ${protectedDescription} Requires \`settings:authorization.permission-sets\` \`assign\`.`,
      responses: {
        201: dataResponse(
          PermissionSetAssignmentSchema,
          'The created assignment.',
        ),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The set may not be assigned to this subject type (`PERMISSION_SET_SUBJECT_NOT_ALLOWED`), or its protection forbids the assignment (`PROTECTED_PERMISSION_SET`).',
        ),
        404: apiErrorResponse(
          404,
          'The Permission Set does not exist (`PERMISSION_SET_NOT_FOUND`).',
        ),
        409: apiErrorResponse(
          409,
          'The assignment already exists (`PERMISSION_SET_CONFLICT`).',
        ),
      },
    }),
    apiValidator('param', PermissionSetParams),
    apiValidator('json', AssignPermissionSetBody),
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
    describeRoute({
      tags,
      summary: 'Revoke an assignment of a Permission Set',
      operationId: 'authorizationRevokePermissionSetAssignment',
      description: `Revoking the last assignment of a set the application must keep in use answers \`400 FAILED_PRECONDITION\` with reason \`LAST_ASSIGNMENT\`. ${protectedDescription} Requires \`settings:authorization.permission-sets\` \`assign\`.`,
      responses: {
        204: emptyResponse('The assignment was revoked.'),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The set must keep at least one assignment (`LAST_ASSIGNMENT`), or its protection forbids revoking it (`PROTECTED_PERMISSION_SET`).',
        ),
        404: apiErrorResponse(
          404,
          'The Permission Set has no assignment with this id (`ASSIGNMENT_NOT_FOUND`).',
        ),
      },
    }),
    apiValidator('param', AssignmentParams),
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
    describeRoute({
      tags,
      summary: 'Get a Permission Set',
      operationId: 'authorizationGetPermissionSet',
      description: 'Requires `settings:authorization.permission-sets` `read`.',
      responses: {
        200: dataResponse(PermissionSetSchema),
        ...apiErrorResponses,
        404: apiErrorResponse(
          404,
          'The Permission Set does not exist (`PERMISSION_SET_NOT_FOUND`).',
        ),
      },
    }),
    apiValidator('param', PermissionSetParams),
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
    describeRoute({
      tags,
      summary: 'Update a Permission Set',
      operationId: 'authorizationUpdatePermissionSet',
      description: `Changes only the fields the body names: \`key\` renames the set, \`title: null\` clears its title and \`grants\` replaces every grant. A protected set cannot be renamed. ${protectedDescription} Requires \`settings:authorization.permission-sets\` \`update\`.`,
      responses: {
        200: dataResponse(PermissionSetSchema),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'A grant the registered resource types do not accept (`INVALID_AUTHORIZATION_INPUT`), or the set’s protection forbids the change (`PROTECTED_PERMISSION_SET`).',
        ),
        404: apiErrorResponse(
          404,
          'The Permission Set does not exist (`PERMISSION_SET_NOT_FOUND`).',
        ),
        409: apiErrorResponse(
          409,
          'Another Permission Set already uses the new key (`PERMISSION_SET_CONFLICT`).',
        ),
      },
    }),
    apiValidator('param', PermissionSetParams),
    apiValidator('json', UpdatePermissionSetBody),
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
    describeRoute({
      tags,
      summary: 'Delete a Permission Set',
      operationId: 'authorizationDeletePermissionSet',
      description: `${protectedDescription} Requires \`settings:authorization.permission-sets\` \`delete\`.`,
      responses: {
        204: emptyResponse('The Permission Set was deleted.'),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The set’s protection forbids deleting it (`PROTECTED_PERMISSION_SET`).',
        ),
        404: apiErrorResponse(
          404,
          'The Permission Set does not exist (`PERMISSION_SET_NOT_FOUND`).',
        ),
      },
    }),
    apiValidator('param', PermissionSetParams),
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
