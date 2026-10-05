# @nocobase/app-plugin-authorization

NocoBase application integration for authorization: authenticated identities, Permission Sets, pages, settings, composite resources, database field, record and relation policies, the `/api/authorization` HTTP surface and the permission workspace UI. It builds on [`@nocobase/authorization`](../../libs/authorization/README.md), whose terms and contracts apply unchanged. For configuration without code, read the [user guide](../../../docs/docs/en/capabilities/authorization/index.md); for implementing a feature, read the [development Skill](skills/nocobase-app-plugin-authorization/SKILL.md).

## Terminology

| Term                  | Meaning                                                                                                                                                                                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Resource ref          | `{ type, id }`: the target of a check or a grant. Every grant states its type.                                                                                                                                                                                                                   |
| Resource type         | The only unit of judgement, never displayed and untitled: items, an authorize function and the `recordAccess` capability. This plugin registers `page`, `settings` and `database.collection` (with `recordAccess`); the core registers the reserved `composite` type itself.                     |
| Item                  | One grantable thing of a catalog type, `{ id, title, actions }`; an unregistered `(type, id, action)` is denied. A record type has no items and validates only the action.                                                                                                                       |
| Page                  | Record type `page`, action `access`. The server validates no page id; the client fills the `pages.page` subsection, which this plugin registers through `authz.ui`, and its resource groups from the route tree.                                                                                 |
| Settings item         | Type `settings`: one administration surface, `{ id, title, actions }`, registered with `authz.settings.add` and placed with `authz.ui.place`. Ids must be registered.                                                                                                                            |
| Collection            | Type `database.collection`: a collection opted into the permission model with `authz.database.collections.add`.                                                                                                                                                                                  |
| Composite resource    | Type `composite`: a resource whose actions expand into a set of underlying grants, each optionally bound to a named data scope, registered with `authz.compositeResources.define`. Business operations are defined as composite resources, and the workspace shows them in its Business section. |
| Data scope            | A named slot on a composite action that a grant or rule fills with a record selection. It targets the one collection its grant actions address.                                                                                                                                                  |
| Record selection      | `all`, `records` with ids, or `recordAccess` with a key and params.                                                                                                                                                                                                                              |
| Record access         | A named way to select records; `recordAccess.recordsIOwn` and its siblings are the built-in ones.                                                                                                                                                                                                |
| Section               | A top-level heading on the left of the workspace, `{ name, title, order }`: `pages`, `business`, `administration` and any a plugin adds through `authz.ui.sections.add`. Display only.                                                                                                           |
| Subsection            | A left-side entry under a section, `{ name, title, parent, order? }`, such as `authorization` or `automation`; `authz.ui.place` lists a resource in one. Display only.                                                                                                                           |
| Resource group        | A right-side heading resources are listed under, `{ name, title, parent?, order? }`, nested to any depth and registered with `authz.ui.groups.add`. Display only.                                                                                                                                |
| Authorization context | The request's `authz` Hono variable: `authorize`, `can`, `require`, `snapshot` for the signed-in identity.                                                                                                                                                                                       |

## Layers

```text
 storage                          judgement                                    use
 ──────────────────────────       ───────────────────────────────────────      ──────────────────────────────────
 permission-set tables ─grants─▶ Permission Sets (Grant Provider)             server: c.get('authz').require(...)
                                  └▶ composite expansion ┐                             authz.database.policyFor(...)
 rule tables ─constraints──────────────────────────────▶ resource type                 authz.database.authorizeRepository(...)
                                    page · settings · database.collection     client: useCan(...), route `authz`
                                    · composite · plugin types                HTTP:   /api/authorization/*

 display (authz.ui, never read by a check): sections ─▶ subsections ─▶ groups ─▶ resources (pages from the client route tree)
```

## Entry points

| Import                                                      | Contents                                                                                         |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `@nocobase/app-plugin-authorization`                        | The same as `./server`.                                                                          |
| `@nocobase/app-plugin-authorization/server`                 | Server plugin, `createAppAuthorization`, `authorizationToken`, database, page and settings APIs. |
| `@nocobase/app-plugin-authorization/server/extension`       | HTTP helpers for plugins that add authorization settings surfaces, such as the rule plugins.     |
| `@nocobase/app-plugin-authorization/client`                 | Client plugin, `AuthorizationClient`, `useCan` and related hooks.                                |
| `@nocobase/app-plugin-authorization/client/plugin`          | The client plugin factory alone.                                                                 |
| `@nocobase/app-plugin-authorization/client/routes`          | The settings route contribution.                                                                 |
| `@nocobase/app-plugin-authorization/client/react-providers` | The React provider contribution.                                                                 |
| `@nocobase/app-plugin-authorization/client/management`      | Workspace components the rule plugins import.                                                    |
| `@nocobase/app-plugin-authorization/package.json`           | The package manifest.                                                                            |

## Install and configure

Register the default exports of `./client` and `./server` in the application's plugin composition roots, after authentication, and apply the application's migrations and seeds. Resolve `authorizationToken` wherever the service is needed; there is one instance per application and no other token.

```ts
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
const authz = app.container.resolve(authorizationToken);
```

`createAppAuthorization(options)` builds the instance from the plugin tuple `[permissionSetsPlugin, databasePlugin, pagesPlugin, settingsPlugin, uiPlugin, ...config.plugins]`; every extension is installed through its plugin's `authorizationApi`, so `AppAuthorization` is `Authorization & { permissionSets, database, pages, settings, ui }`, where `Authorization` already carries the built-in `composites`, plus whatever the configured plugins add. `config.permissionSets` names the `rootSet` (default `root`, unrestricted, assignable to users) and the `defaultSet` (default `member`, held by every signed-in user through the `authenticated:*` subject).

```ts
import type { AuthorizationConfig } from '@nocobase/app-plugin-authorization/server';
import { defaultAccess } from '@nocobase/app-plugin-authz-default-access/server';
import { sharingRules } from '@nocobase/app-plugin-authz-sharing-rules/server';
import { restrictionRules } from '@nocobase/app-plugin-authz-restriction-rules/server';

export default {
  permissionSets: { rootSet: 'root', defaultSet: 'member' },
  plugins: [defaultAccess(), sharingRules(), restrictionRules()],
} satisfies AuthorizationConfig;
```

## Register what can be granted

All registration runs in a provider's `boot`, before the first request.

### Settings item

```ts
authz.ui.sections.add({
  name: 'automation',
  title: { key: 'nav.automation', ns: '@nocobase/app-plugin-workflow' },
  parent: 'administration',
});
authz.settings.add({
  id: 'workflow',
  title: { key: 'authorization.title', ns: '@nocobase/app-plugin-workflow' },
  actions: [
    {
      name: 'manage',
      title: {
        key: 'authorization.manage',
        ns: '@nocobase/app-plugin-workflow',
      },
    },
  ],
});
authz.ui.place({ type: 'settings', id: 'workflow' }, { section: 'automation' });
const grant = authz.settings.grant('workflow', ['manage']);
```

A settings item may declare any action names. `settings.grant` refuses an id or action nobody registered. Where the workspace lists it is a separate `authz.ui.place`; an unplaced item is listed under the "Other" subsection of `administration`, the `settings` type's default section, and startup logs a warning. Check a settings action on the server with `requireSettings` from `./server/extension` or with `context.require({ resource: { type: 'settings', id: 'workflow' }, action: 'manage' })`.

### Collection

```ts
authz.database.collections.add({
  name: 'quotes',
  title: 'Quotes',
  actions: ['read', 'create', 'update', 'delete'],
});
```

Registration is the opt-in: an unregistered collection is outside the permission model and is denied even to an unrestricted identity. Fields, primary key and relations are read from the database at check time. `actions` defaults to the four CRUD actions. Re-adding a collection with the same actions is a no-op, including when two modules register it with a different `title` or `description`: the first registration is kept and startup logs a warning, which `authz.database.collections.warnings()` also lists. Re-adding it with different actions throws, naming the collection and both action lists.

### Composite resource with data scopes

Builder form, with typed fields and record access options:

```ts
import { defineCompositeResource } from '@nocobase/authorization/core';
import {
  defineDatabasePermission,
  recordAccess,
} from '@nocobase/app-plugin-authorization/server';

const quoteData = defineDatabasePermission((permission) =>
  permission
    .collection<Quote>('quotes')
    .title('Quotes')
    .options(recordAccess.recordsIOwn, recordAccess.allRecords)
    .default(recordAccess.recordsIOwn)
    .read(['id', 'projectId', 'amount', 'status'])
    .update(['status']),
);
export const quotes = defineCompositeResource('sales.quotes', (resource) =>
  resource
    .title('Quotes')
    .action('view', (action) => action.title('View').grant('quotes', quoteData))
    .action('submit', (action) =>
      action
        .title('Submit')
        .grant('quotes', quoteData)
        .grant('projects', projectData),
    ),
);

const reference = authz.compositeResources.define(quotes);
authz.ui.sections.add({ name: 'sales', title: 'Sales', parent: 'business' });
authz.ui.place(reference, { section: 'sales' });
```

Object form, the same data a builder produces:

```ts
authz.compositeResources.define({
  name: 'sales.reports',
  title: 'Reports',
  actions: [
    {
      name: 'export',
      title: 'Export',
      dataScopes: [
        {
          key: 'orders',
          title: 'Orders',
          options: ['recordsIOwn', 'allRecords'],
        },
      ],
      grants: [
        {
          resource: { type: 'database.collection', id: 'orders' },
          actions: [
            {
              action: 'read',
              policy: { type: 'database', fields: '*' },
              scopeKey: 'orders',
            },
          ],
        },
      ],
    },
  ],
});
```

A composite action composes exactly the grants its definition lists, on any resource type except another composite. A data scope binds to the one collection its grant actions address; `database.collection` declares `recordAccess`, which a data scope's target type needs. `.grant(key, permission, { title? })` binds a database permission to a data scope named `key`. Read fields govern output and create or update fields govern input; delete has none. On create or update, `'*'` means every field a write may name, which leaves out the fields the database or Repository assigns — auto-increment, generated and optimistic-lock version columns — as `writableFields` from `@nocobase/db` decides them. `.options(...references)` limits the record access a grant may choose and `.default(reference)` sets the value used when a grant chooses nothing.

### Custom resource type

```ts
import { grantBacked } from '@nocobase/authorization/core';

authz.resourceTypes.add({
  type: 'hub.app',
  actions: ['read', 'deploy'],
  authorize: grantBacked({
    also: (request) => ownsApp(request.principal.id, request.resource.id),
  }),
});
```

This is a record type: it declares its actions and no items, so any record id passes validation and only an undeclared action is denied; the type's `authorize` judges each record. Grants use `id: '*'` to mean every record. `grantBacked()` is the default judgement and permits when a grant without a policy matches. Hub (`hub.app`, `hub.host`), users (`user`), notification and `page` are record types; `settings`, `composite` and `database.collection` are catalog types, which register items and deny any unregistered item or action.

### Workspace placement: `authz.ui`

```ts
authz.ui.sections.add({ name: 'sales', title: 'Sales', parent: 'business' });
authz.ui.groups.add({ name: 'ledgers', title: 'Ledgers' });
authz.ui.place(reference, { section: 'sales', group: 'ledgers' });
authz.ui.defaultSection('report', 'administration');
```

`authz.ui` decides where the permission workspace lists each resource and is never read by a check. The workspace lists top-level sections on the left, each with its subsections as entries, and the selected subsection's resources on the right, under their groups. This plugin registers the sections `pages` (order 0), `business` (100) and `administration` (200); its `authorization` subsection; and the default sections `composite → business` and `settings → administration`. `pagesPlugin`, which depends on `ui`, registers the `pages.page` subsection (order 0, titled `sections.page` in this plugin's namespace); it is the only subsection the client fills, from its route tree, and the options mark it with `recordType: { type: 'page', actions }`. Resource types have no titles, so every heading the workspace shows comes from `authz.ui`.

| Member                                                   | Behavior                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `sections.add({ name, title, order })`                   | A top-level section; `order` is required.                                                                                                                                                                                                                                                                                                                                                              |
| `sections.add({ name, title, parent, order?, extend? })` | A subsection, one level under a top-level section. Without `extend`, a deep-equal re-add is a no-op and anything else throws. With `extend: true`, as a client settings group is extended, the add does nothing when the subsection exists and creates it otherwise; the owner's later add replaces the title and order and throws only if the parents differ. `extend` on a top-level section throws. |
| `groups.add({ name, title, parent?, order? })`           | A right-side group, nested to any depth.                                                                                                                                                                                                                                                                                                                                                               |
| `place(ref, { section, group?, order? })`                | Lists a resource, `{ type, id }` or a `CompositeResourceReference`, in a subsection and optionally a group. `order` positions it within the subsection; unordered resources follow in registration order. Placing in a top-level section throws; placing the same resource elsewhere throws.                                                                                                           |
| `defaultSection(type, section)`                          | Unplaced resources of `type` are listed under `<section>.other`. Types with no default section and no placement are not displayed; `database.collection`, `hub.app` and `user` are such types.                                                                                                                                                                                                         |

A placement may name a subsection, group or resource that registers later. Startup validation runs in the provider's `start` hook, after every plugin's `boot`: it reports a placement whose subsection or group is unknown, a placement of an unregistered resource, and any composite data scope whose target type lacks `recordAccess`, throwing in development and logging a warning when `NODE_ENV` is `production`. It also warns about each unplaced composite or settings item, which is then listed under its default section's "Other". Workflow owns `automation` and scheduler extends it, so the owner's title wins whichever boots first. The Pages entry is filled on the client from the route tree, with navigation groups as resource groups in menu order.

### Record access

```ts
import { defineRecordAccess } from '@nocobase/authorization/core';
import { condition } from '@nocobase/app-plugin-authorization/server';

const prepared = authz.recordAccess.define(
  defineRecordAccess('sales.prepared', (access) =>
    access
      .title({ key: 'recordAccess.prepared', ns: 'my-plugin' })
      .collections('quotes')
      .resolver(({ principal }) =>
        condition('preparedById', '$eq', principal.id),
      ),
  ),
);
```

A resolver returns a `DatabaseScope` (`true`, `false` or a filter node on the collection's own columns) or a `FilterAst`. The built-ins are the exported constants `recordAccess.allRecords`, `recordAccess.recordsIOwn` (`ownerId`), `recordAccess.recordsICreated` (`createdById`) and `recordAccess.customFilter` (`params.filter`); the owner and creator ones accept `params.field`.

## Grant access

### Permission set

```ts
import { definePermissionSet } from '@nocobase/authorization/permission-sets';

await authz.permissionSets.create(
  definePermissionSet('sales-engineer')
    .title('Sales engineer')
    .grant(authz.pages.grant('sales.quotes'))
    .grant(authz.settings.grant('workflow', ['manage']))
    .grant(
      quotes.reference().grant({
        view: { quotes: 'allRecords' },
        submit: { quotes: 'recordsIOwn' },
      }),
    )
    .build(),
);
await authz.permissionSets.assign({
  permissionSet: 'sales-engineer',
  subject: { type: 'user', id: userId },
});
```

`authz.pages.grant(id)` builds a page `access` grant and registers nothing. A page grant does not open data, and a composite grant does not open a page.

The Permission Set routes reject a composite grant its definition does not accept. A grant stored some other way — a seed, or a definition that changed after the grant was saved — is skipped for that grant alone: it permits nothing, a direct check of its action denies with `INVALID_GRANT`, the person's other grants keep working, and the application logs a warning naming the source, resource, action and problem. At startup the plugin also scans every stored Permission Set against the current composite definitions and names each set, resource, action and problem; like the workspace check, this throws in development and warns in production.

### Rules

```ts
import { selection } from '@nocobase/authorization/core';
import { defineDefaultAccessRule } from '@nocobase/authorization/default-access';
import { defineSharingRule } from '@nocobase/authorization/sharing-rules';
import { defineRestrictionRule } from '@nocobase/authorization/restriction-rules';

const target = quotes.reference();
await authz.defaultAccess.create(
  defineDefaultAccessRule('quotes-baseline', target)
    .scope('view', 'quotes', selection.recordAccess('sales.prepared'))
    .build(),
);
await authz.sharingRules.create(
  defineSharingRule('handover', target)
    .subjects({ type: 'user', id: 'alice' })
    .scope('submit', 'quotes', selection.records(['quote-7']))
    .build(),
);
await authz.restrictionRules.create(
  defineRestrictionRule('own-only', target)
    .subjects({ type: 'team', id: 'interns' })
    .scope('submit', 'quotes', selection.recordAccess('recordsIOwn'))
    .build(),
);
```

Each rule API exists only when its plugin is configured; see the [default access](../app-plugin-authz-default-access/README.md), [sharing rules](../app-plugin-authz-sharing-rules/README.md) and [restriction rules](../app-plugin-authz-restriction-rules/README.md) READMEs.

## Check access on the server

Every route installs authentication, then `authz.middleware()`, which sets the `authz` variable to the request's `AuthorizationContext`. A denied `require` throws `AuthorizationDeniedError`, which the application answers as `403 PERMISSION_DENIED` with reason `AUTHORIZATION_DENIED` and domain `authorization` in the standard error body, so a route needs no `onError` for it.

```ts
router.use('*', authentication.required(), authz.middleware());
router.post('/quotes/:id/submit', async (c) => {
  const context = c.get('authz');
  await context.require({
    resource: { type: 'settings', id: 'workflow' },
    action: 'manage',
  });
  const decision = await context.authorize({
    resource: { type: 'composite', id: 'sales.quotes' },
    action: 'submit',
  });
  const quotesPolicy = decision.conditions?.database?.quotes;
  const projectsPolicy = decision.conditions?.database?.projects;
  if (decision.effect === 'deny' || !quotesPolicy || !projectsPolicy)
    throw new AuthorizationDeniedError(decision);
  const quote = await database.transaction(async (connection) => {
    const project = await connection
      .repository('projects')
      .withPolicy(projectsPolicy)
      .findOne({ filter: { id: projectId } });
    const { record } = await connection
      .repository('quotes')
      .withPolicy(quotesPolicy)
      .updateOne({
        filter: { id: c.req.param('id') },
        values: { status: 'submitted' },
      });
    return record;
  });
  return c.json({ data: quote });
});
```

A composite decision's `conditions` are `CompositeResourceConditions` with `database`: one `RepositoryPolicy` per composed collection, built from that action's grants only. `require` rejects conditional decisions, and `can` counts them as false; neither enforces rows.

A policy is `false` only when nothing grants the action, and a Repository refuses to run under it. When a grant exists but its data scope selects no records, such as a record access that answers `false` for a user in no department, the decision stays conditional with the `EMPTY_RECORD_ACCESS` reason and a scope that matches no rows: reads return an empty result, and updates and deletes affect nothing. A grant whose data scopes configure no selection at all is still denied with `NO_RECORD_ACCESS`. Create reads no record scope, so a create grant is unaffected.

For a collection-oriented endpoint, fold the four CRUD decisions into one policy, optionally restricted to one composite action's branch:

```ts
const policy = await authz.database.policyFor('quotes', c.get('authz'), {
  resource: 'sales.quotes',
  action: 'submit',
});
await database
  .repository('quotes')
  .withPolicy(policy)
  .updateOne({ filter: { id }, values: input });
```

For generated Repository routes, bind each endpoint to one composite action:

```ts
router.use(
  '/quotes/*',
  authz.database.authorizeRepository({
    repository: 'quotes',
    resource: quotes.reference(),
    actions: { findMany: 'view', updateOne: 'submit' },
  }),
);
```

## Check access on the client

```tsx
import { useCan } from '@nocobase/app-plugin-authorization/client';

const { can, isPending, error, retry } = useCan({
  resource: { type: 'composite', id: 'sales.quotes' },
  action: 'submit',
});
```

`useCan(check, { enabled? })` answers from the session's snapshot and is `false` while pending or failed; it re-checks after sign-in changes and permission invalidation. Outside React, resolve `authorizationClientToken` and call `client.can(check)`. Never keep a client or snapshot across sessions.

### Route `authz`

```ts
defineRoutes([
  {
    name: 'sales.quotes',
    path: '/quotes',
    authz: { resource: { type: 'page', id: 'sales.quotes' }, action: 'access' },
    componentLoader,
  },
  {
    name: 'workflow',
    path: '/workflow',
    authz: { resource: { type: 'settings', id: 'workflow' }, action: 'manage' },
    componentLoader,
  },
]);
```

Declare `authz` on every entry client route: there is no `page:<route.name>` inference. A nested page that omits it inherits its nearest ancestor page's value; an entry page that omits it defaults to `'unrestricted'` on protected App and settings routes, which `useCan('unrestricted')` and `client.can('unrestricted')` pass only for an unrestricted snapshot such as root's, and to `'skip'` on guest, optional and dev routes. Unrestricted-only routes are never offered as page grants. The permission workspace lists these pages in the `pages.page` subsection, under their navigation groups as resource groups, from the client route tree sorted by `navigation.order` the way the menu sorts them.

## HTTP API

Every path is under `/api/authorization` and requires a signed-in user. Settings checks use `{ resource: { type: 'settings', id }, action }`, and run before the request is validated, so a caller without the permission gets `403` whatever the request holds. Successful responses wrap results in `{ data }`; a paged list adds `meta: { page, pageSize, total }`; creation answers `201` and deletion `204` with no body. Every input is validated: an invalid or unknown field answers `400 INVALID_ARGUMENT` with reason `INVALID_INPUT` and a `fieldViolations` entry for each problem. Failures use the standard error body, `{ error: { code, status, reason, domain, message, requestId } }`; branch on `error.reason`, never on `message`.

Every route below, and every route a rule plugin adds under `/api/authorization`, is described with its parameters, request and response schemas and error statuses in the application's API document, served at `/api/swagger/docs` (JSON at `/api/swagger`) to a signed-in user or a valid API key. They are listed under the `Authorization` tag with operation ids such as `authorizationCreatePermissionSet`.

| Method and path                                         | Required permission                               | Request                                       | Response `data`                                                                |
| ------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------ |
| `GET /permissions`                                      | Signed in                                         |                                               | `AuthorizationSnapshot`                                                        |
| `GET /permissionSets/options`                           | `settings:authorization.permission-sets` `read`   |                                               | `AuthorizationOptions`                                                         |
| `GET /permissionSets/subjects/:type`                    | `settings:authorization.permission-sets` `read`   | query `q?`, `page`, `pageSize`                | `SubjectOption[]`, with `meta`                                                 |
| `POST /permissionSets/subjects/:type/resolve`           | `settings:authorization.permission-sets` `read`   | `{ ids: string[] }`                           | `SubjectOption[]`                                                              |
| `GET /permissionSets`                                   | `settings:authorization.permission-sets` `read`   | query `subjectType?`, `subjectId?`            | `PermissionSet[]` with `protection` and `unrestricted`, with `meta: { total }` |
| `POST /permissionSets`                                  | `settings:authorization.permission-sets` `create` | `{ key, title?, grants }`                     | `PermissionSet`                                                                |
| `GET /permissionSets/:key`                              | `settings:authorization.permission-sets` `read`   |                                               | `PermissionSet`                                                                |
| `PATCH /permissionSets/:key`                            | `settings:authorization.permission-sets` `update` | any of `{ key, title, grants }`               | `PermissionSet`                                                                |
| `DELETE /permissionSets/:key`                           | `settings:authorization.permission-sets` `delete` |                                               | none                                                                           |
| `GET /permissionSets/:key/assignments`                  | `settings:authorization.permission-sets` `read`   |                                               | `PermissionSetAssignment[]`, with `meta: { total }`                            |
| `POST /permissionSets/:key/assignments`                 | `settings:authorization.permission-sets` `assign` | `{ id?, subject: { type, id } }`              | `PermissionSetAssignment`                                                      |
| `DELETE /permissionSets/:key/assignments/:assignmentId` | `settings:authorization.permission-sets` `assign` |                                               | none                                                                           |
| `GET /inspector/options`                                | `settings:authorization.inspector` `inspect`      |                                               | `AuthorizationOptions`                                                         |
| `GET /inspector/subjects/:type`                         | `settings:authorization.inspector` `inspect`      | query `q?`, `page`, `pageSize`                | `SubjectOption[]`, with `meta`                                                 |
| `POST /inspector/subjects/:type/resolve`                | `settings:authorization.inspector` `inspect`      | `{ ids: string[] }`                           | `SubjectOption[]`                                                              |
| `POST /inspector/decide`                                | `settings:authorization.inspector` `inspect`      | `{ subject, resource, action }`               | `AuthorizationDecision`, with `checks` for a composite                         |
| `POST /inspector/batchDecide`                           | `settings:authorization.inspector` `inspect`      | `{ subject, checks: [{ resource, action }] }` | `[{ resource, action, decision }]`                                             |
| `GET /inspector/configuredAccess`                       | `settings:authorization.inspector` `inspect`      | query `subjectType`, `subjectId`              | `{ unrestricted, types, resources, identity, sets }`                           |
| `GET /<rule>`                                           | `settings:authorization.<settings>` `read`        |                                               | rules, with `meta: { total }`                                                  |
| `POST /<rule>`                                          | `settings:authorization.<settings>` `create`      | a complete rule                               | the rule                                                                       |
| `PATCH /<rule>/:key`                                    | `settings:authorization.<settings>` `update`      | the fields that change                        | the rule                                                                       |
| `DELETE /<rule>/:key`                                   | `settings:authorization.<settings>` `delete`      |                                               | none                                                                           |
| `GET /<rule>/options`                                   | `settings:authorization.<settings>` `read`        |                                               | `AuthorizationOptions`                                                         |
| `GET /<rule>/subjects/:type`                            | `settings:authorization.<settings>` `read`        | query `q?`, `page`, `pageSize`                | `SubjectOption[]`, with `meta`                                                 |
| `POST /<rule>/subjects/:type/resolve`                   | `settings:authorization.<settings>` `read`        | `{ ids: string[] }`                           | `SubjectOption[]`                                                              |
| `GET /<rule>/records/:collection`                       | `settings:authorization.<settings>` `read`        | query `page`, `pageSize`                      | `[{ id, label, description? }]`, with `meta`                                   |

`<rule>` is each of `defaultAccess`, `sharingRules` and `restrictionRules`, with the settings items `authorization.default-access`, `authorization.sharing-rules` and `authorization.restriction-rules`, present only when that plugin is configured. Options, subjects and records stay per plugin, each gated by that plugin's own settings item. A subject directory may enforce further read checks of its own. `GET /permissionSets` with `subjectType` and `subjectId` lists only the sets that subject holds, including the default set; give both or neither. The inspector evaluates one subject: a user includes the `authenticated` audience and resolved memberships, while inspecting a team describes that team's grants alone. `configuredAccess` also answers `identity: { subjects }`, the subjects a request for that principal would carry, and `sets: [{ key, title?, sources }]`, where `sources` lists the assignments, to the principal itself or to one of those subjects, that bring each effective set; the default set has none. A `PATCH` changes only the fields it names; `title: null` clears a title.

`POST /permissionSets`, and a `PATCH` that replaces `grants`, check every `database.collection` `create` and `update` grant against the Collection's current metadata: each field it lists must exist and be one a write may set, and each relation it lists, at any depth, must exist, with `through` only on a `belongsToMany`. Anything else would be accepted and then fail every write the grant allows, so it is refused with `INVALID_AUTHORIZATION_INPUT` and one `fieldViolations` entry per offending member. `'*'` always passes; read and delete grants, grants on `'*'`, and Collections the database does not hold are not checked. A grant that stopped fitting later, because a field was dropped or a seed wrote it directly, is reported by the startup scan of stored Permission Sets, which throws in development and warns in production, as it does for a composite grant that no longer expands; the scan also checks the write fields each stored composite grant's definition composes.

Permission Sets, their assignments and each rule list are bounded configuration lists: they answer every entry at once with `meta: { total }`. Subject and record pagination accepts `page >= 1` (default 1) and `1 <= pageSize <= 100` (default 20), and `q` searches subjects; records are ordered by their id and answer `404 COLLECTION_NOT_FOUND` for a name the database holds no Collection for; `batchDecide` takes 1 to 100 checks and `resolve` up to 100 ids.

| Reason                               | Status                    | When                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------ | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTHORIZATION_DENIED`               | `403 PERMISSION_DENIED`   | The settings check, or another `require`, denied the request                                                                                                                                                                                                                                                                                                                                  |
| `INVALID_INPUT` (domain `app`)       | `400 INVALID_ARGUMENT`    | The request does not match the route's schema                                                                                                                                                                                                                                                                                                                                                 |
| `INVALID_AUTHORIZATION_INPUT`        | `400 INVALID_ARGUMENT`    | A grant, rule, title or selection names something the registered model does not accept; a rule check names the offending field, such as `actions.0.scopeKey`, in `fieldViolations`, and so does a `database.collection` create or update grant naming a field that does not exist or that a write cannot set, or a relation that does not exist, such as `grants.0.actions.1.policy.fields.2` |
| `PERMISSION_SET_SUBJECT_NOT_ALLOWED` | `400 INVALID_ARGUMENT`    | The set may not be assigned to that subject type                                                                                                                                                                                                                                                                                                                                              |
| `PROTECTED_PERMISSION_SET`           | `400 FAILED_PRECONDITION` | The set is owned by code and its protection does not allow the change                                                                                                                                                                                                                                                                                                                         |
| `LAST_ASSIGNMENT`                    | `400 FAILED_PRECONDITION` | The change would remove the last active assignment of a set that must keep one                                                                                                                                                                                                                                                                                                                |
| `PERMISSION_SET_NOT_FOUND`           | `404 NOT_FOUND`           | No set has the key in the path                                                                                                                                                                                                                                                                                                                                                                |
| `ASSIGNMENT_NOT_FOUND`               | `404 NOT_FOUND`           | The set has no assignment with the id in the path                                                                                                                                                                                                                                                                                                                                             |
| `UNKNOWN_SUBJECT_TYPE`               | `404 NOT_FOUND`           | The subject type in the path has no collection selection                                                                                                                                                                                                                                                                                                                                      |
| `RULE_NOT_FOUND`                     | `404 NOT_FOUND`           | No rule of that plugin has the key in the path                                                                                                                                                                                                                                                                                                                                                |
| `COLLECTION_NOT_FOUND`               | `404 NOT_FOUND`           | The database holds no Collection named in a `records/:collection` path                                                                                                                                                                                                                                                                                                                        |
| `PERMISSION_SET_CONFLICT`            | `409 ALREADY_EXISTS`      | A set with that key already exists                                                                                                                                                                                                                                                                                                                                                            |
| `RULE_ALREADY_EXISTS`                | `409 ALREADY_EXISTS`      | Another rule of that plugin already has the key a create or rename asks for; `metadata.key` names it                                                                                                                                                                                                                                                                                          |
| `DEFAULT_ACCESS_CONFLICT`            | `409 ALREADY_EXISTS`      | The resource already has a default-access rule; `metadata.existing` names it                                                                                                                                                                                                                                                                                                                  |

Every reason except `INVALID_INPUT` has the domain `authorization`. A rule key may not be `options`, `subjects` or `records`, the fixed segments beside `/<rule>/:key`, and a sharing or restriction rule may not list a subject twice; both are refused as `INVALID_INPUT` naming the field (`key`, or the repeated `subjects.<index>`).

`AuthorizationOptions` is `{ sections: [{ name, title, order, subsections: [{ name, title, recordType?, resources: [{ type, id, title, description?, group?, actions: [{ name, title }], dataScopes? }] }] }], resourceGroups?, subjectTypes, recordAccess, collections }`. A subsection with `recordType` (`{ type: 'page', actions }`) lists no resources: the client supplies them. `dataScopes` maps a business action to its data scopes; subsections without resources are omitted, and rule options list only composites with data scopes, with every title as sent by the server, either a string or `{ key, ns }`.

Settings action names are semantic. Permission sets declare `read`, `create`, `update`, `delete` and `assign`; the inspector declares `inspect`; each rule plugin declares `read`, `create`, `update` and `delete`.

## Subjects and transactions

`authz.subjects.add(type, { resolveFor?, filterActive, administration? })` declares an inherited subject type such as teams; it returns a function that removes it. `administration` is `{ title, selection }` where `selection` is `{ type: 'fixed', id }` or `{ type: 'collection', list(query, context), resolve(ids, context) }`, answering `{ items: [{ id, title, description? }], total }` and items respectively. `title` and `description` may be plain text or a `{ key, ns }` translation descriptor, which the workspace renders in the viewer's language.

A permission-set assignment change to a `user` refreshes that user's clients; a change to any other subject, `authenticated` included, refreshes every client, because only the subject's owner knows which users it reaches. For a user removal, bind `authz.permissionSets.withTransaction(connection).assertSubjectRemovable(subject)` to the same transaction as the mutation and call `notifyAssignmentsChanged(subject)` on that bound API; it publishes once the transaction commits.

## `@nocobase/app-plugin-authorization/server`

The root entry `@nocobase/app-plugin-authorization` exports exactly the same names.

### Exports

| Export                                | Kind     | Signature                                                                                                                                                                   | Purpose                                                                                                   |
| ------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `default`                             | plugin   | `defineServerPlugin(...)`                                                                                                                                                   | The server plugin to register.                                                                            |
| `createAppAuthorization`              | function | `createAppAuthorization(options: CreateAppAuthorizationOptions): AppAuthorization`                                                                                          | Builds the application's instance.                                                                        |
| `CreateAppAuthorizationOptions`       | type     | `{ database?, connection?, config?, onUserPermissionsChanged?, onAuthenticatedPermissionsChanged?, onInvalidGrant? }`                                                       | Options of `createAppAuthorization`.                                                                      |
| `AuthorizationConfig`                 | type     | `{ permissionSets?: AppPermissionSetsConfig; plugins?: readonly AuthorizationPlugin[] }`                                                                                    | The application's authorization configuration.                                                            |
| `AppPermissionSetsConfig`             | type     | `{ rootSet?: string; defaultSet?: string }`                                                                                                                                 | Names of the unrestricted and default sets.                                                               |
| `authorizationToken`                  | const    | `ServiceToken<AppAuthorization>`                                                                                                                                            | The only service token.                                                                                   |
| `AppAuthorization`                    | type     | `Authorization & { permissionSets, database, pages, settings, composites, ui }`                                                                                             | The registered instance.                                                                                  |
| `AuthorizationProvider`               | class    | `ServiceProvider`                                                                                                                                                           | Registers the instance; other providers order themselves after it.                                        |
| `databasePlugin`                      | function | `databasePlugin(database?: DatabaseManager): DatabasePlugin`                                                                                                                | Registers `database.collection` and `authz.database`.                                                     |
| `DatabasePlugin`                      | type     | `AuthorizationPlugin<{ database: DatabaseApi }, DatabaseConnection>`                                                                                                        | What `databasePlugin` returns.                                                                            |
| `DatabaseApi`                         | type     | `collections.add(definition)`, `policyFor(collection, context, operation?)`, `authorizeRepository(options)`                                                                 | `authz.database`.                                                                                         |
| `DatabaseCollectionDefinition`        | type     | `{ name: string; title: AuthorizationTitle; description?; actions?: readonly string[] }`                                                                                    | What `collections.add` takes.                                                                             |
| `AuthorizeRepositoryOptions`          | type     | `{ repository: string; resource: CompositeResourceReference; actions: Record<method, action> }`                                                                             | Binds Repository methods to composite actions.                                                            |
| `pagesPlugin`                         | function | `pagesPlugin(): PagesPlugin`                                                                                                                                                | Registers the `page` record type, its `pages.page` subsection and `authz.pages`; depends on `ui`.         |
| `PagesPlugin`                         | type     | `AuthorizationPlugin<{ pages: PagesApi }, unknown, UiAuthorizationApi>`                                                                                                     | The plugin `pagesPlugin` returns.                                                                         |
| `PagesApi`                            | type     | `grant(id: string): PermissionGrant`                                                                                                                                        | `authz.pages`; builds a page `access` grant.                                                              |
| `settingsPlugin`                      | function | `settingsPlugin(): SettingsPlugin`                                                                                                                                          | Registers `settings` and `authz.settings`.                                                                |
| `SettingsPlugin`                      | type     | `AuthorizationPlugin<{ settings: SettingsApi }>`                                                                                                                            | What `settingsPlugin` returns.                                                                            |
| `SettingsApi`                         | type     | `add(item: SettingsItemDefinition)`, `grant(id, actions): PermissionGrant`                                                                                                  | `authz.settings`.                                                                                         |
| `SettingsItemDefinition`              | type     | `{ id, title, actions: readonly { name; title? }[] }`                                                                                                                       | A settings item; `authz.ui.place` lists it.                                                               |
| `defineDatabasePermission`            | function | `defineDatabasePermission(configure): DatabasePermissionBuilder`                                                                                                            | Builds a bindable collection permission.                                                                  |
| `DatabasePermissionDefinitionBuilder` | class    | `collection<Row>(name): DatabasePermissionBuilder<Row>`                                                                                                                     | The builder `defineDatabasePermission` passes in.                                                         |
| `DatabasePermissionBuilder`           | class    | `title`, `options`, `default`, `read`, `create`, `update`, `delete`, `build`, `bind(key, { title? })`                                                                       | A collection permission; implements `BindableCompositeResourcePermission`.                                |
| `ReadPermissionBuilder`               | class    | `fields(...)`, `allFields()`, `recordAccess(...)`, `relation(name, configure)`, `build()`                                                                                   | Read fields and relation reads.                                                                           |
| `WritePermissionBuilder`              | class    | `fields(...)`, `allFields()`, `recordAccess(...)`, `relation(name, configure)`, `through(configure)`, `build()`                                                             | Create and update fields and relation writes.                                                             |
| `RelationPermissionBuilder`           | class    | `recordAccess`, `create`, `update`, `upsert`, `connect`, `set`, `disconnect`, `delete`, `build`                                                                             | Operations on one relation.                                                                               |
| `PermissionUpsertBuilder`             | class    | `create(configure)`, `update(configure)`, `build()`                                                                                                                         | Both branches of a relation upsert.                                                                       |
| `ThroughPermissionBuilder`            | class    | `through(configure)`, `build()`                                                                                                                                             | Junction fields of `connect` and `set`.                                                                   |
| `PermissionFieldsBuilder`             | class    | `fields(...)`, `allFields()`, `build()`                                                                                                                                     | A field list inside `through`.                                                                            |
| `recordAccess`                        | const    | `{ allRecords, recordsIOwn, recordsICreated, customFilter }`, each a `RecordAccessReference`                                                                                | The built-in record access.                                                                               |
| `RecordOwnerParams`                   | type     | `{ field?: string }`                                                                                                                                                        | Params of `recordsIOwn` and `recordsICreated`.                                                            |
| `CustomFilterParams`                  | type     | `{ filter: DatabaseScope }`                                                                                                                                                 | Params of `customFilter`.                                                                                 |
| `DatabaseScope`                       | type     | `boolean \| FilterNode`                                                                                                                                                     | What a record access resolver returns.                                                                    |
| `condition`                           | function | `condition(field, operator, value?): FilterNode`                                                                                                                            | A condition on one of the collection's own columns.                                                       |
| `anyScope`                            | function | `anyScope(scopes: readonly DatabaseScope[]): DatabaseScope`                                                                                                                 | The union of scopes.                                                                                      |
| `scopeAst`                            | function | `scopeAst(collection, scope: FilterNode): FilterAst`                                                                                                                        | Attaches a scope to its collection.                                                                       |
| `DatabaseAuthorizationConditions`     | type     | `{ type: 'database'; collection; action; scope; fields; relations?; fieldAccess?; allFields? }`                                                                             | Conditions of a collection decision.                                                                      |
| `DatabaseAuthorizationParams`         | type     | `{ operation?: { resource; action }; fields?: { input?, output?, filter?, sort?, group? } }`                                                                                | Params of a collection check.                                                                             |
| `AuthorizationCollection`             | type     | `{ name, fields, writableFields, relations?, primaryKey, generatedPrimaryKey }`                                                                                             | Collection metadata read from the database.                                                               |
| `SubjectAdministration`               | type     | `{ title; selection }`                                                                                                                                                      | The `administration` of a subject type.                                                                   |
| `SubjectOption`                       | type     | `{ id; title; description? }`                                                                                                                                               | One subject in a picker.                                                                                  |
| `SubjectSelectionContext`             | type     | `{ authz: AuthorizationContext }`                                                                                                                                           | What directory callbacks receive.                                                                         |
| `AUTHORIZATION_NAMESPACE`             | const    | `'@nocobase/app-plugin-authorization'`                                                                                                                                      | The plugin's translation namespace.                                                                       |
| `DatabaseAuthorizationApi`            | type     | `{ database: DatabaseApi }`                                                                                                                                                 | What `databasePlugin` adds to `authz`.                                                                    |
| `PagesAuthorizationApi`               | type     | `{ pages: PagesApi }`                                                                                                                                                       | What `pagesPlugin` adds to `authz`.                                                                       |
| `SettingsAuthorizationApi`            | type     | `{ settings: SettingsApi }`                                                                                                                                                 | What `settingsPlugin` adds to `authz`.                                                                    |
| `uiPlugin`                            | function | `uiPlugin(): UiPlugin`                                                                                                                                                      | Registers `authz.ui` with the built-in sections, the `authorization` subsection and the default sections. |
| `UiPlugin`                            | type     | `AuthorizationPlugin<UiAuthorizationApi>`                                                                                                                                   | The plugin `uiPlugin` returns.                                                                            |
| `UiAuthorizationApi`                  | type     | `{ ui: AuthorizationUiApi }`                                                                                                                                                | What the plugin adds to the instance and to every setup context.                                          |
| `AuthorizationUiApi`                  | type     | `sections`, `groups`, `place(target, placement)`, `defaultSection(type, section)`, `defaultSectionOf(type)`, `placementOf(ref)`, `validate({ resourceTypes, composites? })` | Where the workspace lists each resource.                                                                  |
| `AuthorizationUiSections`             | type     | `add(definition)`, `has(name)`, `isSubsection(name)`, `get(name)`, `other(parent)`, `tree()`                                                                                | `ui.sections`.                                                                                            |
| `AuthorizationUiGroups`               | type     | `add(group)`, `has(name)`, `get(name)`, `list()`                                                                                                                            | `ui.groups`.                                                                                              |
| `AuthorizationUiSection`              | type     | `{ name, title, order?, parent? }`                                                                                                                                          | A section, or a subsection when `parent` is set.                                                          |
| `AuthorizationUiSectionDefinition`    | type     | `AuthorizationUiSection & { extend?: boolean }`                                                                                                                             | What `ui.sections.add` takes.                                                                             |
| `AuthorizationUiSectionNode`          | type     | `AuthorizationUiSection & { order: number; subsections }`                                                                                                                   | A top-level section with its subsections.                                                                 |
| `AuthorizationUiGroup`                | type     | `{ name, title, parent?, order? }`                                                                                                                                          | A right-side group.                                                                                       |
| `AuthorizationUiPlacement`            | type     | `{ section: string; group?: string }`                                                                                                                                       | Where one resource is listed.                                                                             |
| `AuthorizationUiTarget`               | type     | `ResourceRef \| CompositeResourceReference`                                                                                                                                 | What `ui.place` takes.                                                                                    |
| `AuthorizationUiReport`               | type     | `{ errors: readonly string[]; warnings: readonly string[] }`                                                                                                                | What `ui.validate` returns.                                                                               |
| `reportAuthorizationUi`               | function | `reportAuthorizationUi(report, { production, warn }): void`                                                                                                                 | Logs warnings; throws errors in development and logs them in production.                                  |
| `AuthorizationUiReportOptions`        | type     | `{ production: boolean; warn(message): void }`                                                                                                                              | How `reportAuthorizationUi` reports.                                                                      |
| `AUTHORIZATION_SETTINGS_SECTION`      | const    | `'authorization'`                                                                                                                                                           | The subsection the authorization settings items are placed in.                                            |
| `grantBacked`                         | function | Re-exported from `@nocobase/authorization/core`                                                                                                                             | The default judgement of a resource type.                                                                 |
| `Authorization`                       | type     | Re-exported from `@nocobase/authorization/core`                                                                                                                             | The authorization instance.                                                                               |
| `AuthorizationContext`                | type     | Re-exported from `@nocobase/authorization/core`                                                                                                                             | The request's `authz` variable.                                                                           |
| `AuthorizationEnv`                    | type     | Re-exported from `@nocobase/authorization/core`                                                                                                                             | Hono environment carrying `authz`.                                                                        |
| `AuthorizationPlugin`                 | type     | Re-exported from `@nocobase/authorization/core`                                                                                                                             | What a configured plugin is.                                                                              |
| `PermissionSetsApi`                   | type     | Re-exported from `@nocobase/authorization/permission-sets`                                                                                                                  | `authz.permissionSets`.                                                                                   |

## `@nocobase/app-plugin-authorization/server/extension`

Helpers for plugins that add an authorization settings surface. A rule plugin registers its handler with `authz.routes.add('/<rule>', createRouteHandler(router))`, where `<rule>` is a camelCase path segment such as `/sharingRules`, and serves its options, subjects and records through `createRuleSupportRoutes`. The router declares its routes at their full path below the dispatcher, starting with that segment, such as `/sharingRules/options`. Declare every route of the router with `describeRoute()` from `@nocobase/app-server/router`, tagged `AUTHORIZATION_API_TAGS`, check the settings item with `settingsAccess` before it, validate each input with `apiValidator` and the exported schemas after it, and throw `ApiError` for a failure of your own. Routes registered through `authz.routes.add` with `createRouteHandler` are documented automatically: the dispatcher under `/api/authorization` forwards requests at runtime, where the application's API document cannot see them, so at boot this plugin calls `documentAuthorizationRoutes(apiDocs, authz.routes)`, which registers each router with the application's `ApiDocsService` through `addApiRouter()`. Their routes are then documented at `/api/authorization/...`, listed in Swagger UI at `/api/swagger/docs`, and checked by `findUndeclaredApiRoutes(app)` and `pnpm openapi:check` like any route mounted on `/api`. A handler that is a plain function rather than a `createRouteHandler` router cannot be described; it still answers, but the plugin logs a warning and registers it through `addUndeclaredApiRoute()`, so `findUndeclaredApiRoutes(app)` reports it. A rule plugin's test checks its routes without starting an application: `const docs = new ApiDocsService(); documentAuthorizationRoutes(docs, authz.routes);`, then `docs.attach({ api: new Hono(), describe: () => ({ info: { title: 'Test', version: '1.0.0' } }) })` to give the service an empty `/api` router, and then `expect(findUndeclaredApiRoutes(docs)).toEqual([])` and the `operationId`s in `await docs.getDocument()`.

```ts
import {
  AUTHORIZATION_API_TAGS,
  createRouteHandler,
  createRuleSupportRoutes,
  createSettingsRouter,
  settingsAccess,
  SubjectRuleSchema,
  TotalMetaSchema,
} from '@nocobase/app-plugin-authorization/server/extension';
import {
  apiErrorResponse,
  describeRoute,
  listResponse,
} from '@nocobase/app-server/router';

const settings = 'authorization.sharing-rules';
const SharingRule = SubjectRuleSchema.meta({ ref: 'AuthorizationSharingRule' });
const router = createSettingsRouter();
router.route(
  '/',
  createRuleSupportRoutes(authz, {
    path: '/sharingRules',
    settings,
    name: 'SharingRule',
  }),
);
router.get(
  '/sharingRules',
  settingsAccess(settings, 'read'),
  describeRoute({
    tags: AUTHORIZATION_API_TAGS,
    summary: 'List sharing rules',
    operationId: 'authorizationListSharingRules',
    responses: {
      200: listResponse(SharingRule, TotalMetaSchema),
      // No input, so no 400.
      401: apiErrorResponse(401),
      403: apiErrorResponse(403),
      500: apiErrorResponse(500),
    },
  }),
  async (c) => {
    const rules = await authz.sharingRules.list();
    return c.json({ data: rules, meta: { total: rules.length } });
  },
);
authz.routes.add('/sharingRules', createRouteHandler(router));
```

### Exports

| Export                                                                                                                                                                                                                                                        | Kind     | Signature                                                                                                                                                | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createSettingsRouter`                                                                                                                                                                                                                                        | function | `createSettingsRouter(translate?): Hono<SettingsRouterEnv>`                                                                                              | A router that answers the domain errors `translate` and then `toAuthorizationApiError` turn into an `ApiError` in the standard error body, and hands the rest to `apiErrorHandler`.                                                                                                                                                                                                                                                                                                                                   |
| `toAuthorizationApiError`                                                                                                                                                                                                                                     | function | `toAuthorizationApiError(error): ApiError \| undefined`                                                                                                  | The standard error for a Permission Set error or a library `TypeError` (`INVALID_AUTHORIZATION_INPUT`), or `undefined`.                                                                                                                                                                                                                                                                                                                                                                                               |
| `AUTHORIZATION_ERROR_DOMAIN`                                                                                                                                                                                                                                  | const    | `'authorization'`                                                                                                                                        | The `domain` of every error the authorization surfaces report.                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `settingsAccess`                                                                                                                                                                                                                                              | function | `settingsAccess(id, action): MiddlewareHandler<SettingsRouterEnv>`                                                                                       | `requireSettings` as middleware, registered before a route's validators.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `DataScopeRuleBody`, `DataScopeRulePatchBody`, `SubjectRuleBody`, `SubjectRulePatchBody`, `RuleParams`, `ReferenceInput`, `TitleInput`, `RecordSelectionInput`, `RuleActionInput`, `RuleKeyInput`, `SubjectsInput`                                            | const    | zod schemas                                                                                                                                              | Rule request bodies for `apiValidator()`: a create body, and a patch body whose fields are all optional.                                                                                                                                                                                                                                                                                                                                                                                                              |
| `RESERVED_RULE_KEYS`                                                                                                                                                                                                                                          | const    | `readonly ['options', 'subjects', 'records']`                                                                                                            | The fixed route segments beside `/<rule>/:key`, which `RuleKeyInput` refuses as a rule key.                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `AuthorizationInputError`                                                                                                                                                                                                                                     | class    | `new AuthorizationInputError(message, field)`                                                                                                            | A `TypeError` naming the offending request field; `toAuthorizationApiError` reports it as a field violation of `INVALID_AUTHORIZATION_INPUT`.                                                                                                                                                                                                                                                                                                                                                                         |
| `assertRuleKeyAvailable`, `rethrowRuleConflict`, `ruleAlreadyExists`                                                                                                                                                                                          | function | `assertRuleKeyAvailable(get, key, current?)`, `rethrowRuleConflict(key)`, `ruleAlreadyExists(key)`                                                       | Refuse a create or rename to a key another rule uses, before the write and as a `.catch` for the unique index, with `409 RULE_ALREADY_EXISTS`.                                                                                                                                                                                                                                                                                                                                                                        |
| `SettingsRouterEnv`                                                                                                                                                                                                                                           | type     | `{ Bindings: { authorization: AuthorizationContext } }`                                                                                                  | The router's environment.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `createRouteHandler`                                                                                                                                                                                                                                          | function | `createRouteHandler(router): AuthorizationRouteHandler`                                                                                                  | Adapts a router to `authz.routes.add`; the router behind it is documented in the application's API document.                                                                                                                                                                                                                                                                                                                                                                                                          |
| `documentAuthorizationRoutes`                                                                                                                                                                                                                                 | function | `documentAuthorizationRoutes(apiDocs, authz.routes, onWarning?): () => void`                                                                             | Registers every `authz.routes` handler with the application's API documentation: a `createRouteHandler` router through `addApiRouter()`, so its routes are documented and checked, and any other handler through `addUndeclaredApiRoute()`, so it is reported as undeclared. The plugin calls it at boot; a test calls it with `new ApiDocsService()`, attaches an empty `/api` router with `docs.attach()`, and asserts `findUndeclaredApiRoutes(docs)` is empty. Returns a function that removes the registrations. |
| `AUTHORIZATION_API_TAGS`                                                                                                                                                                                                                                      | const    | `['Authorization']`                                                                                                                                      | The `tags` every authorization settings route declares.                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `ReferenceSchema`, `TitleSchema`, `OptionTextSchema`, `RecordSelectionSchema`, `RuleActionSchema`, `DataScopeRuleSchema`, `SubjectRuleSchema`, `AuthorizationOptionsSchema`, `SubjectOptionSchema`, `RecordOptionSchema`, `PageMetaSchema`, `TotalMetaSchema` | const    | zod schemas                                                                                                                                              | Response schemas for the API document; a rule plugin gives `DataScopeRuleSchema` or `SubjectRuleSchema` a `ref` of its own with `.meta()`.                                                                                                                                                                                                                                                                                                                                                                            |
| `requireSettings`                                                                                                                                                                                                                                             | function | `requireSettings(authorization, id, action): Promise<void>`                                                                                              | The one settings check: `settings:<id>` `<action>`, with the full settings id.                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `createRuleSupportRoutes`                                                                                                                                                                                                                                     | function | `createRuleSupportRoutes(authz, { path, settings, name? }): Hono<SettingsRouterEnv>`                                                                     | `<path>/options`, `<path>/subjects/...` and `<path>/records/:collection`, gated by `settings:<settings>` `read`. `name`, such as `SharingRule`, names their operation ids (`authorizationListSharingRuleOptions`); it defaults to `path` in PascalCase.                                                                                                                                                                                                                                                               |
| `parse`                                                                                                                                                                                                                                                       | const    | `parse.object`, `parse.string`, `parse.strings`, `parse.title`, `parse.resource`, `parse.subjects`, `parse.selection`, `parse.ruleActions`, `parse.rule` | Request body parsers that throw `TypeError`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `validateDataScopeRule`                                                                                                                                                                                                                                       | function | `validateDataScopeRule(authz, rule): void`                                                                                                               | Checks a rule's actions, data scopes and record access against the registered model.                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `DatabaseConnectionHandle`                                                                                                                                                                                                                                    | class    | `new DatabaseConnectionHandle(owner, connection?)`; `set(connection)`, `resolve()`                                                                       | Late-bound connection for a store created before setup.                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `DatabaseConnectionSource`                                                                                                                                                                                                                                    | type     | `() => DatabaseConnection`                                                                                                                               | What a handle resolves a connection from.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `describeCollection`                                                                                                                                                                                                                                          | function | `describeCollection(connection, name): Promise<AuthorizationCollection \| undefined>`                                                                    | Reads a collection's metadata.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `DataScopeRuleInput`                                                                                                                                                                                                                                          | type     | `{ resource: ResourceRef; actions: readonly RuleAction[] }`                                                                                              | What `validateDataScopeRule` checks.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `AuthorizationExtensionHost`                                                                                                                                                                                                                                  | type     | `{ ui, resourceTypes, recordAccess, subjects, composites, database }`                                                                                    | The part of `authz` the support routes read.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

## `@nocobase/app-plugin-authorization/client`

### Exports

| Export                         | Kind     | Signature                                                                                                               | Purpose                                        |
| ------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `default`                      | plugin   | `defineClientPlugin(...)`                                                                                               | The client plugin to register.                 |
| `AuthorizationClient`          | class    | `can(check)`, `snapshot()`, `revision()`, `invalidate()`, `onInvalidated(listener)`, permission-set and inspector calls | Session-scoped access to `/api/authorization`. |
| `authorizationClientToken`     | const    | `ServiceToken<AuthorizationClient>`                                                                                     | Resolves the client outside React.             |
| `useAuthorizationClient`       | function | `useAuthorizationClient(): AuthorizationClient`                                                                         | The client in a component.                     |
| `useAuthorizationRevision`     | function | `useAuthorizationRevision(): number`                                                                                    | Changes whenever permissions are invalidated.  |
| `useCan`                       | function | `useCan(check \| undefined, { enabled? }): UseCanResult`                                                                | Whether the session may perform a check.       |
| `UseCanOptions`                | type     | `{ enabled?: boolean }`                                                                                                 | Options of `useCan`.                           |
| `UseCanResult`                 | type     | `{ can; isPending; error; retry() }`                                                                                    | Result of `useCan`.                            |
| `AuthorizationCheck`           | type     | `{ resource: { type; id }; action }`                                                                                    | One check.                                     |
| `AuthorizationSnapshot`        | type     | `{ unrestricted; permissions: [{ resource, actions }] }`                                                                | What `GET /permissions` answers.               |
| `PermissionSet`                | type     | `{ key; title?; grants; protection?; unrestricted? }`                                                                   | A set as the server lists it.                  |
| `PermissionSetInput`           | type     | `{ key; title?; grants }`                                                                                               | A complete set for create and update.          |
| `PermissionSetAssignment`      | type     | `{ id; subject; permissionSet }`                                                                                        | An assignment.                                 |
| `PermissionAssignmentInput`    | type     | `{ subject: { type; id } }`                                                                                             | Body of an assignment.                         |
| `AuthorizationOptionsResponse` | type     | `{ sections, resourceGroups?, subjectTypes, recordAccess, collections }`                                                | What an `options` route answers.               |
| `AuthorizationEffect`          | type     | `'permit' \| 'conditional' \| 'deny'`                                                                                   | A decision's effect.                           |
| `AuthorizationReason`          | type     | `{ code; message; plugin? }`                                                                                            | Why a decision was made.                       |
| `AuthorizationPermission`      | type     | `{ resource; actions }`                                                                                                 | One entry of a snapshot.                       |
| `AuthorizationRecordOption`    | type     | `{ id; label; description? }`                                                                                           | One record in a records route.                 |
| `AuthorizationSubject`         | type     | `{ type; id }`                                                                                                          | A subject.                                     |
| `ConfiguredAccess`             | type     | `{ unrestricted; types; resources; identity?; sets? }`                                                                  | What `inspectConfigured` answers.              |
| `ConfiguredPermissionSet`      | type     | `{ key; title?; sources: AuthorizationSubject[] }`                                                                      | One effective set and what brings it.          |
| `PermissionGrant`              | type     | `{ resource: { type; id }; actions: PermissionGrantAction[] }`                                                          | One grant of a set.                            |
| `PermissionGrantAction`        | type     | `{ action; policy? }`                                                                                                   | One action of a grant.                         |
| `PermissionSetProtection`      | type     | `{ owner; allow: PermissionSetWriteOperation[]; assignableTo? }`                                                        | Who may change a protected set.                |
| `PermissionSetWriteOperation`  | type     | `'create' \| 'update' \| 'delete' \| 'assign' \| 'revoke'`                                                              | A write a protection allows.                   |
| `ResourceRef`                  | type     | `{ type; id }`                                                                                                          | The target of a check or grant.                |
| `SubjectPage`                  | type     | `{ items: SubjectOption[]; total }`                                                                                     | One page of a subject search.                  |
| `SubjectOption`                | type     | `{ id; title; description?; manage? }`                                                                                  | One subject in a picker.                       |
| `AuthorizationDecision`        | type     | `{ effect; conditions?; reasons; checks? }`                                                                             | What the inspector answers.                    |
| `AuthorizationInspectInput`    | type     | `{ subject; resource; action }`                                                                                         | Body of `POST /inspector/decide`.              |
| `AuthorizationInspection`      | type     | `{ resource; action; decision }`                                                                                        | One batch or composite check.                  |
| `LocalizedText`                | type     | `string \| { key; ns }`                                                                                                 | A title as the server sends it.                |

| `AuthorizationClient` method                                                                                                | HTTP                                                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `can(check)`, `snapshot()`                                                                                                  | `GET /permissions`, cached until `invalidate()`                                                                                                                                                                               |
| `revision()`, `invalidate()`, `onInvalidated(listener)`                                                                     | none                                                                                                                                                                                                                          |
| `listPermissionSets()`, `getPermissionSet(key)`                                                                             | `GET /permissionSets`, `GET /permissionSets/:key`                                                                                                                                                                             |
| `createPermissionSet(input)`, `updatePermissionSet(key, input)`, `deletePermissionSet(key)`                                 | `POST`, `PATCH`, `DELETE /permissionSets[/:key]`                                                                                                                                                                              |
| `getEffective(subject)`                                                                                                     | `GET /permissionSets?subjectType=&subjectId=`                                                                                                                                                                                 |
| `listAssignments(key)`, `assign(key, input)`, `revoke(key, id)`                                                             | `/permissionSets/:key/assignments[/:assignmentId]`                                                                                                                                                                            |
| `loadOptions(path)`, `listSubjects(path, type, query)`, `resolveSubjects(path, type, ids)`, `listRecords(path, collection)` | `/<path>/options`, `/<path>/subjects/...`, `/<path>/records/:collection` (the first page of 100); `path` is a surface such as `permissionSets`, and `listSubjects` sends `query.search` as `q` and answers `{ items, total }` |
| `inspect(input)`, `inspectBatch(subject, checks)`, `inspectConfigured(subject)`                                             | `POST /inspector/decide`, `POST /inspector/batchDecide`, `GET /inspector/configuredAccess`                                                                                                                                    |

## `@nocobase/app-plugin-authorization/client/plugin`

### Exports

| Export                       | Kind   | Signature                                            | Purpose                      |
| ---------------------------- | ------ | ---------------------------------------------------- | ---------------------------- |
| `default`                    | plugin | `AppClientPluginFactory<AuthorizationClientOptions>` | The client plugin factory.   |
| `AuthorizationClientOptions` | type   | `{}`                                                 | The plugin takes no options. |

## `@nocobase/app-plugin-authorization/client/routes`

### Exports

| Export    | Kind  | Signature                    | Purpose                                                                   |
| --------- | ----- | ---------------------------- | ------------------------------------------------------------------------- |
| `default` | const | `AppClientRouteContribution` | Settings routes for Permission Sets and the inspector, each with `authz`. |

## `@nocobase/app-plugin-authorization/client/react-providers`

### Exports

| Export           | Kind  | Signature                                     | Purpose                                          |
| ---------------- | ----- | --------------------------------------------- | ------------------------------------------------ |
| `default`        | const | `readonly AppClientReactProviderDefinition[]` | The provider that supplies the session's client. |
| `reactProviders` | const | `readonly AppClientReactProviderDefinition[]` | The same value, by name.                         |

## `@nocobase/app-plugin-authorization/client/management`

Exactly what the rule plugins import to build their settings pages; the workspace itself is not exported.

### Exports

| Export                        | Kind      | Purpose                                            |
| ----------------------------- | --------- | -------------------------------------------------- |
| `PermissionsPage`             | component | The settings page frame.                           |
| `useAuthorizationPageData`    | hook      | Loads a rule plugin's options and rules.           |
| `AuthorizationPageState`      | type      | What `useAuthorizationPageData` returns.           |
| `useAuthorizationTranslation` | hook      | Translations in this plugin's namespace.           |
| `Translate`                   | type      | The translate function it returns.                 |
| `ManagementTable`             | component | A rules table.                                     |
| `ManagementToolbar`           | component | Toolbar above a rules table.                       |
| `EmptyTableRow`               | component | Placeholder row.                                   |
| `TablePager`                  | component | Pagination control.                                |
| `pageSlice`                   | function  | One page of a list.                                |
| `FilterBar`                   | component | Filters above a table.                             |
| `SearchField`                 | component | Search input.                                      |
| `SelectField`                 | component | Select input.                                      |
| `Field`                       | component | Labelled form field.                               |
| `ConfirmDialog`               | component | Confirmation dialog.                               |
| `ErrorBox`                    | component | Error display.                                     |
| `errorMessage`                | function  | Readable text of an error.                         |
| `RuleDrawer`                  | component | Drawer that edits one rule.                        |
| `RuleForm`                    | component | The rule form inside it.                           |
| `useRuleDraft`                | hook      | Draft state of a rule being edited.                |
| `ResourceEditor`              | component | Picks the rule's resource.                         |
| `ActionsEditor`               | component | Picks a collection rule's actions.                 |
| `RuleActionsEditor`           | component | Edits a rule's actions and their selections.       |
| `DataScopesEditor`            | component | Edits a composite rule's selection per data scope. |
| `SelectionEditor`             | component | Edits one record selection.                        |
| `SelectionMark`               | component | Shows one record selection compactly.              |
| `SubjectsEditor`              | component | Picks subjects.                                    |
| `useSubjectNames`             | hook      | Resolves subject titles.                           |
| `useSubjectDetails`           | hook      | Resolves subject titles and `manage` paths.        |
| `subjectKey`                  | function  | Stable key of a subject.                           |
| `defaultSelection`            | function  | The initial selection of a rule action.            |
| `incompleteSelection`         | function  | Whether a selection still needs input.             |
| `selectionLabel`              | function  | Readable text of a selection.                      |
| `firstActions`                | function  | The default actions of a new rule.                 |
| `actionLabel`                 | function  | Readable text of an action.                        |
| `resourceLabel`               | function  | Readable text of a resource.                       |
| `titleText`                   | function  | Text of an `AuthorizationTitle`.                   |
| `humanize`                    | function  | Readable text of an identifier.                    |
| `collectionFields`            | function  | Fields of a collection from options.               |
| `findResource`                | function  | The resource with a type and id in options.        |
| `workspaceSubsections`        | function  | Every subsection of options, in section order.     |
| `AuthorizationOptions`        | type      | What an `options` route answers.                   |
| `ResourceGroupOption`         | type      | One group in options.                              |
| `AuthorizationRecordOption`   | type      | One record in a records route.                     |
| `AuthorizationSubject`        | type      | `{ type; id }`.                                    |
| `RecordSelection`             | type      | A record selection, as the client edits it.        |
| `DataScopeRuleAction`         | type      | One action of a composite rule with its scope.     |

## `@nocobase/app-plugin-authorization/package.json`

The package manifest, for tools that read its version.
