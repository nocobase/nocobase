# Runtime integration and API

Snippet variables such as `app`, `database`, `userId` and `input` are supplied by the owning App; declarations and route bodies belong in separate files as indicated. The package README at `node_modules/@nocobase/app-plugin-authorization/README.md` lists every export and HTTP route; this reference shows how the pieces fit a feature.

## Installation and service

Register this package's default `client` and `server` exports in the application's plugin composition roots, after authentication. Apply application migrations and seeds. Resolve `authorizationToken` in a provider or route factory; it is the only token, and there is one instance per application.

```ts
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
const authz = app.container.resolve(authorizationToken);
```

`authz` is an `AppAuthorization`: the library's `Authorization` plus `permissionSets`, `database`, `pages`, `settings` and `business`, and whatever the configured rule plugins add. `AuthorizationConfig.permissionSets` names the platform's root and default sets; business features leave those to the platform owner. `AuthorizationConfig.plugins` lists optional rule factories, documented only in their owning Skills; follow [capability discovery](optional-capabilities.md) before adding one.

Client registration calls factories; server registration uses the exported declarations. Merge these entries into existing lists rather than replacing other plugins:

```ts
// client/plugins.ts
import { defineClientPlugins } from '@nocobase/app-client/plugins';
import authentication from '@nocobase/app-plugin-authentication/client';
import authorization from '@nocobase/app-plugin-authorization/client';
export default defineClientPlugins([authentication(), authorization()]);
```

```ts
// server/plugins.ts
import { defineServerPlugins } from '@nocobase/app-server/plugins';
import authentication from '@nocobase/app-plugin-authentication/server';
import authorization from '@nocobase/app-plugin-authorization/server';
export default defineServerPlugins([authentication, authorization]);
```

## API map

| Export or surface                                                                                      | Purpose                                                                                                       |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `./server`: `authorizationToken`                                                                       | Resolve the application's `AppAuthorization`                                                                  |
| `./server`: `defineDatabasePermission`, `recordAccess`, `condition`                                    | Typed collection permissions, the built-in record access and record access filters                            |
| `@nocobase/authorization/core`: `defineCompositeResource`, `defineRecordAccess`, `selection`           | Composite resources, custom record access and rule selections                                                 |
| `authz.middleware()`, `authz.for(identity)`                                                            | The request's `AuthorizationContext`; see [request checks](core-api.md)                                       |
| `authz.permissionSets`                                                                                 | Definitions, assignments, protection and transactions; see [permission sets](core-api.md#permission-sets)     |
| `authz.ui.sections.add`, `authz.ui.groups.add`, `authz.ui.place(reference, { section, group? })`       | Workspace sections, subsections and groups, and where each composite or settings item is listed; display only |
| `authz.compositeResources.define(resource)`                                                            | Register a composite resource; returns a `CompositeResourceReference`                                         |
| `authz.recordAccess.define(access)`                                                                    | Register a named way to select records                                                                        |
| `authz.database.collections.add(definition)`                                                           | Opt a collection into the permission model                                                                    |
| `authz.database.policyFor(collection, context, operation?)`                                            | Fold the CRUD decisions of one collection into a `RepositoryPolicy`                                           |
| `authz.database.authorizeRepository({ repository, resource, actions })`                                | Middleware binding Repository methods to composite actions                                                    |
| `authz.settings.add(item)`, `authz.settings.grant(id, actions)`                                        | Register a settings item and build a grant of it                                                              |
| `authz.pages.grant(id)`                                                                                | Build a page `access` grant; pages come from the client route tree                                            |
| `./client`: `useCan`, `useAuthorizationClient`, `authorizationClientToken`, `useAuthorizationRevision` | Session-aware visibility checks                                                                               |
| `./client/management`, `./server/extension`                                                            | Shared workspace components and HTTP helpers for plugins that add authorization settings screens              |

## Declare a business operation

A business operation is a composite resource. Use stable names (`sales.quotes`, `submit`) and a separate data scope key for every independently controlled collection; a data scope targets the one collection its grants name. Builders are immutable; return the builder from each callback. They perform no registration or persistence.

```ts
import { defineCompositeResource } from '@nocobase/authorization/core';
import { defineDatabasePermission } from '@nocobase/app-plugin-authorization/server';

interface Quote {
  id: string;
  projectId: string;
  preparedById: string;
  notes: string;
  amount: number;
  status: string;
}
interface Project {
  id: string;
  title: string;
}
const quoteData = defineDatabasePermission((p) =>
  p
    .collection<Quote>('quotes')
    .title('Quotes')
    .read(['id', 'projectId', 'preparedById', 'amount', 'status', 'notes']),
);
const projectData = defineDatabasePermission((p) =>
  p.collection<Project>('projects').title('Projects').read(['id', 'title']),
);
export const quotes = defineCompositeResource('sales.quotes', (r) =>
  r
    .title('Quotes')
    .action('view', (a) => a.title('View').grant('quotes', quoteData))
    .action('edit', (a) =>
      a.title('Edit').grant('quotes', quoteData.update(['amount', 'notes'])),
    )
    .action('submit', (a) =>
      a
        .title('Submit')
        .grant('quotes', quoteData.update(['status']))
        .grant('projects', projectData),
    ),
);

// In the owning provider's boot method:
authz.database.collections.add({ name: 'quotes', title: 'Quotes' });
authz.database.collections.add({ name: 'projects', title: 'Projects' });
const reference = authz.compositeResources.define(quotes);
authz.ui.sections.add({ name: 'sales', title: 'Sales', parent: 'business' });
authz.ui.place(reference, { section: 'sales' });
```

Every collection a business action touches must be registered, including for unrestricted users. Registration carries `name`, `title`, optional `description` and `actions` (default `read`, `create`, `update`, `delete`); field, primary-key and relation metadata comes from the database. Re-adding a collection with the same actions is a no-op, even with a different title or description: the first registration is kept and startup logs a warning. Different actions throw. Pages are not registered here: the client route that declares `authz: { resource: { type: 'page', id: 'sales.quotes' }, action: 'access' }` is what lists the page in the workspace.

`.grant(key, permission, { title? })` binds a collection permission to a data scope named `key`. Read fields govern output; create and update fields govern input. Use explicit lists, `'*'` or `.allFields()`; delete has no fields. A `create` or `update` list may name only fields a write can set; `'*'` resolves to exactly those. Include fields written by the server, such as timestamps. `.options(...recordAccessReferences)` limits the record access a grant may choose; `.default(reference)` sets the value used when a grant chooses nothing. Omitting options offers every registered record access that applies to the collection.

Use [code versus seeds](code-and-seeds.md) for the engineer permission set and its assignments, and [record access](business-module.md#3-register-record-access) for the preparer and region selections. Page access and business actions are independent; registration alone grants neither.

## Enforce the operation on the server

Every route installs authentication and `authz.middleware()`. For a business action, authorize once and bind every resulting collection policy before executing queries. Validate input and business transitions separately.

```ts
import { AuthorizationDeniedError } from '@nocobase/authorization/core';

router.use('*', authentication.required(), authz.middleware());
router.get('/quotes', async (c) => {
  const decision = await c.get('authz').authorize({
    resource: { type: 'composite', id: 'sales.quotes' },
    action: 'view',
  });
  const policy = decision.conditions?.database?.quotes;
  // The application answers it as 403 PERMISSION_DENIED in the standard error body.
  if (decision.effect === 'deny' || !policy)
    throw new AuthorizationDeniedError(decision);
  const records = await database
    .repository('quotes')
    .withPolicy(policy)
    .findMany();
  return c.json({ data: records });
});
```

A composite decision's `conditions` are `{ type: 'composite', checks, database }`: one `RepositoryPolicy` per composed collection, built from that action's grants only, and `checks` with the underlying decisions. A denied collection check yields `false` for that collection rather than denying the whole feature, and a Repository refuses to run under it; a granted check whose data scope selects nothing, such as a user in no department, yields a scope that matches no rows, so reads return an empty result without a special case. For `submit`, use both `conditions.database.quotes` and `.projects` inside the same transaction, check the quote's actual parent project through the project policy and include the expected state in the update predicate. Do not replace these policies with `authz.database.policyFor` without an operation: another action's grants could then widen access. `require` rejects conditional decisions; `can` does not enforce rows.

For a collection-oriented endpoint, fold the four CRUD decisions into one policy:

```ts
const policy = await authz.database.policyFor('quotes', c.get('authz'));
const repository = database.repository('quotes').withPolicy(policy);
await repository.updateOne({ filter: { id }, values: input });
```

The optional third argument `{ resource: 'sales.quotes', action: 'submit' }` restricts `policyFor` to one business action's branch. Prefer the single business decision when the operation spans several collections. Policies deny absent operations, constrain records in SQL and allow only granted fields and relations. Out-of-scope rows can surface as `RECORD_NOT_FOUND`; map repository errors consistently without leaking hidden records.

For generated Repository APIs, keep the `defineRepositoryApiRoutes` declaration and install `authz.database.authorizeRepository({ repository, resource: quotes.reference(), actions: { findMany: 'view', updateOne: 'edit' } })` after authentication. It binds each endpoint to one composite action and narrows its existing policy. See [Repository integration](repository-routes.md) for validation, responses and limits.

## Settings items

An administration surface is a settings item, not a composite. Register it in the owning provider, place it in an administration subsection, declare the same id on its settings route and check it on every endpoint:

```ts
authz.ui.sections.add({
  name: 'sales.admin',
  title: 'Sales',
  parent: 'administration',
});
authz.settings.add({
  id: 'sales.pricing',
  title: 'Pricing settings',
  actions: [{ name: 'read' }, { name: 'update' }],
});
authz.ui.place(
  { type: 'settings', id: 'sales.pricing' },
  { section: 'sales.admin' },
);

router.put('/sales/pricing', async (c) => {
  await c.get('authz').require({
    resource: { type: 'settings', id: 'sales.pricing' },
    action: 'update',
  });
  // ...
});
```

Choose semantic action names; `authz.settings.grant(id, actions)` and every check refuse an id or action nobody registered. The settings route declares `authz: { resource: { type: 'settings', id: 'sales.pricing' }, action: 'read' }`. Registering the item only makes it grantable; assign it through a permission set to activate it. See [client development](client-development.md) for the route and [code versus seeds](code-and-seeds.md) for initial grants.

## Management HTTP API

Paths are under `/api/authorization` and require a signed-in user; the complete table is in the package README, and the running application describes every route, with its request and response schemas and error statuses, at `/api/swagger/docs` (JSON at `/api/swagger`, for a signed-in user or a valid API key) under the `Authorization` tag. Permission sets are gated by `settings:authorization.permission-sets` with `read`, `create`, `update`, `delete` and `assign`; the inspector by `settings:authorization.inspector` with `inspect`; each rule plugin by its own `settings:authorization.<rule>` item with `read`, `create`, `update` and `delete`. `GET /api/authorization/permissions` answers the signed-in identity's snapshot. The settings check runs before input validation, so a caller without the permission gets `403` whatever the request holds. Success bodies are `{ data }`, paged subject lists add `meta: { page, pageSize, total }`, and failures use the standard error body with domain `authorization` (except `INVALID_INPUT`, domain `app`); branch on `error.reason`.

Creating a set (`POST /api/authorization/permissionSets`) sends a complete `{ key, title?, grants }`; updating one (`PATCH /api/authorization/permissionSets/:key`) sends only the fields that change, and `title: null` clears a title. An assignment sends `{ subject: { type, id } }`. Generic management honors protection: protected keys cannot be renamed (`400 FAILED_PRECONDITION`, reason `PROTECTED_PERMISSION_SET`), the default set's grants can be edited, and removing the last required root assignment answers `400 FAILED_PRECONDITION` with reason `LAST_ASSIGNMENT`. User-entered titles are strings; seeded titles may be `{ key, ns }` and are preserved on unrelated edits.

The inspector evaluates one subject, resource and action, with sources, reasons, fields and record conditions. Inspecting a user includes the authenticated audience and resolved memberships; inspecting a team describes that team's grants alone. It does not count accessible records.
