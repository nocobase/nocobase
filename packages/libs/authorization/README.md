# @nocobase/authorization

Authorization decisions, resource types, composite resources, Permission Sets and record-scope rules for Node applications. A NocoBase application normally resolves `authorizationToken` from `@nocobase/app-plugin-authorization/server`, which builds on this library and adds database enforcement, persistence, pages, settings, HTTP management and the React UI. Use this library directly to embed authorization in a host of your own, to write an authorization plugin, or to read the contracts the application plugin implements.

## Terminology

Every word below has exactly one meaning in this package.

| Term                  | Meaning                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resource ref          | `{ type, id }`: the target of a check or a grant. Every grant states its type; there is no default type.                                                                                                                                                                                                                                                                |
| Resource type         | The only unit of judgement, never displayed and untitled: an optional item registry, declared actions, an authorize function and the `recordAccess` capability. Registered with `authz.resourceTypes.add`; the name `composite` is reserved.                                                                                                                            |
| Item                  | One grantable thing of a resource type, `{ id, title, description?, actions }`. Only a catalog type has items; there an unregistered `(type, id, action)` is denied.                                                                                                                                                                                                    |
| Composite resource    | A built-in core mechanism, with no plugin: a resource whose actions expand into a set of underlying grants, each optionally bound to a named data scope. Stored under the reserved type `composite` and registered with `authz.compositeResources.define`, which every Authorization has; it composes exactly the grants its definition lists, never another composite. |
| Data scope            | A named slot on a composite action, `{ key, title, options?, defaultValue? }`, that a grant or rule fills with a record selection. Its target is the one resource the grant actions naming it address, and that resource's type must declare `recordAccess`.                                                                                                            |
| Record selection      | `{ type: 'all' } \| { type: 'records', ids } \| { type: 'recordAccess', key, params? }`: which records of a collection an action reaches.                                                                                                                                                                                                                               |
| Record access         | A named, code-defined way to select records, such as "records I own". Registered with `authz.recordAccess.define`.                                                                                                                                                                                                                                                      |
| Grant                 | One `(resource, action, policy?)` a Grant Provider resolves for an identity. A Permission Set stores grants.                                                                                                                                                                                                                                                            |
| Constraint            | A rule's `expand` or `restrict` contribution of a record selection to one action.                                                                                                                                                                                                                                                                                       |
| Authorization context | `authz.for(identity)`: every check for one identity, sharing grant and rule reads between them.                                                                                                                                                                                                                                                                         |
| Snapshot              | `context.snapshot()`: what the client may show, `{ unrestricted, permissions }`.                                                                                                                                                                                                                                                                                        |

## Layers

```text
 storage                     judgement                                   use
 ───────────────────────     ──────────────────────────────────────      ───────────────────────────
 Permission Sets ──grants──▶ Grant Provider                             authz.for(identity)
                             └▶ composite expansion ─┐                    ├ authorize(request)
 Default access  ─┐                                  ▼                    ├ can(request)
 Sharing rules   ─┼─constraints──────────────▶ resource type             ├ require(request)
 Restriction     ─┘                              (items + authorize)      └ snapshot()
                             record access ──▶ resolved by the adapter   authz.middleware(), authz.routes
```

The library has no display concepts. Where a resource is listed in a workspace is the host's concern; the application plugin provides `authz.ui` for it.

## Entry points

| Import                                      | Contents                                                                                                  |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `@nocobase/authorization`                   | Everything below, re-exported.                                                                            |
| `@nocobase/authorization/core`              | `createAuthorization`, registries, resource types, composite resources, record access, selections, types. |
| `@nocobase/authorization/permission-sets`   | `permissionSetsPlugin`, `definePermissionSet`, the Permission Set store contract and errors.              |
| `@nocobase/authorization/default-access`    | `defaultAccessPlugin`, `defineDefaultAccessRule` and the default-access store contract.                   |
| `@nocobase/authorization/sharing-rules`     | `sharingRulesPlugin`, `defineSharingRule` and the sharing-rule store contract.                            |
| `@nocobase/authorization/restriction-rules` | `restrictionRulesPlugin`, `defineRestrictionRule` and the restriction-rule store contract.                |

The library ships no store and no HTTP handler. Each plugin factory takes a `store` implementing its store interface; the application plugin supplies database-backed ones.

## Create and check

```ts
import {
  ResourceItems,
  createAuthorization,
} from '@nocobase/authorization/core';
import {
  definePermissionSet,
  permissionSetsPlugin,
} from '@nocobase/authorization/permission-sets';

const authz = createAuthorization({
  plugins: [permissionSetsPlugin({ store })],
});
const reports = new ResourceItems();
authz.resourceTypes.add({ type: 'report', items: reports });
reports.add({ id: 'sales', title: 'Sales report', actions: ['view'] });

await authz.permissionSets.create(
  definePermissionSet('report-reader')
    .title('Report reader')
    .grant({
      resource: { type: 'report', id: 'sales' },
      actions: [{ action: 'view' }],
    })
    .build(),
);
await authz.permissionSets.assign({
  permissionSet: 'report-reader',
  subject: { type: 'user', id: 'alice' },
});

const context = authz.for({ principal: { type: 'user', id: 'alice' } });
await context.require({
  resource: { type: 'report', id: 'sales' },
  action: 'view',
});
```

The principal is the authenticated actor; `subjects` adds verified memberships such as teams, and the principal itself also matches grants. `authz.for(identity)` uses the identity it is given: resolve memberships before calling it, or install identity middleware and use `authz.middleware()`, which resolves them per request.

| `AuthorizationContext` member | Result                                                                                                                                          |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `identity`                    | The identity the context was created for.                                                                                                       |
| `authorize(request)`          | The full decision: `permit`, `deny`, or `conditional` with `conditions`. For type `composite` the conditions are `CompositeResourceConditions`. |
| `can(request)`                | `true` only for `permit`. A conditional decision counts as `false`.                                                                             |
| `require(request)`            | Throws `AuthorizationDeniedError` unless the decision is `permit`. Uncaught in a Hono route, it answers `403 { code: 'FORBIDDEN', message }`.   |
| `snapshot()`                  | `{ unrestricted, permissions }` for the client; see [Snapshot](#snapshot).                                                                      |

Create one context per request and reuse it within that request only. Unknown types, conditional decisions without conditions and handler failures deny. Execute a conditional decision only through the adapter that understands its conditions.

## Server checks through middleware

```ts
import { Hono } from 'hono';
import type { AuthorizationEnv } from '@nocobase/authorization/core';

authz.use(async (request, next) => {
  request.principal = { type: 'user', id: readSession(request.http).userId };
  request.subjects.add({ type: 'authenticated', id: '*' });
  await next();
});

const router = new Hono<AuthorizationEnv>();
router.use('*', authz.middleware());
router.get('/reports/:id', async (c) => {
  const context = c.get('authz');
  await context.require({
    resource: { type: 'report', id: c.req.param('id') },
    action: 'view',
  });
  const decision = await context.authorize({
    resource: { type: 'composite', id: 'sales.quotes' },
    action: 'submit',
  });
  return c.json({ effect: decision.effect });
});
```

Plugins register HTTP handlers with `authz.routes.add(path, handler)`; the host mounts one dispatcher and calls `authz.routes.handle({ request, path, authorization })`, which answers `undefined` for a path no plugin claims. A handler receives the request's `AuthorizationContext` as `authorization`.

## Custom resource type

A resource type comes in one of two shapes, told apart only by whether it has an item registry.

- A **catalog type** passes `items`. A check passes only for a registered item and one of its actions; anything else is denied with `RESOURCE_ACTION_NOT_SUPPORTED`. `settings`, `composite` and `database.collection` are catalog types.
- A **record type** declares only type-level `actions`. Only the action is validated: an undeclared action is denied, while the id is a runtime record id that the type's `authorize` judges per record. `page`, `hub.app`, `user` and `notification` are record types, and their grants use `id: '*'` to mean every record.

A resource type has no title: it is never displayed. `resourceTypes.add` returns `{ type, actions, recordAccess, items? }` and throws for the reserved name `composite`. Set `recordAccess: true` on a type whose grants can be narrowed to records, as `database.collection` does; only such a type can be the target of a composite's data scope. The default judgement is `grantBacked()`: permit when a grant without a policy matches. Pass `also` for a further check once a grant matches.

```ts
import { ResourceItems, grantBacked } from '@nocobase/authorization/core';

authz.resourceTypes.add({
  type: 'hub.app',
  actions: ['read', { name: 'deploy', title: 'Deploy' }],
  authorize: grantBacked({
    also: async (request) => ownsApp(request.principal.id, request.resource.id),
  }),
});

const settings = new ResourceItems();
authz.resourceTypes.add({ type: 'settings', items: settings });
settings.add({ id: 'workflow', title: 'Workflow', actions: ['manage'] });
```

In a catalog type an item that omits `actions` inherits the type's declared actions and their titles; a catalog type that declares none requires actions on every item. A type action may carry its own `authorize` and `authorizeUnrestricted`. Unsupported items and actions stay denied even for unrestricted identities.

`authz.resourceTypes.get(type).items.add(item)` is the generic, low-level registration of an item in any catalog type. The higher-level registrations build on it: the application plugin's `authz.settings.add` adds a `settings` item, its `authz.database.collections.add` adds a `database.collection` item, and `authz.compositeResources.define` adds a `composite` item after validating the definition. Prefer those where they exist, since they also carry the validation and metadata their type needs; use `items.add` directly for a catalog type of your own.

## Composite resources and data scopes

Composites are built into the core: every Authorization has `authz.compositeResources`, handed to each plugin's `setup` as `composites`, and registers the reserved `composite` resource type itself, so no plugin is installed for them. A composite is a resource whose actions expand into a set of underlying grants, each optionally bound to a named data scope. It composes exactly what its definition lists, on any resource type; the one structural rule is that no underlying grant may target another composite, so composites never nest and never cycle. Business operations are defined as composite resources.

A grant action names a data scope with `scopeKey`. Every grant action naming the same scope must address the same one resource, and that resource is the scope's target; `dataScopeTarget(action, key)` returns it and throws when no grant action or more than one resource names the scope. The target's type must declare `recordAccess: true`. `define` checks this when the target type is already registered and throws otherwise; a type registered later is checked by `authz.compositeResources.validate()`, which lists every unfit data scope, and on first use.

A stored composite grant that no longer expands against the current definition — an unknown action, an unknown or invalid data scope value, a malformed policy, or an unfit data scope target — is skipped for that grant alone: it permits nothing, contributes nothing to the snapshot, and the identity's other grants keep working. A direct check of that composite action, with no other valid grant, denies with `INVALID_GRANT`, naming the grant's source and the problem. `createAuthorization({ onInvalidGrant })` is told once per distinct grant and problem, with `{ source, resource, action, reason }`; the library has no logger of its own. `authz.compositeResources.validateGrant({ resource, action, policy? })` returns the same problem for a stored grant, or `undefined`, so a host can scan its stored grants at startup. The library does not validate grants on save; a host that accepts grants from administrators checks them there.

Object form:

```ts
import { createAuthorization } from '@nocobase/authorization/core';

const authz = createAuthorization({
  plugins: [permissionSetsPlugin({ store })],
});
authz.compositeResources.define({
  name: 'sales.quotes',
  title: 'Quotes',
  actions: [
    {
      name: 'submit',
      title: 'Submit',
      dataScopes: [
        {
          key: 'quotes',
          title: 'Quotes',
          options: ['recordsIOwn', 'allRecords'],
          defaultValue: 'recordsIOwn',
        },
      ],
      grants: [
        {
          resource: { type: 'database.collection', id: 'quotes' },
          actions: [
            {
              action: 'update',
              policy: { type: 'database', fields: ['status'] },
              scopeKey: 'quotes',
            },
          ],
        },
      ],
    },
  ],
});
```

Builder form, where a `BindableCompositeResourcePermission` such as the application plugin's `defineDatabasePermission(...)` becomes a data scope when bound to a key:

```ts
import { defineCompositeResource } from '@nocobase/authorization/core';

export const quotes = defineCompositeResource('sales.quotes', (resource) =>
  resource
    .title('Quotes')
    .action('submit', (action) =>
      action.title('Submit').grant('quotes', quoteData, { title: 'Quotes' }),
    ),
);
const reference = authz.compositeResources.define(quotes);
```

A builder result keeps `.build()` and `.reference()`; `define` accepts either form and returns a `CompositeResourceReference`. The reference builds type-safe grants and rule targets:

```ts
reference.grant('submit');
// { resource: { type: 'composite', id: 'sales.quotes' }, actions: [{ action: 'submit' }] }
reference.grant({ submit: { quotes: 'allRecords' } });
// actions: [{ action: 'submit', policy: { type: 'composite', scopes: { quotes: 'allRecords' } } }]
reference.scope('submit', 'quotes'); // { action: 'submit', scopeKey: 'quotes' }
```

A data scope value is a `RecordSelection` or, as shorthand, a record access key; `options` limits the keys a grant may choose. When a composite grant resolves, each composed grant carries `origin: { resource, action, scopeKey?, selection?, constraints? }`, where `selection` is the grant's value or the scope's `defaultValue`, and `constraints` are the rules that apply to that composite branch only. Authorizing a composite action checks every composed target once, with that action's grants only, and answers `CompositeResourceConditions { type: 'composite', checks, ...plugin contributions }`; a plugin contributes through `composeConditions(checks)`. A denied underlying check makes the decision `conditional` rather than denying the whole composite; the database plugin folds that check into a `false` policy, which a Repository refuses to run under, while a granted check whose data scope selects no records folds into a scope that matches no rows.

## Record access

```ts
import { defineRecordAccess } from '@nocobase/authorization/core';

const prepared = defineRecordAccess('sales.prepared', (access) =>
  access
    .title('Prepared by me')
    .collections('quotes')
    .params<{ field?: string }>({ type: 'object' })
    .resolver(({ principal, params }) => ({
      field: params.field ?? 'preparedById',
      equals: principal.id,
    })),
);
const reference = authz.recordAccess.define(prepared); // { key: 'sales.prepared', collections: ['quotes'] }
```

`define` performs the build and also accepts the object form `{ key, title?, description?, collections, paramsSchema?, resolve }`. `collections('*')` applies to every collection. The library never interprets a resolver's result; the database adapter does, when it compiles `{ type: 'recordAccess', key, params }` selections. `recordAccess.resolve(key, { principal, collection, action, params })` rejects a key that does not apply to the collection.

## Record selections and rules

```ts
import { selection } from '@nocobase/authorization/core';
import { defineDefaultAccessRule } from '@nocobase/authorization/default-access';
import { defineSharingRule } from '@nocobase/authorization/sharing-rules';
import { defineRestrictionRule } from '@nocobase/authorization/restriction-rules';

const target = quotes.reference();
await authz.defaultAccess.create(
  defineDefaultAccessRule('quotes-baseline', target)
    .scope('submit', 'quotes', selection.recordAccess('sales.prepared'))
    .build(),
);
await authz.sharingRules.create(
  defineSharingRule('handover', target)
    .title('Handover')
    .subjects({ type: 'user', id: 'alice' })
    .scope('submit', 'quotes', selection.records(['quote-7']))
    .reason('Covering for Bob')
    .build(),
);
await authz.restrictionRules.create(
  defineRestrictionRule('own-only', target)
    .subjects({ type: 'team', id: 'interns' })
    .scope('submit', 'quotes', selection.recordAccess('recordsIOwn'))
    .build(),
);
```

The three rules share one shape. `DefaultAccessRule` is `{ key, resource, actions }`; `SharingRule` and `RestrictionRule` add `title?`, `subjects` and `reason?`. Each action is a `RuleAction { action, scopeKey?, selection }`. A rule on a composite names the data scope in `scopeKey` and applies to that composite branch only; a rule on the scope's target resource itself omits it and applies across every branch. Default access expands every identity's records; sharing expands the listed subjects' records and rejects `all`; restriction intersects the listed subjects' records and accepts every selection. No rule grants an action that no grant allows. An unrestricted identity skips every rule.

## Snapshot

`snapshot().permissions` lists `(type, id, action)` exactly when `context.can({ resource: { type, id }, action })` is true. The candidates are the identity's grants after composite expansion, deduplicated, with `id: '*'` kept as written; each candidate is decided the way `can()` decides it. As a result the snapshot leaves out:

- `database.collection` grants with record access, whose decision is `conditional`;
- row-level visibility, which only the adapter's policy can answer;
- unregistered items and actions.

An unrestricted identity returns `{ unrestricted: true, permissions: [] }`: every registered action is permitted.

## HTTP routes

The library defines no HTTP route. `authz.routes` only dispatches the routes plugins add; the application plugin documents the `/api/authz` surface.

## `@nocobase/authorization/core`

### Exports

| Export                                | Kind     | Signature                                                                                                                                                                              | Purpose                                                                                                                                                                            |
| ------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createAuthorization`                 | function | `createAuthorization({ connection?, plugins, onInvalidGrant? }): Authorization & AuthorizationPluginApis<plugins>`                                                                     | Creates an instance and runs every plugin's `setup` in dependency order.                                                                                                           |
| `Authorization`                       | class    | `resourceTypes`, `composites`, `recordAccess`, `constraints`, `subjects`, `routes`; `use(m)`, `middleware()`, `for(identity)`, `onGrantsChanged(listener)`                             | The instance; plugin APIs such as `permissionSets` are added to it.                                                                                                                |
| `AuthorizationContext`                | type     | `{ identity, authorize(request), can(request), require(request), snapshot() }`                                                                                                         | Checks for one identity.                                                                                                                                                           |
| `AuthorizationCheckRequest`           | type     | `{ resource: ResourceRef; action: string; params? }`                                                                                                                                   | A request made through a context, which supplies the identity.                                                                                                                     |
| `AuthorizationSnapshot`               | type     | `{ unrestricted: boolean; permissions: readonly AuthorizationPermission[] }`                                                                                                           | What the client may show.                                                                                                                                                          |
| `AuthorizationPermission`             | type     | `{ resource: ResourceRef; actions: readonly string[] }`                                                                                                                                | One snapshot entry.                                                                                                                                                                |
| `AuthorizationEnv`                    | type     | `{ Variables: { authz: AuthorizationContext } }`                                                                                                                                       | Hono environment of `middleware()`.                                                                                                                                                |
| `CreateAuthorizationOptions`          | type     | `{ connection?: TConnection; plugins: TPlugins; onInvalidGrant?(grant: InvalidGrant): void }`                                                                                          | Options of `createAuthorization`.                                                                                                                                                  |
| `InvalidGrant`                        | type     | `{ source: AuthorizationGrantSource; resource: ResourceRef; action: string; reason: string }`                                                                                          | A stored composite grant that was skipped.                                                                                                                                         |
| `AuthorizationPlugin`                 | type     | `AuthorizationPlugin<TApi, TConnection, TRequiredApi>`: `{ id, dependencies?, grants?, requiresGrants?, authorizationApi?, composeConditions?(checks), setup?(setup & TRequiredApi) }` | A plugin; `setup` also receives every installed plugin's API.                                                                                                                      |
| `AuthorizationPluginSetup`            | type     | `{ connection?, grants, resourceTypes, composites, recordAccess, constraints, subjects, routes, use(m), middleware() }` plus every installed plugin's API                              | What `setup` receives.                                                                                                                                                             |
| `AuthorizationPluginApi`              | type     | `AuthorizationPluginApi<TPlugin>`                                                                                                                                                      | The `authorizationApi` type of one plugin.                                                                                                                                         |
| `AuthorizationPluginApis`             | type     | `AuthorizationPluginApis<TPlugins>`                                                                                                                                                    | The intersection of every plugin API.                                                                                                                                              |
| `AuthorizationMiddleware`             | type     | `(request: AuthorizationMiddlewareRequest, next) => Promise<void>`                                                                                                                     | One identity step registered with `use`.                                                                                                                                           |
| `AuthorizationMiddlewareRequest`      | type     | `{ http: Context; principal?: Principal; subjects: AuthorizationSubjectCollection }`                                                                                                   | What an identity step fills in.                                                                                                                                                    |
| `AuthorizationMiddlewareNext`         | type     | `() => Promise<void>`                                                                                                                                                                  | Continues to the next identity step.                                                                                                                                               |
| `AuthorizationSubjectCollection`      | type     | `{ add(subject): void; values(): readonly AuthorizationSubject[] }`                                                                                                                    | Deduplicated subjects of one request.                                                                                                                                              |
| `AuthorizationRouteRegistry`          | class    | `add(path, handler)`, `list()`, `handle(input): Promise<Response> \| undefined`                                                                                                        | Plugin HTTP handlers under one dispatcher.                                                                                                                                         |
| `AuthorizationRouteHandler`           | type     | `(input: AuthorizationRouteRequest) => Promise<Response>`                                                                                                                              | A plugin HTTP handler.                                                                                                                                                             |
| `AuthorizationRouteRequest`           | type     | `{ request: Request; path: string; authorization: AuthorizationContext }`                                                                                                              | What a route handler receives; `path` is relative to the mount.                                                                                                                    |
| `ResourceTypeRegistry`                | class    | `add(definition): RegisteredResourceType`, `has(type)`, `get(type)`, `list()`                                                                                                          | Every resource type; `get` throws for an unregistered type.                                                                                                                        |
| `ResourceTypeDefinition`              | type     | `{ type, actions?, recordAccess?, items?, authorize?, authorizeUnrestricted? }`                                                                                                        | What `resourceTypes.add` takes; `type` may not be `composite`.                                                                                                                     |
| `ResourceTypeAction`                  | type     | `{ name, title?, authorize?, authorizeUnrestricted? }`                                                                                                                                 | A declared action, optionally with its own judgement.                                                                                                                              |
| `RegisteredResourceType`              | type     | `{ type, actions, recordAccess: boolean, items? }`                                                                                                                                     | A registered type.                                                                                                                                                                 |
| `ResourceItems`                       | class    | `add(definition)`, `has(id)`, `get(id)`, `list()`                                                                                                                                      | The items of one type.                                                                                                                                                             |
| `ResourceItem`                        | type     | `{ id, title, description?, actions: readonly ResourceItemAction[] }`                                                                                                                  | A registered item with resolved action titles.                                                                                                                                     |
| `ResourceItemDefinition`              | type     | `{ id, title, description?, actions?: (string \| ResourceItemAction)[] }`                                                                                                              | What `items.add` takes.                                                                                                                                                            |
| `ResourceItemAction`                  | type     | `{ name: string; title?: AuthorizationTitle }`                                                                                                                                         | One action of an item.                                                                                                                                                             |
| `ResourceAuthorize`                   | type     | `(request: AuthorizationRequest<TParams>, context: AuthorizationRuntimeContext) => Promise<AuthorizationDecision>`                                                                     | A type's judgement.                                                                                                                                                                |
| `ResourceAuthorizeUnrestricted`       | type     | `(request: AuthorizationRequest<TParams>) => Promise<AuthorizationDecision>`                                                                                                           | A type's decision for an unrestricted identity.                                                                                                                                    |
| `AuthorizationRuntimeContext`         | type     | `{ grants: AuthorizationGrantService; constraints: AccessConstraintService }`                                                                                                          | What a judgement reads, bound to the current context.                                                                                                                              |
| `grantBacked`                         | function | `grantBacked(options?: GrantBackedOptions): ResourceAuthorize`                                                                                                                         | Permits when a policy-less grant matches; the default judgement.                                                                                                                   |
| `GrantBackedOptions`                  | type     | `{ also?(request, grants): Promise<boolean> }`                                                                                                                                         | A further check once a grant matches.                                                                                                                                              |
| `CompositeResourceApi`                | type     | `define(objectOrBuilder): CompositeResourceReference`, `getAction(id, action)`, `list()`, `validate(): readonly string[]`, `validateGrant(grant): string \| undefined`                 | `authz.compositeResources`; `validate` lists data scopes whose target type is unregistered or lacks `recordAccess`; `validateGrant` explains why a stored grant no longer expands. |
| `defineCompositeResource`             | function | `defineCompositeResource(name, configure): CompositeResourceBuilder`                                                                                                                   | Builds a composite without registering it.                                                                                                                                         |
| `CompositeResourceBuilder`            | class    | `title(t)`, `action(name, configure)`, `build()`, `reference()`                                                                                                                        | Immutable composite builder.                                                                                                                                                       |
| `CompositeResourceActionBuilder`      | class    | `title(t)`, `grant(key, permission, { title? })`, `grant(contribution)`, `build()`                                                                                                     | Immutable composite action builder.                                                                                                                                                |
| `CompositeResourceReference`          | class    | `name`, `grant(...actions)`, `grant({ action: { scopeKey: value } })`, `scope(action, scopeKey)`                                                                                       | Type-safe grants and rule targets.                                                                                                                                                 |
| `CompositeResource`                   | type     | `{ name, title, actions: readonly CompositeResourceAction[] }`                                                                                                                         | A composite definition.                                                                                                                                                            |
| `CompositeResourceAction`             | type     | `{ name, title, dataScopes?, grants: readonly CompositeResourceGrant[] }`                                                                                                              | One composite action.                                                                                                                                                              |
| `CompositeResourceActionData`         | type     | `{ title?, grants, dataScopes }`                                                                                                                                                       | What `CompositeResourceActionBuilder.build` returns.                                                                                                                               |
| `CompositeResourceGrant`              | type     | `{ resource: ResourceRef; actions: readonly CompositeResourceGrantAction[] }`                                                                                                          | A composed grant.                                                                                                                                                                  |
| `CompositeResourceGrantAction`        | type     | `{ action, policy?, scopeKey? }`                                                                                                                                                       | One composed action and the data scope that selects its records.                                                                                                                   |
| `CompositeResourcePolicy`             | type     | `{ type: 'composite'; scopes: Record<string, DataScopeValue> }`                                                                                                                        | The policy of a composite grant.                                                                                                                                                   |
| `CompositeResourceActions`            | type     | `Record<string, Record<string, DataScopeValue>>`                                                                                                                                       | Data scope value types per action, as references carry them.                                                                                                                       |
| `CompositeResourceActionAssignments`  | type     | `{ [action]?: Partial<scope values> }`                                                                                                                                                 | The object form of `reference.grant`.                                                                                                                                              |
| `CompositeResourceScopeTarget`        | type     | `{ action: N; scopeKey: K }`                                                                                                                                                           | What `reference.scope` returns.                                                                                                                                                    |
| `CompositeResourceContribution`       | type     | `{ build(): CompositeResourceContributionData; scopeSelections? }`                                                                                                                     | Anything a composite action can be granted from.                                                                                                                                   |
| `CompositeResourceContributionData`   | type     | `{ grants: readonly CompositeResourceGrant[]; dataScopes? }`                                                                                                                           | What a contribution builds.                                                                                                                                                        |
| `BindableCompositeResourcePermission` | type     | `{ recordAccessSelection?; bind(key, { title? }): CompositeResourceContribution }`                                                                                                     | A permission that becomes a data scope when bound to a key.                                                                                                                        |
| `CompositeResourceCheck`              | type     | `{ resource: ResourceRef; action: string; decision: AuthorizationDecision }`                                                                                                           | One underlying check of a composite action.                                                                                                                                        |
| `CompositeResourceConditions`         | type     | `{ type: 'composite'; checks: readonly CompositeResourceCheck[] }` plus plugin fields                                                                                                  | Conditions of a composite decision.                                                                                                                                                |
| `DataScope`                           | type     | `{ key, title, options?, defaultValue? }`                                                                                                                                              | A named slot a grant or rule fills with records.                                                                                                                                   |
| `dataScopeTarget`                     | function | `dataScopeTarget(action, key): ResourceRef`                                                                                                                                            | The one resource the grant actions naming the scope address; throws when there is none or more than one.                                                                           |
| `DataScopeValue`                      | type     | `RecordSelection \| string`                                                                                                                                                            | A selection, or a record access key as shorthand.                                                                                                                                  |
| `RecordSelection`                     | type     | `{ type: 'all' } \| { type: 'records'; ids } \| { type: 'recordAccess'; key; params? }`                                                                                                | Which records an action reaches.                                                                                                                                                   |
| `RecordSelectionHelpers`              | type     | `{ all(), records(ids), recordAccess(key, params?) }`                                                                                                                                  | The type of `selection`.                                                                                                                                                           |
| `selection`                           | const    | `selection.all()`, `selection.records(ids)`, `selection.recordAccess(key, params?)`                                                                                                    | Builds record selections.                                                                                                                                                          |
| `parseRecordSelection`                | function | `parseRecordSelection(value: unknown): RecordSelection`                                                                                                                                | Validates an untrusted selection, throwing `TypeError`.                                                                                                                            |
| `RecordAccessRegistry`                | class    | `define(objectOrBuilder): RecordAccessReference`, `get(key)`, `list()`, `listFor(collection)`, `resolve(key, context)`                                                                 | Registered record access.                                                                                                                                                          |
| `defineRecordAccess`                  | function | `defineRecordAccess(key, configure): RecordAccessBuilder`                                                                                                                              | Builds record access without registering it.                                                                                                                                       |
| `RecordAccessBuilder`                 | class    | `title(t)`, `description(t)`, `collections(...names)`, `params<P>(schema?)`, `resolver(fn)`, `build()`, `reference()`                                                                  | Immutable record access builder.                                                                                                                                                   |
| `RecordAccessDefinition`              | type     | `{ key, title?, description?, collections, paramsSchema?, resolve(context) }`                                                                                                          | A record access definition.                                                                                                                                                        |
| `RecordAccessReference`               | type     | `{ key: K; collections: readonly string[] }`                                                                                                                                           | The serializable half of a definition.                                                                                                                                             |
| `RecordAccessContext`                 | type     | `{ principal, collection, action, params }`                                                                                                                                            | What a resolver receives.                                                                                                                                                          |
| `AccessConstraintRegistry`            | class    | `add(resolver)`, `resolve(input)`, `list()`, `for(identity)`                                                                                                                           | Rule resolvers; `for` caches answers for one identity.                                                                                                                             |
| `AccessConstraintResolver`            | type     | `{ id; for?(identity); resolve(input) }`                                                                                                                                               | One source of constraints, such as a rule plugin.                                                                                                                                  |
| `AccessConstraintService`             | type     | `{ resolve(input): Promise<readonly AccessConstraint[]> }`                                                                                                                             | Constraint lookup a judgement reads.                                                                                                                                               |
| `AccessConstraint`                    | type     | `{ source: AuthorizationGrantSource; effect: 'expand' \| 'restrict'; selection: RecordSelection }`                                                                                     | One rule contribution.                                                                                                                                                             |
| `ResolveAccessConstraintsInput`       | type     | `{ scopeKey?, principal, subjects?, resource, action }`                                                                                                                                | What constraints are resolved for.                                                                                                                                                 |
| `RuleAction`                          | type     | `{ action: string; scopeKey?: string; selection: RecordSelection }`                                                                                                                    | One action of any rule.                                                                                                                                                            |
| `AuthorizationGrantService`           | type     | `{ resolve(input); resolveAll(input); for?(identity); unrestricted?(identity); onChange?(listener) }`                                                                                  | The Grant Provider contract.                                                                                                                                                       |
| `AuthorizationGrant`                  | type     | `{ source, resource, action, policy?, origin? }`                                                                                                                                       | One resolved grant.                                                                                                                                                                |
| `AuthorizationGrantOrigin`            | type     | `{ resource, action, scopeKey?, selection?, constraints? }`                                                                                                                            | The composite action a composed grant came from.                                                                                                                                   |
| `AuthorizationGrantSource`            | type     | `{ plugin: string; id: string; title? }`                                                                                                                                               | Where a grant or constraint came from.                                                                                                                                             |
| `AuthorizationGrantsChangedListener`  | type     | `(subject: AuthorizationSubject) => void \| Promise<void>`                                                                                                                             | Listener of `onGrantsChanged`.                                                                                                                                                     |
| `AuthorizationPolicy`                 | type     | `{ type: string; [key: string]: unknown }`                                                                                                                                             | A grant policy, interpreted by its resource type.                                                                                                                                  |
| `PermissionGrant`                     | type     | `{ resource: ResourceRef; actions: readonly PermissionGrantAction[] }`                                                                                                                 | A grant as a Permission Set or builder writes it.                                                                                                                                  |
| `PermissionGrantAction`               | type     | `{ action: string; policy?: AuthorizationPolicy }`                                                                                                                                     | One action of a written grant.                                                                                                                                                     |
| `ResolveAuthorizationGrantsInput`     | type     | `{ principal, subjects?, resource, action }`                                                                                                                                           | Input of `resolve`.                                                                                                                                                                |
| `ResolveAllAuthorizationGrantsInput`  | type     | `{ principal, subjects? }`                                                                                                                                                             | Input of `resolveAll`.                                                                                                                                                             |
| `AuthorizationSubjectRegistry`        | class    | `add(type, definition): () => void`, `get(type)`, `list()`, `resolveFor(principal)`, `filterActive(subjects, transaction?)`                                                            | Subject types the application declares.                                                                                                                                            |
| `AuthorizationSubjectType`            | type     | `{ resolveFor?(principal); filterActive(ids, transaction?) }` plus extensions                                                                                                          | One subject type.                                                                                                                                                                  |
| `AuthorizationSubjectTypeExtensions`  | type     | `interface AuthorizationSubjectTypeExtensions {}`                                                                                                                                      | Augment to add host metadata to subject types.                                                                                                                                     |
| `AuthorizationTitle`                  | type     | `string \| { key: string; ns: string }`                                                                                                                                                | A display title; `ns` is required.                                                                                                                                                 |
| `parseAuthorizationTitle`             | function | `parseAuthorizationTitle(value: unknown): AuthorizationTitle \| undefined`                                                                                                             | Validates an untrusted title.                                                                                                                                                      |
| `encodeAuthorizationTitle`            | function | `encodeAuthorizationTitle(title?): string \| null`                                                                                                                                     | Serializes a title for storage.                                                                                                                                                    |
| `decodeAuthorizationTitle`            | function | `decodeAuthorizationTitle(value: unknown): AuthorizationTitle \| undefined`                                                                                                            | Reads a stored title.                                                                                                                                                              |
| `AuthorizationDeniedError`            | class    | `new AuthorizationDeniedError(decision)`; `decision`, `status` (`403`), `getResponse()`                                                                                                | Thrown by `require`. `getResponse()` is the interface Hono's default error handler honours, so an uncaught denial answers `403 { code: 'FORBIDDEN', message }`.                    |
| `AuthorizationDecision`               | type     | `{ effect: AuthorizationEffect; conditions?; reasons: readonly AuthorizationReason[] }`                                                                                                | A decision.                                                                                                                                                                        |
| `AuthorizationEffect`                 | type     | `'permit' \| 'conditional' \| 'deny'`                                                                                                                                                  | A decision's effect.                                                                                                                                                               |
| `AuthorizationConditions`             | type     | `{ type: string; [key: string]: unknown }`                                                                                                                                             | What a conditional decision holds.                                                                                                                                                 |
| `AuthorizationReason`                 | type     | `{ code, message, plugin?, details? }`                                                                                                                                                 | Why a decision came out as it did.                                                                                                                                                 |
| `AuthorizationRequest`                | type     | `{ principal, subjects?, resource, action, params? }`                                                                                                                                  | A request with its identity.                                                                                                                                                       |
| `AuthorizationIdentity`               | type     | `{ principal: Principal; subjects?: readonly AuthorizationSubject[] }`                                                                                                                 | Who is asking.                                                                                                                                                                     |
| `AuthorizationSubject`                | type     | `{ type: string; id: string }`                                                                                                                                                         | A principal or a membership.                                                                                                                                                       |
| `Principal`                           | type     | `{ type: string; id: string; attributes? }`                                                                                                                                            | The authenticated actor.                                                                                                                                                           |
| `ResourceRef`                         | type     | `{ type: string; id: string }`                                                                                                                                                         | The target of a check or grant.                                                                                                                                                    |

## `@nocobase/authorization/permission-sets`

`permissionSetsPlugin` is the Grant Provider. It adds `authz.permissionSets`; subscribe to changes through `authz.onGrantsChanged`, and read unrestricted status from `protection(key)?.unrestricted` or `snapshot().unrestricted`.

```ts
const authz = createAuthorization({
  plugins: [
    permissionSetsPlugin({
      store,
      rootSet: { key: 'root', assignableTo: ['user'] },
      defaultSet: 'member',
    }),
  ],
});
await authz.permissionSets.create(
  definePermissionSet('sales')
    .title('Sales')
    .grant(quotes.reference().grant('submit'))
    .build(),
);
```

`rootSet` confers unrestricted access and may be assigned and revoked but not edited; it keeps an active assignment unless `requireActiveAssignment: false`. `defaultSet` may have its grants updated. Neither creates records or assignments. The generic management surface calls `assertWritable` and refuses protected changes; owner code is trusted. `revoke` and `replaceSubjectAssignments` lock protected sets, check and write in the store's transaction, and notify after commit. For a user mutation, bind the check to the same transaction and notify through the bound API, which publishes once the transaction commits:

```ts
await database.transaction(async (connection) => {
  await authz.permissionSets
    .withTransaction(connection)
    .assertSubjectRemovable(subject);
  await disableUser(connection, subject.id);
  await authz.permissionSets
    .withTransaction(connection)
    .notifyAssignmentsChanged(subject);
});
```

### Exports

| Export                                | Kind     | Signature                                                                                                                                                                                                                                           | Purpose                                                      |
| ------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `permissionSetsPlugin`                | function | `permissionSetsPlugin({ store, rootSet?, defaultSet? }): PermissionSetsPlugin`                                                                                                                                                                      | The Grant Provider plugin.                                   |
| `PermissionSetsPlugin`                | type     | `AuthorizationPlugin<PermissionSetsAuthorizationApi>`                                                                                                                                                                                               | What the factory returns.                                    |
| `PermissionSetsOptions`               | type     | `{ store: PermissionSetStore; rootSet?: string \| PermissionSetRootSet; defaultSet?: string }`                                                                                                                                                      | Factory options.                                             |
| `PermissionSetRootSet`                | type     | `{ key; requireActiveAssignment?; assignableTo? }`                                                                                                                                                                                                  | The unrestricted set's declaration.                          |
| `PermissionSetsAuthorizationApi`      | type     | `{ permissionSets: PermissionSetsApi }`                                                                                                                                                                                                             | What the plugin adds to the instance.                        |
| `PermissionSetsApi`                   | type     | `create`, `update`, `delete`, `get`, `list`, `assign`, `revoke`, `listAssignments`, `replaceSubjectAssignments`, `getEffective`, `protect`, `protection`, `assertWritable`, `assertSubjectRemovable`, `withTransaction`, `notifyAssignmentsChanged` | `authz.permissionSets`; see the method table below.          |
| `CreatePermissionSetInput`            | type     | `{ key; title?; grants: readonly PermissionGrant[] }`                                                                                                                                                                                               | A complete set definition for `create` and `update`.         |
| `AssignPermissionSetInput`            | type     | `{ id?; subject: PermissionSetSubject; permissionSet: string }`                                                                                                                                                                                     | Input of `assign`.                                           |
| `ReplaceSubjectAssignmentsInput`      | type     | `{ subject; managedPermissionSets: readonly string[]; permissionSets: readonly string[] }`                                                                                                                                                          | Input of `replaceSubjectAssignments`.                        |
| `PermissionSetProtection`             | type     | `{ owner; keys; allow?; requireActiveAssignment?; unrestricted?; assignableTo? }`                                                                                                                                                                   | Input of `protect`.                                          |
| `PermissionSetProtectionInfo`         | type     | `{ owner; allow; requireActiveAssignment?; unrestricted?; assignableTo? }`                                                                                                                                                                          | What `protection(key)` answers.                              |
| `PermissionSetWriteOperation`         | type     | `'create' \| 'update' \| 'delete' \| 'assign' \| 'revoke'`                                                                                                                                                                                          | An operation `assertWritable` checks.                        |
| `PERMISSION_SETS_PROTECTION_OWNER`    | const    | `'@nocobase/authorization/permission-sets'`                                                                                                                                                                                                         | Owner of the protections `rootSet` and `defaultSet` declare. |
| `PermissionSetProtectedError`         | class    | `key`, `owner`, `operation`                                                                                                                                                                                                                         | A protected set refused a generic change.                    |
| `PermissionSetSubjectNotAllowedError` | class    | `key`, `subjectType`                                                                                                                                                                                                                                | The set cannot be assigned to that subject type.             |
| `PermissionSetLastAssignmentError`    | class    | `key`                                                                                                                                                                                                                                               | The set's last active assignment cannot be removed.          |
| `PermissionSetNotFoundError`          | class    | `new PermissionSetNotFoundError(key)`                                                                                                                                                                                                               | No set has that key.                                         |
| `PermissionSetConflictError`          | class    | `new PermissionSetConflictError(message)`                                                                                                                                                                                                           | A set with that key already exists.                          |
| `definePermissionSet`                 | function | `definePermissionSet(key): PermissionSetBuilder`                                                                                                                                                                                                    | Builds a set without writing it.                             |
| `PermissionSetBuilder`                | class    | `title(t)`, `grant(...grants)`, `build(): PermissionSet`                                                                                                                                                                                            | Immutable set builder.                                       |
| `PermissionSet`                       | type     | `{ key; title?; grants: readonly PermissionGrant[] }`                                                                                                                                                                                               | A stored set.                                                |
| `PermissionSetAssignment`             | type     | `{ id; subject: PermissionSetSubject; permissionSet: string }`                                                                                                                                                                                      | A stored assignment.                                         |
| `PermissionSetSubject`                | type     | `{ type: string; id: string }`                                                                                                                                                                                                                      | Who an assignment binds.                                     |
| `PermissionSetStore`                  | type     | `list`, `get`, `create`, `update`, `delete`, `assign`, `revoke`, `listAssignments`, `findAssignments`, `lock?`, `transaction?`, `withTransaction`                                                                                                   | The persistence contract.                                    |

| `authz.permissionSets` method            | Contract                                                                                                                                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `create(input)`, `update(key, input)`    | A complete `{ key, title?, grants }`; `update` may rename and notifies assigned subjects.                                                                                                  |
| `delete(key)`, `get(key)`, `list()`      | Read and remove sets.                                                                                                                                                                      |
| `assign(input)`, `revoke(id)`            | Add or remove one assignment.                                                                                                                                                              |
| `listAssignments(permissionSet?)`        | Every assignment, or those of one set.                                                                                                                                                     |
| `replaceSubjectAssignments(input)`       | Replace a subject's assignments within the managed sets only; notify once when changed.                                                                                                    |
| `getEffective({ principal, subjects? })` | The sets an identity holds.                                                                                                                                                                |
| `protect(protection)`, `protection(key)` | Declare code ownership and read it back; `protect` returns a release function.                                                                                                             |
| `assertWritable(key, operation)`         | Throw `PermissionSetProtectedError` for a refused generic change.                                                                                                                          |
| `assertSubjectRemovable(subject)`        | Throw when removing the subject would empty a set that requires an active assignment.                                                                                                      |
| `withTransaction(transaction)`           | An API bound to a caller-owned transaction. On a `@nocobase/db` connection its notifications wait for the commit and are dropped on rollback; on any other transaction it notifies nobody. |
| `notifyAssignmentsChanged(subject)`      | Announce a change through `authz.onGrantsChanged`.                                                                                                                                         |

| `PermissionSetStore` method                                    | Contract                                                                   |
| -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `list()`, `get(key)`                                           | Read sets.                                                                 |
| `create(set)`, `update(key, set)`, `delete(key)`               | Write sets; deleting a set deletes its assignments.                        |
| `assign(assignment)`, `revoke(id)`                             | Write assignments.                                                         |
| `listAssignments(permissionSet?)`, `findAssignments(subjects)` | Read assignments.                                                          |
| `lock?(key)`, `transaction?(run)`                              | Serialize changes to one set; run a mutation atomically.                   |
| `withTransaction(transaction)`                                 | A store bound to the caller's transaction, or itself without transactions. |

## `@nocobase/authorization/default-access`

`defaultAccessPlugin({ store })` adds `authz.defaultAccess` and an `expand` constraint resolver that applies to every identity. A resource holds at most one default-access rule: creating a second, or updating another rule onto it, throws `DefaultAccessConflictError`.

### Exports

| Export                          | Kind     | Signature                                                                                      | Purpose                                                |
| ------------------------------- | -------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `defaultAccessPlugin`           | function | `defaultAccessPlugin({ store }): DefaultAccessPlugin`                                          | The plugin.                                            |
| `DefaultAccessPlugin`           | type     | `AuthorizationPlugin<DefaultAccessAuthorizationApi>`                                           | What the factory returns.                              |
| `DefaultAccessOptions`          | type     | `{ store: DefaultAccessStore }`                                                                | Factory options.                                       |
| `DefaultAccessAuthorizationApi` | type     | `{ defaultAccess: DefaultAccessApi }`                                                          | What the plugin adds to the instance.                  |
| `DefaultAccessApi`              | type     | `create(rule)`, `update(key, rule)`, `delete(key)`, `get(key)`, `list()`, `withTransaction(t)` | `authz.defaultAccess`; writes validate the rule first. |
| `DefaultAccessStore`            | type     | `create`, `update`, `delete`, `get`, `list`, `withTransaction`                                 | The persistence contract.                              |
| `DefaultAccessRule`             | type     | `{ key: string; resource: ResourceRef; actions: readonly RuleAction[] }`                       | A default-access rule.                                 |
| `defineDefaultAccessRule`       | function | `defineDefaultAccessRule(key, reference): DefaultAccessRuleBuilder`                            | Builds a rule on a composite.                          |
| `DefaultAccessRuleBuilder`      | class    | `scope(action, scopeKey, selection)`, `build()`                                                | Immutable rule builder; validates the data scope.      |
| `DefaultAccessConflictError`    | class    | `new DefaultAccessConflictError(resource, existing)`; `existing`                               | A second rule on a resource that already has one.      |

## `@nocobase/authorization/sharing-rules`

`sharingRulesPlugin({ store })` adds `authz.sharingRules` and an `expand` resolver that applies to the rule's subjects. A sharing rule rejects `all`.

### Exports

| Export                         | Kind     | Signature                                                                                            | Purpose                                               |
| ------------------------------ | -------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `sharingRulesPlugin`           | function | `sharingRulesPlugin({ store }): SharingRulesPlugin`                                                  | The plugin.                                           |
| `SharingRulesPlugin`           | type     | `AuthorizationPlugin<SharingRulesAuthorizationApi>`                                                  | What the factory returns.                             |
| `SharingRulesOptions`          | type     | `{ store: SharingRuleStore }`                                                                        | Factory options.                                      |
| `SharingRulesAuthorizationApi` | type     | `{ sharingRules: SharingRulesApi }`                                                                  | What the plugin adds to the instance.                 |
| `SharingRulesApi`              | type     | `create(rule)`, `update(key, rule)`, `delete(key)`, `get(key)`, `list()`, `withTransaction(t)`       | `authz.sharingRules`; writes validate the rule first. |
| `SharingRuleStore`             | type     | `create`, `update`, `delete`, `get`, `list`, `withTransaction`                                       | The persistence contract.                             |
| `SharingRule`                  | type     | `DefaultAccessRule & { title?; subjects: readonly AuthorizationSubject[]; reason? }`                 | A sharing rule.                                       |
| `defineSharingRule`            | function | `defineSharingRule(key, reference): SharingRuleBuilder`                                              | Builds a rule on a composite.                         |
| `SharingRuleBuilder`           | class    | `scope(action, scopeKey, selection)`, `title(t)`, `subjects(...subjects)`, `reason(text)`, `build()` | Immutable rule builder; rejects `all`.                |

## `@nocobase/authorization/restriction-rules`

`restrictionRulesPlugin({ store })` adds `authz.restrictionRules` and a `restrict` resolver that applies to the rule's subjects. A restriction rule accepts every selection, including `records`.

### Exports

| Export                             | Kind     | Signature                                                                                            | Purpose                                                   |
| ---------------------------------- | -------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `restrictionRulesPlugin`           | function | `restrictionRulesPlugin({ store }): RestrictionRulesPlugin`                                          | The plugin.                                               |
| `RestrictionRulesPlugin`           | type     | `AuthorizationPlugin<RestrictionRulesAuthorizationApi>`                                              | What the factory returns.                                 |
| `RestrictionRulesOptions`          | type     | `{ store: RestrictionRuleStore }`                                                                    | Factory options.                                          |
| `RestrictionRulesAuthorizationApi` | type     | `{ restrictionRules: RestrictionRulesApi }`                                                          | What the plugin adds to the instance.                     |
| `RestrictionRulesApi`              | type     | `create(rule)`, `update(key, rule)`, `delete(key)`, `get(key)`, `list()`, `withTransaction(t)`       | `authz.restrictionRules`; writes validate the rule first. |
| `RestrictionRuleStore`             | type     | `create`, `update`, `delete`, `get`, `list`, `withTransaction`                                       | The persistence contract.                                 |
| `RestrictionRule`                  | type     | `DefaultAccessRule & { title?; subjects: readonly AuthorizationSubject[]; reason? }`                 | A restriction rule.                                       |
| `defineRestrictionRule`            | function | `defineRestrictionRule(key, reference): RestrictionRuleBuilder`                                      | Builds a rule on a composite.                             |
| `RestrictionRuleBuilder`           | class    | `scope(action, scopeKey, selection)`, `title(t)`, `subjects(...subjects)`, `reason(text)`, `build()` | Immutable rule builder.                                   |

## `@nocobase/authorization`

The root entry re-exports every name of the five subpaths above and adds none of its own.
