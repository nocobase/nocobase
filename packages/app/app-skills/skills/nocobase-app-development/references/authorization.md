# Design application permissions

## Cross-object creation: read the complete example

Before implementing a Create operation that selects existing records from other collections, read the [complete waybill example in the authorization Skill](../../nocobase-app-plugin-authorization/references/client-development.md#example-create-a-waybill-with-scoped-related-records). Keep each composite business-object ID different from its registered collection/table name; use registered table names as keys in `conditions.database` and `scopeTitles`. In the same example, `hiddenActionScopes.create` uses the registered own-scope key (`waybills`) to hide only the new record's own selector, leaving the Carriers, Sites and Vehicles relation scopes visible. Use short operation titles such as `View` and `Create`.

For an executable application-owned implementation of scoped relation choices and batch assignments, see the [customer/contact reference](frontend/references/executable-relation-batch.md). It includes native-authenticated permission tests and separate relation-picker and batch-editor entry points.

Use this reference when a feature distinguishes people, jobs, teams, pages, operations, fields or records. Model access while designing the feature; adding only hidden buttons after building unrestricted endpoints leaves the system incomplete.

## Discover the capability

Inspect `package.json`, `client/plugins.ts`, `server/plugins.ts` and `server/config/authorization.ts`. Read the installed `.agents/skills/nocobase-app-plugin-authorization/SKILL.md` before implementation. If installed Skills are stale, run `pnpm nocobase skills sync`; do not edit generated copies. Check registration separately from dependency presence.

Default access, sharing rules and restriction rules are optional plugins. Read their installed Skills when the business requirement calls for a common baseline, collaboration exception or record exclusion. If the corresponding Skill is absent, treat the capability as unsupported in this App and explain that it requires separate development. Do not assume its APIs, tables or seed format, or silently install/configure it. If the Skill exists, follow it to verify runtime activation and migrations. Implementation and seed details belong to that owning Skill. Do not implement replacement role tables or assume all optional plugins are present.

## Turn requirements into a matrix

Record actor/job, page, business operation, data scope, readable/writable fields, relation capabilities and administrator responsibilities. Use real jobs as permission sets and business relationships as scopes. Clarify material missing boundaries, such as whether a delegate can submit as well as edit, and whether a confidentiality restriction must cover every operation.

Keep page access independent from business action grants. Distinguish operations that can touch the same table: editing a draft may update amount/notes while submission only changes state after checking the parent project. A user can hold both a personal job and a team job; revoking the team source should preserve unrelated personal responsibilities.

## Implement in application-owned files

For new and existing features alike, classify the requested changes by content. Supported operations, fields/relations, resolver behavior and enforcement belong to the model; selecting supported scopes/parameters, grants, rules and recipients belongs to configuration. A request can require both. When developing a permission model, also complete its usable initial or adjusted business configuration from the responsibility matrix; do not stop at declarations unless the user explicitly asks for model-only work. Clarify unknown recipients without guessing assignments.

Declare reusable collection permissions and business operations, defined as composite resources, in a feature module. In `server/providers/`, resolve `authorizationToken`, then register collections (`authz.database.collections.add`), composites (`authz.compositeResources.define`), record access (`authz.recordAccess.define`), settings items (`authz.settings.add`) and, when the feature owns a team or department model, inherited subjects (`authz.subjects.add`, built as [an organisation dimension](organization.md)); add workspace subsections with `authz.ui.sections.add` and list each composite or settings item in one with `authz.ui.place`. Pages are not registered on the server; the client routes list them. Read the authorization Skill’s bundled `references/code-and-seeds.md` before choosing initialization: code declares capabilities, provider boot registers them, and seeds initialize the agreed business configuration for fresh installations. Use authorized services or controlled data changes for existing installations. Seeded permission sets, selected scopes, rules and assignments remain editable in the backend; seeds do not make them code-owned or protected. App features own composite declarations and initial business configuration, not root/member protection or other platform permission configuration. Never rewrite administrator configuration at boot. Normal seeds have a restricted database context, not the running authorization service. Keep schema changes in migrations and initial assignments in idempotent seeds or controlled provisioning. Keep permission declarations with the feature that owns them: in the App for application-owned features, or in the plugin when the feature is organized as a plugin.

Every `server/routes/` endpoint installs authentication and authorization. A business operation checks `{ resource: { type: 'composite', id }, action }` with the request context's `authorize` once and binds each returned `conditions.database` policy through `repository.withPolicy`. Do not replace it with collection-level authorization or an in-memory filter. Use `authz.database.policyFor` for collection CRUD and `authz.database.authorizeRepository` for simple business Repository routes, mapping each method to its composite action. The authorization Skill documents these choices and their contracts.

`conditions.database` is keyed by the registered collection/table name, not the composite ID, route name or named scope slot. For a `sales.quotes` operation touching `salesQuotes` and `salesProjects`, read `decision.conditions?.database?.salesQuotes` and `decision.conditions?.database?.salesProjects`. Reject a denied decision or a missing required policy. Bind each policy to the repository of the same name, such as `connection.repository('salesQuotes').withPolicy(quotePolicy)`.

Declare `authz` on the first page of every path in `client/routes.ts`: `{ resource: { type: 'page', id }, action: 'access' }` for a business page, the page's `settings` item for a configuration page, `'unrestricted'` for a root-only page, or `'skip'` explicitly; nothing is inferred from the route name. Nested pages inherit it; an omitted value on a first page defaults to `'unrestricted'` for protected pages and `'skip'` otherwise, with a development warning. Use `useCan({ resource, action })` for button visibility and server-computed eligibility for record-sensitive actions. Keep pending/failed checks closed and refresh after permission changes. Client visibility does not enforce the API. The authorization Skill’s `references/client-development.md` includes the component, relation controls and settings lifecycle; all required APIs are bundled in that Skill rather than external package documentation.

## Map refusals to standard errors

Keep permission failures separate from business state refusals. Let `lifecycleErrorFields()` map lifecycle errors instead of assigning HTTP statuses yourself: a stale expected version (`CONFLICT`) becomes `ABORTED` / HTTP 409, while an invalid state (`INVALID_STATE`) or a `GUARD_REJECTED` whose blockers are all preconditions becomes `FAILED_PRECONDITION` / HTTP 400. The [lifecycle route example](lifecycle.md#4-the-record-routes) shows `runtime.fire()` with an expected version and the shared error conversion. For a duplicate create, declare a unique constraint for the business key (`collection.unique('code')` in the table's migration; checking first and then inserting alone lets two requests race), catch `isUniqueConstraintViolation` around the write, and throw the standard `ApiError` with status `ALREADY_EXISTS`, which the shared API error handler maps to HTTP 409. Catch it outside the transaction: the failed write has already rolled back, so nothing is stored. Without the catch, the driver's error becomes an opaque 500.

```ts
import { ApiError } from '@nocobase/app-server/router';
import {
  isUniqueConstraintViolation,
  type DatabaseManager,
} from '@nocobase/db';
import { LifecycleError, lifecycleErrorFields } from '@nocobase/lifecycle';

/** A lifecycle refusal as the standard error body; anything else is returned as it is. */
export function toLifecycleApiError(
  error: unknown,
  inputField?: string,
): unknown {
  if (!(error instanceof LifecycleError)) return error;
  const fields = lifecycleErrorFields(error, inputField ? { inputField } : {});
  return fields ? new ApiError({ ...fields, domain: 'tms' }) : error;
}

export async function createCarrier(
  database: DatabaseManager,
  input: { code: string; name: string },
): Promise<string> {
  try {
    const created = await database.transaction((connection) =>
      connection.repository('tmsCarriers').createOne({ values: input }),
    );
    return String(created.record.id);
  } catch (error) {
    if (!isUniqueConstraintViolation(error)) throw error;
    throw new ApiError({
      status: 'ALREADY_EXISTS',
      reason: 'CARRIER_CODE_TAKEN',
      domain: 'tms',
      message: 'A carrier with this code already exists.',
      cause: error,
    });
  }
}
```

Wire lifecycle route errors through `apiErrorHandler(toLifecycleApiError(error, 'input'), context)` as in the linked route example, and let `ApiError` use the same handler. Do not replace either mapping with a hand-written response. Clients branch on `error.reason`.

## Configure the three-tab role editor

When you add an application feature with business permissions, update `client/pages/settings/permission-workspace.ts` in the same change. Keep the template's role form and its installed `@nocobase/permission-editor` component. Edit `permissionWorkspaceSelection` to expose the app's implemented business operations and connect its pages to the objects they use.

- **Menus** uses the application's registered navigation. A business route declares `authz: { resource: { type: 'page', id }, action: 'access' }`. The menu checkbox controls the page grant. Object tags are references, and checking a menu whose primary object lacks View triggers the empty-page warning. Give home pages that require sign-in only `authz: 'skip'` to keep their visible-for-everyone state.
- **Business objects** has one `business` entry per server-registered composite resource. List the exact registered action IDs the app actually implements. Name the read action `view` or `read`, or designate it with `view`. Declare its data scope on its own collection. Other operations on that collection follow View, and an additional scope on a different selected object's collection follows that object's View. Followers can use the View scope or a provably narrower scope.
- **System settings** comes from real settings routes and the catalog actions they use. Opening a settings page requires its opening action. Settings switches have no data scope controls.

**Preset roles that read related objects.** When an operation such as create or dispatch has a scope on another object's records, a seeded or API-created role grants that object's View too, with the narrowest scope the job needs, and gives the operation's slot the same record access key or one declared narrower in `scopeSubsets`. For example, a dispatcher whose `create` reads stations, carriers and vehicles and whose `dispatch` reads drivers also gets `view` on each of those four objects: stations limited to `tms.myStations`, the others to `tms.activeRecords`, with the same keys on the operation slots. The editor then shows these slots as following that View. A role stored without it keeps working as the server checks each slot, and the editor shows the stored value read-only with “Needs X view” and saves it unchanged, including when only the role name changes; it changes only after an administrator turns that View on, which caps any wider slot to the View's scope and says so. Do not grant a View on save or rename to fix an older role, and do not rely on the editor to repair a seed: write the View into the seed. Menu page grants stay separate, and system settings are granted for what the job administers.

Keep the template and component's layout and copy. Leave the artificial Main menu group, explanatory banners and footers, and object-list scope summaries out of the app. Keep the object reference tags, empty-page warning, unsaved-change feedback, per-action data scope controls, and security reminders.

Use stable, feature-qualified IDs, such as `sales.quotes`. The page permission ID is `route.authz.resource.id` and the business object ID is the name passed to `defineCompositeResource`. For a page dedicated to one object, give its page permission and composite the same ID. The template will infer the primary object if that object is selected. `pages` is keyed by `route.name` (for example, `'sales-quotes'`). Its `primary` and `related` arrays contain the selected business IDs without the `composite:` prefix. Use `primary` for the data needed to open a useful page and `related` for auxiliary data such as a picker. A declaration overrides inference for that route, so include `primary` when adding related objects to a page that would otherwise infer it. Omit `primary` for a related-only mapping or use `{}` to suppress the inferred object altogether. These associations leave stored grants unchanged.

Use localized operation titles in the role editor: generic names such as View, Create, Edit and Delete for standard actions, and short verb phrases such as Receive or Verify dispatch for business actions. Do not repeat the object name in the operation label; describe the object and effects in `actionDescriptions`.

A Create that selects existing records of other collections declares one slot per collection and hides only its own. For business object `tms.waybills` (table `tmsWaybills`), the server action is `.action('create', (a) => a.title('Create').grant('waybills', waybillData.create([...])).grant('carriers', carrierData).grant('sites', siteData).grant('vehicles', vehicleData))`, and the workspace entry is:

```ts
{
  type: 'composite',
  id: 'tms.waybills',
  actions: ['view', 'create'],
  actionDescriptions: {
    view: { key: 'tms.waybills.actions.view.description' },
    create: { key: 'tms.waybills.actions.create.description' },
  },
  scopeTitles: {
    tmsWaybills: { key: 'tms.waybills.title' },
    tmsCarriers: { key: 'tms.carriers.title' },
    tmsSites: { key: 'tms.sites.title' },
    tmsVehicles: { key: 'tms.vehicles.title' },
  },
  hiddenActionScopes: { create: ['waybills'] },
}
```

The editor then shows `View` and `Create`, and Create offers exactly the Carriers, Sites and Vehicles scopes. The [complete example](../../nocobase-app-plugin-authorization/references/client-development.md#example-create-a-waybill-with-scoped-related-records) adds the server declaration and the route that enforces all four policies.

### Permission workspace fields

A composite ID (for example, `sales.quotes`), collection/table name (`salesQuotes`), named data scope slot (`quotes`) and record access key (`sales.myQuotes`) are separate identifiers. The slot key comes from `action.grant(slotKey, permission)`; the record access key names a selectable filter, not a slot.

| Field                | Keys or values                                                                   | When to use                                                                                                                                                           |
| -------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scopeTitles`        | Collection/table name → localized title, for example `salesQuotes`               | Reuse the registered collection title if the catalog supplies only a raw collection name or slot key.                                                                 |
| `hiddenActionScopes` | Action ID → data scope slot keys, for example `{ create: ['quotes'] }`           | Hide the selector for the record being created, not for existing related records. Keep the registered scope and its stored value; hiding is not permission to create. |
| `actionScopeTitles`  | Action ID → data scope slot key → localized title, for example `submit.projects` | Override a specific slot caption for one action. Existing table-name overrides still work as a fallback.                                                              |
| `scopeOrder`         | Registered record access keys, widest first                                      | Order choices; order alone does not indicate containment.                                                                                                             |
| `scopeSubsets`       | Outer record access key → narrower record access keys                            | Declare only proven containment, including any transitive pairs the editor should offer. Leave independent choices unrelated.                                         |

### Example: quotes with a project picker

This example assumes the app registers `sales.quotes` with `view`, `edit` and `submit`, and `sales.projects` with `view`. Submit declares scope slots `quotes` and `projects` on the `salesQuotes` and `salesProjects` collections, respectively. Register each collection with a localized title and each action with its localized operation name. For example, register `salesProjects` with title `{ key: 'sales.projects.title', ns: appPackageName }`, and give Submit `{ key: 'sales.quotes.actions.submit.title', ns: appPackageName }`. For catalog titles returned by the server, `appPackageName` is the application namespace from its `package.json`. A plugin uses its own package namespace for its own titles.

In `client/routes.ts`, add these entries to the existing route list. Projects needs no explicit page mapping because its page ID matches its composite ID.

```ts
{
  name: 'sales-quotes',
  path: '/sales/quotes',
  auth: 'required',
  navigation: { title: 'sales.quotes.title' },
  authz: { resource: { type: 'page', id: 'sales.quotes' }, action: 'access' },
  componentLoader: () => import('./pages/sales/quotes.js'),
},
{
  name: 'sales-projects',
  path: '/sales/projects',
  auth: 'required',
  navigation: { title: 'sales.projects.title' },
  authz: { resource: { type: 'page', id: 'sales.projects' }, action: 'access' },
  componentLoader: () => import('./pages/sales/projects.js'),
},
```

In `client/pages/settings/permission-workspace.ts`, replace the template's empty selection with:

```ts
export const permissionWorkspaceSelection: PermissionWorkspaceSelection = {
  business: [
    {
      type: 'composite',
      id: 'sales.quotes',
      actions: ['view', 'edit', 'submit'],
      actionDescriptions: {
        view: { key: 'sales.quotes.actions.view.description' },
        edit: { key: 'sales.quotes.actions.edit.description' },
        submit: { key: 'sales.quotes.actions.submit.description' },
      },
      scopeOrder: ['allRecords', 'sales.teamQuotes', 'sales.myQuotes'],
      scopeSubsets: { 'sales.teamQuotes': ['sales.myQuotes'] },
      scopeTitles: {
        salesQuotes: { key: 'sales.quotes.title' },
        salesProjects: { key: 'sales.projects.title' },
      },
    },
    {
      type: 'composite',
      id: 'sales.projects',
      actions: ['view'],
      actionDescriptions: {
        view: { key: 'sales.projects.actions.view.description' },
      },
    },
  ],
  pages: {
    'sales-quotes': {
      primary: ['sales.quotes'],
      related: ['sales.projects'],
    },
  },
};
```

Give every selected action a one-sentence description in the app's locale files and reference it from `actionDescriptions`. Use the same feature/object/action keys for names and descriptions. In this example the server registers both custom quote scopes, and Team quotes includes all My quotes for the same user. Order and containment declarations configure presentation; the server must implement the filters.

Use the registered collection's localized title for every named scope. When the default scope caption is just the scope key or collection name, the template can take that title from the catalog. If supplying `scopeTitles` explicitly, key it by the scope's collection name and reuse that collection's title key, as shown above. Do not set `risks` in new application business selections. The template supplies the security reminders for system settings.

Add the following `sales` group to the existing exports in `client/locales/en-US.ts` and `client/locales/zh-CN.ts` respectively. Use the first group as the shape for every app locale. Keep application copy out of `client/locales/system/`.

```ts
// en-US.ts
sales: {
  quotes: {
    title: 'Quotes',
    actions: {
      view: { title: 'View', description: 'Read quotes within the selected scope.' },
      edit: { title: 'Edit', description: 'Change the amount and notes on draft quotes.' },
      submit: { title: 'Submit', description: 'Submit a draft quote for its project.' },
    },
  },
  projects: {
    title: 'Projects',
    actions: {
      view: { title: 'View', description: 'Read projects within the selected scope.' },
    },
  },
},

// zh-CN.ts
sales: {
  quotes: {
    title: '报价单',
    actions: {
      view: { title: '查看', description: '查看所选范围内的报价单。' },
      edit: { title: '编辑', description: '修改草稿报价单的金额和备注。' },
      submit: { title: '提交', description: '提交项目的草稿报价单。' },
    },
  },
  projects: {
    title: '项目',
    actions: {
      view: { title: '查看', description: '查看所选范围内的项目。' },
    },
  },
},
```

Before handing over the application, open the three tabs in Chinese. Check the menu's object tags and its warning when the menu is selected and its primary object's View is off. Open a multi-scope operation and verify its slot labels use the translated collection titles and each action shows a translated name and description. Save a scoped role and sign in as an ordinary user assigned to it. Verify that a record inside its scope appears and a record outside its scope stays inaccessible in the application and direct authorized requests.

Before accepting a new application's permission workspace, write an operation-to-permission map for every business action: the user-visible entry or button, request endpoint, stable composite resource/action, server enforcement point, affected existing records and named data scopes. Group internal writes only when they form one indivisible user operation; split independently assignable actions such as approve, reject and return even if they share a page or collection. Use the same action for the same operation on list and detail pages. Compare the map with the rendered editor: every configurable row must correspond to an implemented operation, and every independently configurable operation must have a row. A display label or Registry selection cannot repair a bundled server permission.

Treat that map as an acceptance gate, not merely design notes. For each action, verify with an ordinary user that its grant enables the matching button and direct request, that an unrelated sibling remains denied, and that page access alone and action access alone do not bypass the other boundary. Check existing-record and related-record scopes, state eligibility, and create actions without a meaningless new-record range selector. Record any intentionally combined operations and why they must be assigned together. Do not declare the permission design complete from a screenshot of the editor alone.

## Verify and explain

For a template-derived app, keep `@nocobase/app-plugin-users` and `@nocobase/app-plugin-authorization` registered, and preserve the public `Home` route and its navigation row. If the generated Home row has unwanted explanatory copy, omit that copy only; do not remove the route or its menu entry. Keep the template's `tests/client/client-routes.test.ts` and `tests/client/permission-workspace.test.ts` unchanged and run them from the template root with `pnpm exec vitest run tests/client/client-routes.test.ts tests/client/permission-workspace.test.ts`; both must pass as written.

Before the API self-check, read `permission-workspace.ts` and the server registration once: each business-object ID differs from its table name, every `scopeTitles` and `conditions.database` key is a registered table name, every `hiddenActionScopes` entry names a slot the action registers, and no operation title is `New <object>` or `Create <object>`. Every business key has a unique constraint in its migration.

In the generated app's API self-check, try creating a record with an existing unique key and require HTTP 409 (`ALREADY_EXISTS`); submit a lifecycle transition with an old expected version and require HTTP 409 (`ABORTED` / `CONFLICT`); then request a transition the current state forbids and require HTTP 400 (`FAILED_PRECONDITION` / `INVALID_STATE`). For every refusal, confirm that relevant row counts and values, versions, transition logs and effect runs remain unchanged.

Test an ordinary user with no grant, page-only and action-only grants, rows owned by another user, forbidden fields, invalid relation targets, and stale workflow states. For multi-table operations, remove each required scope independently. Test direct API requests, rollback and independent revocation of direct/inherited sources. Use the inspector to understand decisions, not as a substitute for running the operation.

Explain to the user which business decisions were implemented, which settings they can maintain and which changes require development. Use the authorization Skill’s bundled quote/project/delivery workflow as the implementation reference, but do not copy demo credentials, fixed record IDs or reset endpoints into the App.

For a custom initial administrator, configure `users.initialAdmin` before the first seed run; see the authentication plugin Skill for its username/password contract. Omitting the node preserves the legacy account. The authentication seed creates the account only in an empty user table, and the authorization seed assigns root using the same configured username. Do not reset credentials at startup.

## Visible and manageable assignments

Default to named users selected through User management → Assign roles. Do not infer that all signed-in users should inherit a new business role. In particular, never seed a business permission set onto `authenticated:*`, add business grants to the platform member role, or reapply assignments at startup to make a feature accessible. A role editor lists that role's grants; unchecked actions are not denials of grants inherited from other sources. Inspect effective assignments before interpreting a permission test.

### Assign an existing user through User management

Use User management for real employee accounts and for exercising the assignment flow in a running test application. Its direct Permission Set scope is `app`. `GET /api/users/:userId` reads the managed profile and scope values, and `PUT /api/users/:userId/roleScopes/app` replaces the direct scope with `{ "value": ["sales-engineer"] }`. Read the current roles first and retain the other direct roles that should remain. The read needs `user/read` and the write needs `user/assign-role` on the target account. For one atomic profile and role change, send `PATCH /api/users/:userId` with the profile fields and `roleScopes: { app: [...] }` using a caller who has both permissions.

Use the installed Users client's public methods with the signed-in administrator's application API client. Supply the selected user's actual ID and the permission set key, such as `sales-engineer`.

```ts
import { createUuid, type ApiClient } from '@nocobase/app-client';
import { UsersClient } from '@nocobase/app-plugin-users/client/user-client';

async function assignSalesEngineer(api: ApiClient, userId: string) {
  const users = new UsersClient(api);
  const profile = await users.get(userId);
  const current = profile.roleScopes.app;
  const direct = typeof current === 'string' ? [current] : (current ?? []);
  const roles = [...new Set([...direct, 'sales-engineer'])];

  await users.replaceRoleScope(
    userId,
    'app',
    roles,
    `${Date.now()}.${createUuid()}`,
  );
  return (await users.get(userId)).roleScopes.app;
}
```

The fourth argument is the `Idempotency-Key`. In a form, use the template's `useSubmission` to reuse it with the same input on retry. The result of the second GET and User management both show the saved roles. Sign in separately as the assigned user to verify the effective grants. Other scopes and inherited assignments are independent of the direct `app` scope.

### Provision opt-in demo accounts

Keep fictional users, their roles and representative records together in opt-in sample data. Use `defineSeed({ name, sample: true, run })` for sample rows. Accounts and role assignments go through the Users service, so register them on `sampleDataToken` from a service provider's `boot()`; the hook runs once the application is ready, after the normal seeds created the permission sets, so the role ids it assigns already exist. `create()` takes `name`, `email`, `password` and optionally `username`, and `roleScopes: { app: [<permission set id>] }` assigns the direct roles in the same call:

```ts
import { userManagementServiceToken } from '@nocobase/app-plugin-users/server/tokens';
import { sampleDataToken } from '@nocobase/app-server/sample-data';

container.resolve(sampleDataToken).register({
  name: 'sales/demo',
  packageName: metadata.name,
  async run() {
    const users = container.resolve(userManagementServiceToken);
    const alice = await users.create({
      name: 'Alice Chen',
      username: 'alice',
      email: 'alice@example.com',
      password: 'demo12345',
      roleScopes: { app: ['sales-engineer'] },
    });
    // Use alice.id for the records that belong to her.
  },
});
```

Enable it on a fresh development database with `APP_SAMPLE_DATA=true pnpm dev`. After `pnpm nocobase db reset --force` the application is not started, so the hook has not run: follow it with `pnpm nocobase db sample`, which builds every registration still missing. Normal seeds prepare real permission sets and their grants. Use User management for ongoing real assignments. See [sample seeds](migrations.md#sample-data-and-demo-systems) and the installed `nocobase-app-plugin-users` Skill.

A global default is supported only when the user explicitly requests it and the application delivers an authorized administration control to inspect its recipient population, change the default role and revoke that assignment. User access details must distinguish direct roles from inherited roles and link to the source. If those controls are unavailable, explain the limitation and use explicit user assignments instead. Never invent a configuration flag, seed-only setting or undocumented SQL instruction as the administrator's normal adjustment interface.

Retain and run `pnpm exec vitest run tests/server/authorization-assignment-safety.test.ts` from the template. The test starts the real application on an isolated database, including registered migrations/seeds, and checks actual global assignments and member grants rather than searching source literals. When adding a genuinely requested global default, extend the expected baseline narrowly only after delivering the management UI and testing its visibility, update, revocation and authorization. Record that deliberate exception with the feature's tests; never delete or skip the guard. This test covers initialized state, not every later administrative write or custom subject resolver; also test effective access and direct API denials with ordinary identities.
