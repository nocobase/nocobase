# Bind generated Repository routes to composite actions

Use `authz.database.authorizeRepository({ repository, resource, actions })` for simple single-collection business operations. Keep `defineRepositoryApiRoutes({ repositories })`, its static `policy`, and its enabled `actions` unchanged. The authorization middleware adds a request constraint; the router intersects it with the static policy or principal-derived policy before executing. It does not grant fields missing from either policy.

`repository` is the exposure name, `resource` is a typed composite reference, and `actions` maps Repository methods to declared composite action names. No additional collection CRUD grant is required. Register the collections and composite in the provider first, then configure business grants and scopes through seed/backend. The middleware itself registers and assigns nothing. A method with no mapping, or a decision without exactly that collection's policy, answers `403 PERMISSION_DENIED` in the standard error body, reason `AUTHORIZATION_DENIED`, domain `authorization`.

## Choose the route boundary

Use the shortcut when one generated Repository operation completes the business action, the action has exactly one data scope on the default connection, and the standard Repository input/output fits the client. Independent input validation such as allowed keys, types and lengths can remain middleware. A single table alone is not enough: an operation that checks persisted workflow state, coordinates records or performs side effects needs a custom business handler.

| Business requirement                                                            | Integration                                                           | Reason                                                                                              |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Read project records or edit project title/notes                                | `defineRepositoryApiRoutes` with `authz.database.authorizeRepository` | One project scope, standard query/update, independent input validation                              |
| Show project/quote/order lists with navigation and per-record operation reasons | Custom read handler                                                   | Compose authorized data and business presentation; a raw query endpoint may coexist                 |
| Edit a draft quote                                                              | Custom business handler                                               | Validate persisted draft state and include expected state in the write predicate                    |
| Submit a quote                                                                  | Custom business handler                                               | Authorize the quote and its actual parent project, validate amount/state, then conditionally update |
| Arrange order relations or confirm delivery                                     | Custom business handler                                               | Enforce relation capabilities, eligible targets and order state or delivery-reference rules         |

Both paths use the same code-defined composites and administrator-editable grants/scopes initialized through seeds when needed. Choosing generated CRUD does not introduce another permission model or require separate collection CRUD grants. Choose per action: one resource can expose simple actions through Repository routes and complex actions through custom endpoints.

For custom endpoints, install authentication and `authz.middleware()`, call `c.var.authz.authorize({ resource, action })` once, reject denial or missing table policies, and bind every returned `conditions.database` policy with `repository.withPolicy()`. Read the actual related records through those policies, validate business rules and keep coordinated writes transactional with expected-state predicates. Follow the complete [business module workflow](business-module.md). Do not select one policy from a multi-scope decision or split an atomic business action into independent CRUD requests merely to fit the shortcut.

## Complete example

The application-owned declaration can be defined as follows in `server/sales-resources.ts`; use the customer's real collection name and translated labels. Register the collection and `projectResource` (with `authz.database.collections.add` and `authz.compositeResources.define`) in the provider before router creation, and list the composite in the `sales` workspace subsection with `authz.ui.sections.add` and `authz.ui.place`. Use the same collection name in the route module.

```ts
import { defineCompositeResource } from '@nocobase/authorization/core';
import { defineDatabasePermission } from '@nocobase/app-plugin-authorization/server';

const projectData = defineDatabasePermission((p) =>
  p
    .collection('projects')
    .read(['id', 'title', 'region', 'ownerId', 'confidential', 'notes']),
);

export const projectResource = defineCompositeResource(
  'sales.projects',
  (resource) =>
    resource
      .title('Projects')
      .action('view', (action) => action.grant('projects', projectData))
      .action('edit', (action) =>
        action.grant('projects', projectData.update(['title', 'notes'])),
      ),
);
```

The project resource declares `view` with project read fields and `edit` with read plus update of `title` and `notes`, both under one `projects` scope. The following route module imports that application-owned declaration. The route factory owns authentication and the body limit; register its exported contribution in the App's server routes.

```ts
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  ApiError,
  defineApiRoutes,
  defineRepositoryApiRoutes,
} from '@nocobase/app-server/router';
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';

import { projectResource } from '../sales-resources.js';
import { editableValues, invalidInput } from './mutations.js';

const repositoryRoutes = defineRepositoryApiRoutes({
  repositories: [
    {
      name: 'salesProjects',
      collection: 'projects',
      policy: {
        read: {
          scope: true,
          fields: ['id', 'title', 'region', 'ownerId', 'confidential', 'notes'],
        },
        update: { scope: true, fields: ['title', 'notes'] },
        create: false,
        delete: false,
      },
      actions: {
        findMany: { maxLimit: 100 },
        findOne: {},
        count: {},
        updateOne: {},
      },
    },
  ],
});

export async function createProjectRoutes(
  app: AppPluginApplication,
): Promise<Hono> {
  const authz = app.container.resolve(authorizationToken);
  const router = new Hono<AuthorizationEnv>();

  router.use(
    '*',
    app.container.resolve(authenticationToken).required(),
    bodyLimit({ maxSize: 4096 }),
    authz.database.authorizeRepository({
      repository: 'salesProjects',
      resource: projectResource.reference(),
      actions: {
        findMany: 'view',
        findOne: 'view',
        count: 'view',
        updateOne: 'edit',
      },
    }),
  );

  router.use('/salesProjects/updateOne', async (c, next) => {
    // Leave the original stream for the Repository body limit and parser.
    const body: unknown = await c.req.raw
      .clone()
      .json()
      .catch(() => {
        throw invalidInput('The request body is not valid JSON.');
      });
    if (!body || typeof body !== 'object' || Array.isArray(body))
      throw invalidInput('Expected update input.');

    editableValues(Reflect.get(body, 'values'), ['title', 'notes']);
    await next();
  });

  router.route('/', await repositoryRoutes.createRouter(app));
  return new Hono().route('/', router);
}

export default [defineApiRoutes<AppPluginApplication>(createProjectRoutes)];
```

The route's local `editableValues` helper validates project input without changing it, and throws `ApiError` so the failure is answered in the standard error body. Place it in `server/routes/mutations.ts` (or inline it in an App-owned module):

```ts
import { ApiError } from '@nocobase/app-server/router';

export function invalidInput(message: string, field?: string): ApiError {
  return new ApiError({
    status: 'INVALID_ARGUMENT',
    reason: 'INVALID_INPUT',
    domain: 'sales',
    message,
    ...(field ? { fieldViolations: [{ field, description: message }] } : {}),
  });
}

export function editableValues(body: unknown, fields: readonly string[]): void {
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    !Object.keys(body).length
  )
    throw invalidInput('Expected fields.', 'values');

  for (const [key, value] of Object.entries(body)) {
    if (
      !fields.includes(key) ||
      typeof value !== 'string' ||
      value.length > 500
    )
      throw invalidInput('Invalid project field.', `values.${key}`);
  }
}
```

Use App-owned collection/resource modules. This `server/routes/projects.ts` contribution exposes paths relative to the App API base; if the App adds a route prefix, use that same prefix in client requests. The resource declaration uses `defineCompositeResource` and `defineDatabasePermission`, described in the bundled runtime and fluent references. Do not import private files from an installed example package.

The resulting endpoints are `POST /api/salesProjects/findMany`, `/api/salesProjects/findOne`, `/api/salesProjects/count` and `/api/salesProjects/updateOne`. Update input is `{ filter: { id }, values: { notes } }`; the response is Repository's `{ data }` envelope containing the updated record. Hidden/out-of-scope update targets return 404; missing action grants return 403; branch on `error.reason`, never on `message`. Client code should refresh data and handle both outcomes. Reading a cloned request in validation leaves the original stream available for the generated route's body-size check and parser; install a body limit before custom validation too. Validation failures answer `400 INVALID_ARGUMENT` with reason `INVALID_INPUT` and the field in `fieldViolations`.

## Enforcement and limits

- Mount the middleware on every action of the named exposure. Using `'*'` is appropriate inside an isolated, owned router: the middleware ignores other repository names. A method of its repository with no mapping is denied, including methods added to the generated route later.
- The middleware reuses the request's existing authorization context or initializes one. Authentication is still the owning route's responsibility.
- Each bound action must declare exactly one data scope, compose grants on that collection only and contain the mapped CRUD operation. Multi-collection or same-collection multi-scope actions are rejected at integration time. Resource registration must precede router creation.
- One composite can be bound to several Repository exposures through separate middleware instances. Each mapping is checked at the action level. An exposure's actual collection and database connection must match the request constraint; this adapter currently supports the default connection only.
- Keep actions requiring workflow state, cross-record relationships, or side effects in custom handlers. Single-scope authorization does not prove that an operation needs no business validation. Quote editing/submission and delivery remain custom in the sales workflow.
- Original Repository routes without this middleware retain their original policy behavior. Middleware must not be omitted from a protected exposure.
