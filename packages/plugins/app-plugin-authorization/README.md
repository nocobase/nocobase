# @nocobase/app-plugin-authorization

NocoBase application integration for authorization: authenticated identities, Permission Sets, pages, settings, composite resources, database field, record and relation policies, the `/api/authz` HTTP surface and the permission workspace UI. It builds on [`@nocobase/authorization`](../../libs/authorization/README.md), whose terms and contracts apply unchanged. For configuration without code, read the [user guide](../../../docs/docs/en/capabilities/authorization/index.md); for implementing a feature, read the [development Skill](skills/nocobase-app-plugin-authorization/SKILL.md).

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
                                    · composite · plugin types                HTTP:   /api/authz/*

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

A composite action composes exactly the grants its definition lists, on any resource type except another composite. A data scope binds to the one collection its grant actions address; `database.collection` declares `recordAccess`, which a data scope's target type needs. `.grant(key, permission, { title? })` binds a database permission to a data scope named `key`. Read fields govern output and create or update fields govern input; delete has none. `.options(...references)` limits the record access a grant may choose and `.default(reference)` sets the value used when a grant chooses nothing.

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

Every route installs authentication, then `authz.middleware()`, which sets the `authz` variable to the request's `AuthorizationContext`. A denied `require` throws `AuthorizationDeniedError`, which answers `403 { code: 'FORBIDDEN', message }` on its own, so a route needs no `onError` for it.

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
  if (decision.effect === 'deny') return c.json({ code: 'FORBIDDEN' }, 403);
  const quotesPolicy = decision.conditions?.database?.quotes;
  const projectsPolicy = decision.conditions?.database?.projects;
  if (!quotesPolicy || !projectsPolicy)
    return c.json({ code: 'FORBIDDEN' }, 403);
  await database.transaction(async (connection) => {
    const project = await connection
      .repository('projects')
      .withPolicy(projectsPolicy)
      .findOne({ filter: { id: projectId } });
    await connection
      .repository('quotes')
      .withPolicy(quotesPolicy)
      .updateOne({
        filter: { id: c.req.param('id') },
        values: { status: 'submitted' },
      });
  });
  return c.json({ ok: true });
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

Every path is under `/api/authz` and requires a signed-in user. Settings checks use `{ resource: { type: 'settings', id }, action }`. Successful responses wrap results in `{ data }`; creation answers `201` and deletion `204`. Errors answer `401` without a session, `403 { code: 'FORBIDDEN', message }`, `400 { code: 'INVALID_AUTHORIZATION_INPUT', message }`, `404` for an unknown key and `409` for a protected set or its last required assignment.

| Method and path                                | Required permission                               | Request                                       | Response `data`                                        |
| ---------------------------------------------- | ------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------ |
| `GET /permissions`                             | Signed in                                         |                                               | `AuthorizationSnapshot`                                |
| `GET /permission-sets/options`                 | `settings:authorization.permission-sets` `read`   |                                               | `AuthorizationOptions`                                 |
| `GET /permission-sets/subjects/:type`          | `settings:authorization.permission-sets` `read`   | query `search?`, `page`, `pageSize`           | `{ items: SubjectOption[], total }`                    |
| `POST /permission-sets/subjects/:type/resolve` | `settings:authorization.permission-sets` `read`   | `{ ids: string[] }`                           | `SubjectOption[]`                                      |
| `GET /permission-sets`                         | `settings:authorization.permission-sets` `read`   |                                               | `PermissionSet[]` with `protection` and `unrestricted` |
| `POST /permission-sets`                        | `settings:authorization.permission-sets` `create` | `{ key, title?, grants }`                     | `PermissionSet`                                        |
| `GET /permission-sets/:key`                    | `settings:authorization.permission-sets` `read`   |                                               | `PermissionSet`                                        |
| `PUT /permission-sets/:key`                    | `settings:authorization.permission-sets` `update` | `{ key, title?, grants }`, complete           | `PermissionSet`                                        |
| `DELETE /permission-sets/:key`                 | `settings:authorization.permission-sets` `delete` |                                               | none                                                   |
| `GET /permission-sets/effective/:type/:id`     | `settings:authorization.permission-sets` `read`   |                                               | `PermissionSet[]` the subject holds                    |
| `GET /permission-sets/:key/assignments`        | `settings:authorization.permission-sets` `read`   |                                               | `PermissionSetAssignment[]`                            |
| `POST /permission-sets/:key/assignments`       | `settings:authorization.permission-sets` `assign` | `{ subject: { type, id } }`                   | `PermissionSetAssignment`                              |
| `DELETE /permission-sets/:key/assignments/:id` | `settings:authorization.permission-sets` `assign` |                                               | none                                                   |
| `GET /inspector/options`                       | `settings:authorization.inspector` `inspect`      |                                               | `AuthorizationOptions`                                 |
| `GET /inspector/subjects/:type`                | `settings:authorization.inspector` `inspect`      | query `search?`, `page`, `pageSize`           | `{ items: SubjectOption[], total }`                    |
| `POST /inspector/subjects/:type/resolve`       | `settings:authorization.inspector` `inspect`      | `{ ids: string[] }`                           | `SubjectOption[]`                                      |
| `POST /inspector/decision`                     | `settings:authorization.inspector` `inspect`      | `{ subject, resource, action }`               | `AuthorizationDecision`, with `checks` for a composite |
| `POST /inspector/batch`                        | `settings:authorization.inspector` `inspect`      | `{ subject, checks: [{ resource, action }] }` | `[{ resource, action, decision }]`                     |
| `POST /inspector/configured`                   | `settings:authorization.inspector` `inspect`      | `{ subject }`                                 | `{ unrestricted, types, resources, identity, sets }`   |
| `GET /<rule>`                                  | `settings:authorization.<rule>` `read`            |                                               | rules                                                  |
| `POST /<rule>`                                 | `settings:authorization.<rule>` `create`          | a complete rule                               | the rule                                               |
| `PUT /<rule>/:key`                             | `settings:authorization.<rule>` `update`          | a complete rule                               | the rule                                               |
| `DELETE /<rule>/:key`                          | `settings:authorization.<rule>` `delete`          |                                               | none                                                   |
| `GET /<rule>/options`                          | `settings:authorization.<rule>` `read`            |                                               | `AuthorizationOptions`                                 |
| `GET /<rule>/subjects/:type`                   | `settings:authorization.<rule>` `read`            | query `search?`, `page`, `pageSize`           | `{ items: SubjectOption[], total }`                    |
| `POST /<rule>/subjects/:type/resolve`          | `settings:authorization.<rule>` `read`            | `{ ids: string[] }`                           | `SubjectOption[]`                                      |
| `GET /<rule>/records/:collection`              | `settings:authorization.<rule>` `read`            |                                               | `[{ id, label, description? }]`                        |

`<rule>` is each of `default-access`, `sharing-rules` and `restriction-rules`, present only when that plugin is configured. Options, subjects and records stay per plugin, each gated by that plugin's own settings item. A subject directory may enforce further read checks of its own. The inspector evaluates one subject: a user includes the `authenticated` audience and resolved memberships, while inspecting a team describes that team's grants alone. `configured` also answers `identity: { subjects }`, the subjects a request for that principal would carry, and `sets: [{ key, title?, sources }]`, where `sources` lists the assignments, to the principal itself or to one of those subjects, that bring each effective set; the default set has none.

Subject pagination accepts `page >= 1` and `1 <= pageSize <= 100` (default 30) and answers `400 { code: 'INVALID_PAGINATION' }` otherwise. A type without a collection selection answers `404 { code: 'UNKNOWN_SUBJECT_TYPE' }`.

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
| `AuthorizationCollection`             | type     | `{ name, fields, relations?, primaryKey, generatedPrimaryKey }`                                                                                                             | Collection metadata read from the database.                                                               |
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

Helpers for plugins that add an authorization settings surface. A rule plugin registers its handler with `authz.routes.add('/<rule>', createRouteHandler(router))` and serves its options, subjects and records through `createRuleSupportRoutes`.

```ts
import {
  createRouteHandler,
  createSettingsRouter,
  parse,
  requireSettings,
} from '@nocobase/app-plugin-authorization/server/extension';

const router = createSettingsRouter();
router.get('/', async (c) => {
  await requireSettings(
    c.env.authorization,
    'authorization.sharing-rules',
    'read',
  );
  return c.json({ data: await authz.sharingRules.list() });
});
authz.routes.add('/sharing-rules', createRouteHandler(router));
```

### Exports

| Export                       | Kind     | Signature                                                                                                                                                | Purpose                                                                              |
| ---------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `createSettingsRouter`       | function | `createSettingsRouter(): Hono<SettingsRouterEnv>`                                                                                                        | A router that maps denials to `403` and malformed input to `400`.                    |
| `SettingsRouterEnv`          | type     | `{ Bindings: { authorization: AuthorizationContext } }`                                                                                                  | The router's environment.                                                            |
| `createRouteHandler`         | function | `createRouteHandler(router): AuthorizationRouteHandler`                                                                                                  | Adapts a router to `authz.routes.add`.                                               |
| `requireSettings`            | function | `requireSettings(authorization, id, action): Promise<void>`                                                                                              | The one settings check: `settings:<id>` `<action>`, with the full settings id.       |
| `createRuleSupportRoutes`    | function | `createRuleSupportRoutes(authz, rule): Hono<SettingsRouterEnv>`                                                                                          | `options`, `subjects` and `records` routes gated by the rule's settings item.        |
| `parse`                      | const    | `parse.object`, `parse.string`, `parse.strings`, `parse.title`, `parse.resource`, `parse.subjects`, `parse.selection`, `parse.ruleActions`, `parse.rule` | Request body parsers that throw `TypeError`.                                         |
| `validateDataScopeRule`      | function | `validateDataScopeRule(authz, rule): void`                                                                                                               | Checks a rule's actions, data scopes and record access against the registered model. |
| `DatabaseConnectionHandle`   | class    | `new DatabaseConnectionHandle(owner, connection?)`; `set(connection)`, `resolve()`                                                                       | Late-bound connection for a store created before setup.                              |
| `DatabaseConnectionSource`   | type     | `() => DatabaseConnection`                                                                                                                               | What a handle resolves a connection from.                                            |
| `describeCollection`         | function | `describeCollection(connection, name): Promise<AuthorizationCollection \| undefined>`                                                                    | Reads a collection's metadata.                                                       |
| `DataScopeRuleInput`         | type     | `{ resource: ResourceRef; actions: readonly RuleAction[] }`                                                                                              | What `validateDataScopeRule` checks.                                                 |
| `AuthorizationExtensionHost` | type     | `{ ui, resourceTypes, recordAccess, subjects, composites, database }`                                                                                    | The part of `authz` the support routes read.                                         |

## `@nocobase/app-plugin-authorization/client`

### Exports

| Export                         | Kind     | Signature                                                                                                               | Purpose                                       |
| ------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `default`                      | plugin   | `defineClientPlugin(...)`                                                                                               | The client plugin to register.                |
| `AuthorizationClient`          | class    | `can(check)`, `snapshot()`, `revision()`, `invalidate()`, `onInvalidated(listener)`, permission-set and inspector calls | Session-scoped access to `/api/authz`.        |
| `authorizationClientToken`     | const    | `ServiceToken<AuthorizationClient>`                                                                                     | Resolves the client outside React.            |
| `useAuthorizationClient`       | function | `useAuthorizationClient(): AuthorizationClient`                                                                         | The client in a component.                    |
| `useAuthorizationRevision`     | function | `useAuthorizationRevision(): number`                                                                                    | Changes whenever permissions are invalidated. |
| `useCan`                       | function | `useCan(check \| undefined, { enabled? }): UseCanResult`                                                                | Whether the session may perform a check.      |
| `UseCanOptions`                | type     | `{ enabled?: boolean }`                                                                                                 | Options of `useCan`.                          |
| `UseCanResult`                 | type     | `{ can; isPending; error; retry() }`                                                                                    | Result of `useCan`.                           |
| `AuthorizationCheck`           | type     | `{ resource: { type; id }; action }`                                                                                    | One check.                                    |
| `AuthorizationSnapshot`        | type     | `{ unrestricted; permissions: [{ resource, actions }] }`                                                                | What `GET /permissions` answers.              |
| `PermissionSet`                | type     | `{ key; title?; grants; protection?; unrestricted? }`                                                                   | A set as the server lists it.                 |
| `PermissionSetInput`           | type     | `{ key; title?; grants }`                                                                                               | A complete set for create and update.         |
| `PermissionSetAssignment`      | type     | `{ id; subject; permissionSet }`                                                                                        | An assignment.                                |
| `PermissionAssignmentInput`    | type     | `{ subject: { type; id } }`                                                                                             | Body of an assignment.                        |
| `AuthorizationOptionsResponse` | type     | `{ sections, resourceGroups?, subjectTypes, recordAccess, collections }`                                                | What an `options` route answers.              |
| `AuthorizationEffect`          | type     | `'permit' \| 'conditional' \| 'deny'`                                                                                   | A decision's effect.                          |
| `AuthorizationReason`          | type     | `{ code; message; plugin? }`                                                                                            | Why a decision was made.                      |
| `AuthorizationPermission`      | type     | `{ resource; actions }`                                                                                                 | One entry of a snapshot.                      |
| `AuthorizationRecordOption`    | type     | `{ id; label; description? }`                                                                                           | One record in a records route.                |
| `AuthorizationSubject`         | type     | `{ type; id }`                                                                                                          | A subject.                                    |
| `ConfiguredAccess`             | type     | `{ unrestricted; types; resources; identity?; sets? }`                                                                  | What `inspectConfigured` answers.             |
| `ConfiguredPermissionSet`      | type     | `{ key; title?; sources: AuthorizationSubject[] }`                                                                      | One effective set and what brings it.         |
| `PermissionGrant`              | type     | `{ resource: { type; id }; actions: PermissionGrantAction[] }`                                                          | One grant of a set.                           |
| `PermissionGrantAction`        | type     | `{ action; policy? }`                                                                                                   | One action of a grant.                        |
| `PermissionSetProtection`      | type     | `{ owner; allow: PermissionSetWriteOperation[]; assignableTo? }`                                                        | Who may change a protected set.               |
| `PermissionSetWriteOperation`  | type     | `'create' \| 'update' \| 'delete' \| 'assign' \| 'revoke'`                                                              | A write a protection allows.                  |
| `ResourceRef`                  | type     | `{ type; id }`                                                                                                          | The target of a check or grant.               |
| `SubjectPage`                  | type     | `{ items: SubjectOption[]; total }`                                                                                     | One page of a subject search.                 |
| `SubjectOption`                | type     | `{ id; title; description?; manage? }`                                                                                  | One subject in a picker.                      |
| `AuthorizationDecision`        | type     | `{ effect; conditions?; reasons; checks? }`                                                                             | What the inspector answers.                   |
| `AuthorizationInspectInput`    | type     | `{ subject; resource; action }`                                                                                         | Body of `POST /inspector/decision`.           |
| `AuthorizationInspection`      | type     | `{ resource; action; decision }`                                                                                        | One batch or composite check.                 |
| `LocalizedText`                | type     | `string \| { key; ns }`                                                                                                 | A title as the server sends it.               |

| `AuthorizationClient` method                                                                                                | HTTP                                                                     |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `can(check)`, `snapshot()`                                                                                                  | `GET /permissions`, cached until `invalidate()`                          |
| `revision()`, `invalidate()`, `onInvalidated(listener)`                                                                     | none                                                                     |
| `listPermissionSets()`, `getPermissionSet(key)`                                                                             | `GET /permission-sets`, `GET /permission-sets/:key`                      |
| `createPermissionSet(input)`, `updatePermissionSet(key, input)`, `deletePermissionSet(key)`                                 | `POST`, `PUT`, `DELETE /permission-sets[/:key]`                          |
| `getEffective(subject)`                                                                                                     | `GET /permission-sets/effective/:type/:id`                               |
| `listAssignments(key)`, `assign(key, input)`, `revoke(key, id)`                                                             | `/permission-sets/:key/assignments[/:id]`                                |
| `loadOptions(path)`, `listSubjects(path, type, query)`, `resolveSubjects(path, type, ids)`, `listRecords(path, collection)` | `/<path>/options`, `/<path>/subjects/...`, `/<path>/records/:collection` |
| `inspect(input)`, `inspectBatch(subject, checks)`, `inspectConfigured(subject)`                                             | `/inspector/decision`, `/inspector/batch`, `/inspector/configured`       |

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
