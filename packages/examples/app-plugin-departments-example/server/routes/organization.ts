import {
  authenticationToken,
  userAdministrationServiceToken,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AppAuthorization,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  ApiError,
  apiErrorHandler,
  defineApiRoutes,
  parseApiInput,
  type ApiErrorStatus,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono, type Context, type MiddlewareHandler } from 'hono';
import { validator } from 'hono/validator';

import { DEPARTMENTS_SETTINGS } from '../resources.js';
import {
  OrganizationError,
  organizationServiceToken,
  type Department,
  type DirectMember,
  type OrganizationErrorCode,
} from '../tokens.js';
import {
  AddMemberInput,
  CreateDepartmentInput,
  DepartmentParams,
  MemberCandidatesQuery,
  MemberParams,
  UpdateDepartmentInput,
} from './schemas.js';

/** A department as the API answers it: the head's display name travels with its id. */
interface DepartmentView extends Department {
  readonly manager: {
    readonly id: string;
    readonly title: string;
    readonly description?: string;
  } | null;
}

/** The plugin's URL namespace, which is also the domain of every error it reports. */
export const DEPARTMENTS_EXAMPLE_DOMAIN = 'departmentsExample';

const STATUS: Record<OrganizationErrorCode, ApiErrorStatus> = {
  DEPARTMENT_NOT_FOUND: 'NOT_FOUND',
  MEMBER_NOT_FOUND: 'NOT_FOUND',
  DEPARTMENT_EXISTS: 'ALREADY_EXISTS',
  PARENT_NOT_FOUND: 'INVALID_ARGUMENT',
  PARENT_CYCLE: 'INVALID_ARGUMENT',
  USER_NOT_FOUND: 'INVALID_ARGUMENT',
  INVALID_INPUT: 'INVALID_ARGUMENT',
};

/**
 * The body field an error refers to, when it names a record the body referenced rather than the one in the path.
 * A missing user is the new member's `userId` when adding a member, and the head's `managerId` everywhere else.
 */
function violatedField(
  code: OrganizationErrorCode,
  c: Context,
): string | undefined {
  if (code === 'PARENT_NOT_FOUND' || code === 'PARENT_CYCLE') return 'parentId';
  if (code === 'USER_NOT_FOUND')
    return c.req.method === 'POST' && c.req.path.endsWith('/members')
      ? 'userId'
      : 'managerId';
  return undefined;
}

function toDepartmentsApiError(error: OrganizationError, c: Context): ApiError {
  const field = violatedField(error.code, c);
  return new ApiError({
    status: STATUS[error.code],
    reason: error.code,
    domain: DEPARTMENTS_EXAMPLE_DOMAIN,
    message: error.message,
    ...(field
      ? { fieldViolations: [{ field, description: error.message }] }
      : {}),
    cause: error,
  });
}

/**
 * Require the Departments settings action before anything about the request is looked at. Mounted ahead of
 * `validator()`, so a caller without it is answered 403 whatever its input holds and whether or not the department
 * exists.
 */
function requireSettings(
  action: 'read' | 'update',
): MiddlewareHandler<AuthorizationEnv> {
  return async (c, next) => {
    await c.get('authz').require({
      resource: { type: 'settings', id: DEPARTMENTS_SETTINGS },
      action,
    });
    await next();
  };
}

/** Drops the keys a client omitted, so an omitted field and an explicit `null` stay different. */
function defined<T extends object>(
  value: T,
): { [K in keyof T]: Exclude<T[K], undefined> } {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as { [K in keyof T]: Exclude<T[K], undefined> };
}

/**
 * The Departments settings API under `/api/departmentsExample`. Every route authenticates and authorizes on its
 * own sub-router. Errors are `ApiError`s in the `departmentsExample` domain; the client translates their `reason`.
 */
export function createOrganizationRoutes(
  app: AppPluginApplication,
): Hono<AuthorizationEnv> {
  const { container } = app;
  const auth = container.resolve(authenticationToken);
  const authz: AppAuthorization = container.resolve(authorizationToken);
  const organization = container.resolve(organizationServiceToken);
  const users = container.resolve(userAdministrationServiceToken);

  // Clients cache their permission snapshot; tell each affected user after the membership write has committed.
  async function refreshUsers(userIds: readonly string[]): Promise<void> {
    for (const id of new Set(userIds))
      await authz.permissionSets.notifyAssignmentsChanged({ type: 'user', id });
  }

  // Heads are read through the user directory, one page per hundred distinct heads.
  async function withManagers(
    departments: readonly Department[],
  ): Promise<DepartmentView[]> {
    const ids = [
      ...new Set(
        departments
          .map((department) => department.managerId)
          .filter((id): id is string => id !== null),
      ),
    ];
    const names = new Map<string, { title: string; description?: string }>();
    for (let offset = 0; offset < ids.length; offset += 100) {
      const page = await users.list({
        userIds: ids.slice(offset, offset + 100),
        page: 1,
        pageSize: 100,
      });
      for (const user of page.items)
        names.set(user.id, { title: user.name, description: user.email });
    }
    return departments.map((department) => {
      const name =
        department.managerId === null
          ? undefined
          : names.get(department.managerId);
      return {
        ...department,
        manager:
          department.managerId === null
            ? null
            : {
                id: department.managerId,
                ...(name ?? { title: department.managerId }),
              },
      };
    });
  }

  async function memberView(
    departmentId: string,
    userId: string,
  ): Promise<DirectMember> {
    const member = (await organization.directMembers(departmentId)).find(
      (entry) => entry.userId === userId,
    );
    if (!member)
      throw new OrganizationError(
        'MEMBER_NOT_FOUND',
        `User "${userId}" is not a member of "${departmentId}".`,
      );
    return member;
  }

  async function departmentView(id: string): Promise<DepartmentView> {
    const department = await organization.getDepartment(id);
    if (!department)
      throw new OrganizationError(
        'DEPARTMENT_NOT_FOUND',
        `Department "${id}" does not exist.`,
      );
    const [view] = await withManagers([department]);
    return view;
  }

  const routes = new Hono<AuthorizationEnv>();
  routes.use('*', auth.required(), authz.middleware());
  // A denied `require` answers 403 on its own; only this plugin's errors need translating.
  routes.onError((error, c) =>
    apiErrorHandler(
      error instanceof OrganizationError
        ? toDepartmentsApiError(error, c)
        : error,
      c,
    ),
  );

  const departmentParams = validator('param', (value) =>
    parseApiInput(DepartmentParams, value),
  );
  const memberParams = validator('param', (value) =>
    parseApiInput(MemberParams, value),
  );

  const read = requireSettings('read');
  const update = requireSettings('update');

  routes.get('/departments', read, async (c) => {
    const departments = await withManagers(await organization.listTree());
    return c.json({ data: departments, meta: { total: departments.length } });
  });

  routes.post(
    '/departments',
    update,
    validator('json', (value) => parseApiInput(CreateDepartmentInput, value)),
    async (c) => {
      const department = await organization.createDepartment(
        defined(c.req.valid('json')),
      );
      // A head appointed with the department gains its scope.
      if (department.managerId !== null)
        await refreshUsers([department.managerId]);
      const [view] = await withManagers([department]);
      return c.json({ data: view }, 201);
    },
  );

  // Candidates for a new membership: enabled users, searched and paged by the user directory.
  routes.get(
    '/memberCandidates',
    update,
    validator('query', (value) => parseApiInput(MemberCandidatesQuery, value)),
    async (c) => {
      const { q, page, pageSize } = c.req.valid('query');
      const result = await users.list({
        page,
        pageSize,
        status: 'enabled',
        ...(q ? { search: q } : {}),
      });
      return c.json({
        data: result.items.map((user) => ({
          id: user.id,
          title: user.name,
          description: user.email,
        })),
        meta: { page, pageSize, total: result.total },
      });
    },
  );

  routes.get(
    '/departments/:departmentId',
    read,
    departmentParams,
    async (c) => {
      return c.json({
        data: await departmentView(c.req.valid('param').departmentId),
      });
    },
  );

  routes.patch(
    '/departments/:departmentId',
    update,
    departmentParams,
    validator('json', (value) => parseApiInput(UpdateDepartmentInput, value)),
    async (c) => {
      const result = await organization.updateDepartment(
        c.req.valid('param').departmentId,
        defined(c.req.valid('json')),
      );
      // Members whose inheritance moved, and the old and new heads.
      await refreshUsers(result.changed);
      const [view] = await withManagers([result.department]);
      return c.json({ data: view });
    },
  );

  // Activation is a custom method rather than a field update: it changes whose inherited scope applies across the
  // whole subtree.
  for (const [verb, active] of [
    ['activate', true],
    ['deactivate', false],
  ] as const) {
    routes.post(
      `/departments/:departmentId/${verb}`,
      update,
      departmentParams,
      async (c) => {
        const { departmentId } = c.req.valid('param');
        await refreshUsers(await organization.setActive(departmentId, active));
        return c.json({ data: await departmentView(departmentId) });
      },
    );
  }

  routes.get(
    '/departments/:departmentId/members',
    read,
    departmentParams,
    async (c) => {
      const members = await organization.directMembers(
        c.req.valid('param').departmentId,
      );
      return c.json({ data: members, meta: { total: members.length } });
    },
  );

  routes.post(
    '/departments/:departmentId/members',
    update,
    departmentParams,
    validator('json', (value) => parseApiInput(AddMemberInput, value)),
    async (c) => {
      const { departmentId } = c.req.valid('param');
      const input = c.req.valid('json');
      await refreshUsers(
        await organization.addMember({ departmentId, ...defined(input) }),
      );
      return c.json(
        { data: await memberView(departmentId, input.userId) },
        201,
      );
    },
  );

  routes.delete(
    '/departments/:departmentId/members/:userId',
    update,
    memberParams,
    async (c) => {
      const { departmentId, userId } = c.req.valid('param');
      await refreshUsers(await organization.removeMember(departmentId, userId));
      return c.body(null, 204);
    },
  );

  routes.post(
    '/departments/:departmentId/members/:userId/makePrimary',
    update,
    memberParams,
    async (c) => {
      const { departmentId, userId } = c.req.valid('param');
      await refreshUsers(await organization.setPrimary(departmentId, userId));
      return c.json({ data: await memberView(departmentId, userId) });
    },
  );

  return routes;
}

export const organizationRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes((app) => {
    const router = new Hono();
    router.route('/departmentsExample', createOrganizationRoutes(app));
    return router;
  });
