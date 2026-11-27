# Client routes, action visibility and record eligibility

The sales workflow has three independent pages: Projects, Quotes and Orders. Delivery specialists enter Orders without gaining entry to Projects or Quotes. Declare `authz` on every entry page; nothing is inferred from the route name. A page that needs only sign-in, such as an overview, declares `authz: 'skip'`; business pages never do.

## Register the runtime first

Register the main authorization client factory and server plugin alongside authentication. The authorization React provider depends on the authentication provider; retain their normal composition order. A package dependency alone does not activate either side. Optional rule plugins require their owning installed Skills; follow [capability discovery](optional-capabilities.md) before using them. See [runtime setup](runtime-api.md).

Application-owned pages belong in the App's `client/routes.ts` and page modules. A reusable plugin contributes routes through its client declaration. Use stable page ids that match the permission-set page grant:

```ts
import { defineAppRoutes } from '@nocobase/app-client/plugins';

export default defineAppRoutes([
  {
    name: 'sales-quotes',
    path: '/sales/quotes',
    auth: 'required',
    navigation: { title: 'sales.quotes' },
    authz: { resource: { type: 'page', id: 'sales.quotes' }, action: 'access' },
    componentLoader: () => import('./pages/quotes-page.js'),
  },
]);
```

The page module default-exports a React component. Translate the navigation key in its owning namespace. Paths omit the deployment base path. Declare `authz` on the first page of every path. A nested page that omits it inherits its nearest ancestor page's value, and a child's own value overrides it. A first page that omits it still registers, with a development warning, but defaults to `'unrestricted'` on a protected App page, which only identities with unrestricted access such as root may open or see, and to `'skip'` on a guest or optional page; always declare it rather than rely on that. Declare `'skip'` for a page that needs no check beyond sign-in, and remember that `'skip'` does not bypass parent guards. `'unrestricted'` may also be declared for a root-only page; nothing grants it, so it is never listed in the permission workspace. The client route tree supplies candidate page resources whose `authz` checks `page` `access`, in menu order; the application selects and groups the pages offered for delegation; there is no server page registration. `authz.pages.grant('sales.quotes')` builds the matching grant for seeds and provisioning. The available composites and settings items carry the subsections the server places them in with `authz.ui.place` (subsections are added with `authz.ui.sections.add`), or under their default section's "Other". A page grant opens an entry; business data needs its own action grants, and renaming a page id orphans the grants that reference it.

## Check feature visibility

```tsx
import { useCan } from '@nocobase/app-plugin-authorization/client';

const permission = useCan({
  resource: { type: 'composite', id: 'sales.quotes' },
  action: 'submit',
});
// permission: { can, isPending, error, retry }
```

Call Hooks inside a component or custom Hook. While pending or failed, `can` is false; show a loading state or retryable permission error without exposing stale actions. `{ enabled: false }` as the second argument skips a check. `useCan('unrestricted')` passes only for an identity whose snapshot is unrestricted, such as root; route guards and menus use it for `authz: 'unrestricted'` pages. Never call Hooks conditionally. A successful check means the feature is granted, not that a particular quote can be submitted.

React code can obtain the shared client with `useAuthorizationClient()`. Outside React, resolve `authorizationClientToken` from the App container and call `client.can({ resource, action })`, or `client.can('unrestricted')` to ask whether the identity has unrestricted access. `useAuthorizationRevision()` supports custom state that must reload on invalidation. Avoid a module-global client or permission response surviving an identity change. The standard provider and `useCan` already handle session invalidation; do not duplicate snapshot caching. After a change that affects permissions, call `client.invalidate()` so the next check reloads `snapshot()`.

## Obtain row eligibility from the server

The sales list endpoints return per-record allowed operations; the client combines this with feature visibility. On the server, compute submission eligibility from the same declared action policies: required quote read/write fields, quote scope, actual parent-project scope, positive amount and draft status. Check all required scopes; merely seeing the row through View does not prove Submit.

Do not implement a parallel role-to-button matrix or infer permissions from role names. Never download all rows and filter them locally. Eligibility is a UI hint and can become stale; the mutation endpoint must authorize and validate again.

```tsx
import { useApiClient } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useState } from 'react';

export function SubmitQuote({
  quote,
  reload,
}: {
  quote: { id: string; canSubmit: boolean };
  reload: () => Promise<void>;
}) {
  const api = useApiClient();
  const access = useCan({
    resource: { type: 'composite', id: 'sales.quotes' },
    action: 'submit',
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  if (access.isPending) return <span>Checking access…</span>;
  if (access.error)
    return (
      <button onClick={() => void access.retry()}>
        Retry permission check
      </button>
    );
  if (!access.can) return null;
  return (
    <>
      <button
        disabled={!quote.canSubmit || pending}
        onClick={async () => {
          setPending(true);
          setError(undefined);
          try {
            await api.request({
              path: `sales/quotes/${encodeURIComponent(quote.id)}/submit`,
              method: 'POST',
            });
            await reload();
          } catch (cause) {
            setError(
              cause instanceof Error ? cause.message : 'Submission failed',
            );
          } finally {
            setPending(false);
          }
        }}
      >
        Submit
      </button>
      {error && <p role='alert'>{error}</p>}
    </>
  );
}
```

This component illustrates a customer-owned endpoint and a `canSubmit` response field that its server must implement. Replace the minimal button/status markup with App UI primitives and translation keys in production. `api.request` uses `path`, `method`, `query` and `json`; it returns the parsed response body. Do not repeat `/api` or the deployment mount, construct a second API client, or import server registration modules into the client bundle to obtain a resource name. Share small browser-safe identifiers when needed.

After a write, reload affected records and relationship controls, preserve the current selected order where possible, and recompute eligibility. For stale state, forbidden and validation responses, display the server outcome and refresh relevant data; never force the optimistic state to remain submitted after rejection. No client flag can replace server enforcement.

## Delivery relation controls

The order relation endpoint returns existing relations, permitted relation operations and target options derived from the `manageRelations` policy. Offer only allowed create/update/upsert/connect/disconnect/set/delete controls. Existing relation reads use the View policy; mutation eligibility also requires an eligible order and business state. Carrier options come from the relation target scope, for example active carriers. They do not use the authorization-management subject picker.

Request bodies for an App-owned `POST sales/orders/:id/relations` endpoint look like:

```json
{ "carrier": { "connect": { "id": "express" } } }
```

```json
{
  "checks": {
    "update": [{ "filter": { "id": "check-1" }, "values": { "done": true } }]
  }
}
```

```json
{
  "collaborators": {
    "connect": [
      { "where": { "id": "freight" }, "through": { "note": "Review" } }
    ]
  }
}
```

These are sample ids; fetch actual options from the endpoint. Never expose protected foreign keys or internal join fields as a shortcut around a denied relation operation. A rejected nested mutation must leave the whole write rolled back.

## Configure the role editor

The role editor is part of this plugin's Roles and permissions page, which the client plugin registers in the System settings' Account and permissions category; an application never copies it. The application passes what only it knows through the plugin's options in `client/plugins.ts`: `pageCatalog`, `workspace` (`permissionWorkspaceSelection`) and `pageTitles`. When you add an application feature with business permissions, update `client/pages/settings/permission-workspace.ts` in the same change: edit `permissionWorkspaceSelection` to expose the app's implemented business operations and connect its pages to the objects they use. To add to the page itself, see [Extend the Roles and permissions page](#extend-the-roles-and-permissions-page).

A role's detail has the tabs **Page access**, **Operations**, **System settings** and **Members**, followed by any `roleTabs` another package registers. Saving opens a review that lists every page, operation and setting that changed and marks high-risk grants; members are added and removed at once, apart from the draft.

- **Page access** uses the application's registered navigation. A business route declares `authz: { resource: { type: 'page', id }, action: 'access' }`. The page checkbox controls the page grant. Each page shows how many of its objects' operations are on, and a checked page whose primary object lacks View is marked as opening empty. Give home pages that require sign-in only `authz: 'skip'` to keep their visible-for-everyone state.
- **Operations** has one `business` entry per server-registered composite resource. List the exact registered action IDs the app actually implements. Name the read action `view` or `read`, or designate it with `view`. Declare its data scope on its own collection. Other operations on that collection follow View, and an additional scope on a different selected object's collection follows that object's View. Followers can use the View scope or a provably narrower scope.
- **System settings** comes from real settings routes and the catalog actions they use. Opening a settings page requires its opening action. Each page offers None, View and Manage, with the individual switches below; settings switches have no data scope controls.
- **Members** lists who holds the role through the `permissionSets` subject directory and adds or removes them at once; the server keeps the last member of a role the application must keep in use.

**Declare the pages an operation is used on.** On the server, a composite names the page permission IDs it is used on with `usedOn(...pages)`, and an action names the pages that turn it on with `defaultFor(...pages)`, usually only View. Neither grants anything. The editor lists each object under “Used on” those pages, groups objects used on no page under Other operations, warns when an operation is on but none of its pages is open, and, when an administrator checks a page, turns its `defaultFor` actions on at their default scope and says so. Risky and managed actions are never turned on this way. A page the application maps in `pages` keeps its mapping; `usedOn` only fills in pages it does not map.

```ts
defineCompositeResource('example.crm.customers', (r) =>
  r
    .title('Customers')
    .usedOn('customer-contacts')
    .action('view', (a) =>
      a.title('View').defaultFor('customer-contacts').grant('customers', data),
    ),
);
```

**Preset roles that read related objects.** When an operation such as create or dispatch has a scope on another object's records, a seeded or API-created role grants that object's View too, with the narrowest scope the job needs, and gives the operation's slot the same record access key or one declared narrower in `scopeSubsets`. For example, a dispatcher whose `create` reads stations, carriers and vehicles and whose `dispatch` reads drivers also gets `view` on each of those four objects: stations limited to `tms.myStations`, the others to `tms.activeRecords`, with the same keys on the operation slots. The editor then shows these slots as following that View. A role stored without it keeps working as the server checks each slot, and the editor shows the stored value read-only with “Needs X view” and saves it unchanged, including when only the role name changes; it changes only after an administrator turns that View on, which caps any wider slot to the View's scope and says so. Do not grant a View on save or rename to fix an older role, and do not rely on the editor to repair a seed: write the View into the seed. Menu page grants stay separate, and system settings are granted for what the job administers.

Keep the template and component's layout and copy. Leave the artificial Main menu group, explanatory banners and footers, and object-list scope summaries out of the app. Keep the object reference tags, empty-page warning, unsaved-change feedback, per-action data scope controls, and security reminders.

Use stable, feature-qualified IDs, such as `sales.quotes`. The page permission ID is `route.authz.resource.id` and the business object ID is the name passed to `defineCompositeResource`. For a page dedicated to one object, give its page permission and composite the same ID. The template will infer the primary object if that object is selected. `pages` is keyed by `route.name` (for example, `'sales-quotes'`). Its `primary` and `related` arrays contain the selected business IDs without the `composite:` prefix. Use `primary` for the data needed to open a useful page and `related` for auxiliary data such as a picker. A declaration overrides inference for that route, so include `primary` when adding related objects to a page that would otherwise infer it. Omit `primary` for a related-only mapping or use `{}` to suppress the inferred object altogether. These associations leave stored grants unchanged.

Use localized operation titles in the role editor: generic names such as View, Create, Edit and Delete for standard actions, and short verb phrases such as Receive or Verify dispatch for business actions. Do not repeat the object name in the operation label; describe the object and effects in `actionDescriptions`.

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

### Example: create a waybill with scoped related records

This example registers the business object `tms.waybills`, whose collection/table is `tmsWaybills`. The `create` action has four registered scope slots: `waybills` for the new row, plus `carriers`, `sites` and `vehicles` for the existing related rows selected by the form. The authorization API returns policies keyed by collection/table name, so use `conditions.database.tmsWaybills`, `tmsCarriers`, `tmsSites` and `tmsVehicles`, never the composite ID or scope-slot names.

The server declaration uses the same slot names as the editor configuration below. It grants create fields on `tmsWaybills` and read access on each related table. Register those four collections and place the composite in the owning provider so the editor catalog includes it.

```ts
import { defineCompositeResource } from '@nocobase/authorization/core';
import { defineDatabasePermission } from '@nocobase/app-plugin-authorization/server';

interface Waybill {
  id: string;
  reference: string;
  carrierId: string;
  originSiteId: string;
  destinationSiteId: string;
  vehicleId: string;
}
interface NamedRecord {
  id: string;
  name: string;
}

const waybillData = defineDatabasePermission((p) =>
  p
    .collection<Waybill>('tmsWaybills')
    .title('Waybills')
    .read([
      'id',
      'reference',
      'carrierId',
      'originSiteId',
      'destinationSiteId',
      'vehicleId',
    ]),
);
const carrierData = defineDatabasePermission((p) =>
  p
    .collection<NamedRecord>('tmsCarriers')
    .title('Carriers')
    .read(['id', 'name']),
);
const siteData = defineDatabasePermission((p) =>
  p.collection<NamedRecord>('tmsSites').title('Sites').read(['id', 'name']),
);
const vehicleData = defineDatabasePermission((p) =>
  p
    .collection<NamedRecord>('tmsVehicles')
    .title('Vehicles')
    .read(['id', 'name']),
);

export const waybills = defineCompositeResource('tms.waybills', (r) =>
  r
    .title('Waybills')
    .action('view', (a) => a.title('View').grant('waybills', waybillData))
    .action('create', (a) =>
      a
        .title('Create')
        .grant(
          'waybills',
          waybillData.create([
            'reference',
            'carrierId',
            'originSiteId',
            'destinationSiteId',
            'vehicleId',
          ]),
        )
        .grant('carriers', carrierData)
        .grant('sites', siteData)
        .grant('vehicles', vehicleData),
    ),
);

// In the owning provider's boot method:
authz.database.collections.add({ name: 'tmsWaybills', title: 'Waybills' });
authz.database.collections.add({ name: 'tmsCarriers', title: 'Carriers' });
authz.database.collections.add({ name: 'tmsSites', title: 'Sites' });
authz.database.collections.add({ name: 'tmsVehicles', title: 'Vehicles' });
const reference = authz.compositeResources.define(waybills);
authz.ui.sections.add({ name: 'tms', title: 'Transport', parent: 'business' });
authz.ui.place(reference, { section: 'tms' });
```

In `client/pages/settings/permission-workspace.ts`, configure that exact composite and hide only the new waybill's own scope. Keep all three related-record scopes visible, with short action titles supplied by the registered resource; use the registered collection names as the `scopeTitles` keys.

```ts
export const permissionWorkspaceSelection: PermissionWorkspaceSelection = {
  business: [
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
    },
  ],
};
```

Authorize the action before opening the write transaction. Check every expected collection policy, then use each one with the repository of the same name. The related-record lookups enforce the three picker scopes; the waybill repository policy enforces the create grant on the new row.

```ts
import { AuthorizationDeniedError } from '@nocobase/authorization/core';
import type { AuthorizationContext } from '@nocobase/app-plugin-authorization/server';
import type { DatabaseManager } from '@nocobase/db';

export async function createWaybill(
  database: DatabaseManager,
  authorization: AuthorizationContext,
  input: {
    reference: string;
    carrierId: string;
    originSiteId: string;
    destinationSiteId: string;
    vehicleId: string;
  },
): Promise<void> {
  const decision = await authorization.authorize({
    resource: { type: 'composite', id: 'tms.waybills' },
    action: 'create',
  });
  const policies = decision.conditions?.database;
  if (
    decision.effect === 'deny' ||
    !policies?.tmsWaybills ||
    !policies.tmsCarriers ||
    !policies.tmsSites ||
    !policies.tmsVehicles
  )
    throw new AuthorizationDeniedError(decision);

  await database.transaction(async (connection) => {
    const carrier = await connection
      .repository('tmsCarriers')
      .withPolicy(policies.tmsCarriers)
      .findOne({ filter: { id: input.carrierId } });
    const origin = await connection
      .repository('tmsSites')
      .withPolicy(policies.tmsSites)
      .findOne({ filter: { id: input.originSiteId } });
    const destination = await connection
      .repository('tmsSites')
      .withPolicy(policies.tmsSites)
      .findOne({ filter: { id: input.destinationSiteId } });
    const vehicle = await connection
      .repository('tmsVehicles')
      .withPolicy(policies.tmsVehicles)
      .findOne({ filter: { id: input.vehicleId } });
    if (!carrier || !origin || !destination || !vehicle)
      throw new AuthorizationDeniedError(decision);

    await connection
      .repository('tmsWaybills')
      .withPolicy(policies.tmsWaybills)
      .createOne({ values: input });
  });
}
```

Validate and normalize request fields with the route's input schema, and include any server-owned fields required by the collection. The role's View grants for Carriers, Sites and Vehicles must also be present when the user needs to choose those records; the Create action does not grant those separate View actions.

After generating the application, verify directly that `defineCompositeResource('tms.waybills', ...)` uses a different identifier from the `tmsWaybills` table, and that each `scopeTitles` key matches a registered table name (`tmsWaybills`, `tmsCarriers`, `tmsSites` or `tmsVehicles`). In the role editor, confirm the operation titles are `View` and `Create`, Create shows exactly Carriers, Sites and Vehicles, and no selector appears for the new waybill's own `waybills` slot. Submit one valid Create request with in-scope carrier, site and vehicle choices and verify exactly one waybill is written. Then submit out-of-scope carrier, site and vehicle choices separately as an ordinary user; each request must be denied and leave the waybill count unchanged.

## Extend the Roles and permissions page

The page and its options belong to the plugin:

```ts
authorization({
  pageCatalog: permissionPageCatalog, // how the role editor lists the application's pages
  workspace: permissionWorkspaceSelection, // business objects and the pages that use them
  pageTitles: pagePermissionTitles, // titles of pages without a navigation or breadcrumb title, by route name
  // routes: false leaves the pages unregistered
});
```

Every option is optional. Without `pageCatalog` the editor reads the registered routes through `defaultPermissionPageCatalog`; without `workspace` it lists no business objects. Route names (`permissionManagement`, `roles`, `defaultAccess` and their detail routes, and `settingsPermissionCheck`) and the settings items they check (`authorization.permission-sets`, `authorization.default-access`) are stable, so existing grants keep working.

Another package extends the page from its client service provider through `authorizationSettingsToken`, imported from `@nocobase/app-plugin-authorization/client/settings`. That entry point holds only types, the token and lazy loaders, so importing it at startup loads no page code. It offers three ordered registries; `add` returns a function that removes the tab, and adding a key twice throws.

- `pageTabs`: a top tab of the page. Each one is a System settings page of its own that its package registers with `defineSystemSettingsRoutes` under the `permissionManagement` module, rendered inside `AuthorizationPage` so a link, Back and a reload keep the tab. The entry names its `path` and the page's own `authz`; the tab shows only to those it admits, and the tab bar hides when only one tab is open to the person.
- `ruleTabs`: one kind of data rule under the Data rules tab, chosen with `?rule=<key>`, loaded lazily through `component` and shown to those who pass its `authz`. The Default access, Sharing rules and Restriction rules plugins each add theirs with the loaders `loadDefaultAccessRules`, `loadSharingRules` and `loadRestrictionRules` (orders 10, 20 and 30). Their lists share one component: a rule opens in a side sheet over its list through `?create=1` or `?edit=<key>`, so closing the sheet with unsaved changes asks once, and the old `default-access/create` and `default-access/:key/edit` addresses redirect there.
- `roleTabs`: a tab of a role's detail after Members, loaded lazily through `component` and shown to those who pass its `authz`. It receives `permissionSet`, the saved role, and `editable`, whether the person may change it.

```ts
this.app.container.resolve(authorizationSettingsToken).ruleTabs.add({
  key: 'default-access',
  title: { key: 'settings.defaultAccess.title', ns: AUTHORIZATION_NAMESPACE },
  order: 10,
  authz: {
    resource: { type: 'settings', id: 'authorization.default-access' },
    action: 'read',
  },
  component: loadDefaultAccessRules,
});
```

Give a tab a lower `order` to place it earlier; the built-in tabs are `ROLES_TAB` (10), `DATA_RULES_TAB` (20) and `PERMISSION_CHECK_TAB` (30). Translate its title in the contributing package's namespace.

The Permission check tab (`settingsPermissionCheck`, `/permission-check`) reads the inspector, so its route and tab require `'unrestricted'`. It picks a user, then lists everything the user may do with the role each permission comes from (`inspector/configuredAccess` and `inspector/batchDecide`), or checks one operation (`inspector/decide`) step by step: the roles that grant it, then the Default access, Sharing and Restriction rules that name the object, the operation and the user or a subject the user inherits, each linking to its rule. A rule plugin the application does not install shows as not installed. It never writes.

## Settings screens

A settings screen is an ordinary application page: declare it among the App's own routes in `client/routes.ts` with `defineAppRoutes`, a lazy page module, navigation keys and `authz: { resource: { type: 'settings', id }, action: 'read' }` naming a settings item registered on the server with `authz.settings.add`. Declare `authz` on every such entry page: one that omits it defaults to `'unrestricted'`, which only root may open. Check read and each write action separately in the endpoints. The Roles and permissions page, with its role editor and the Data rules tab, comes from this plugin; extend it through its extension points instead of building another one.

For a new configuration screen, use the shared API client, one saved baseline and one draft per saved section, route-backed child tabs with `Outlet`, unsaved-navigation protection and explicit save and error states. Read-only access renders data without writable controls. Options and search endpoints need the calling settings permission too. Only add an independent directory permission if the business directory has that additional boundary; a subject picker relies on the calling management permission.

Verify menu and direct URL behavior, no-grant, page-only and action-only cases, pending and failed checks, session switching, out-of-scope rows, stale transitions, relation target constraints and post-save refresh. Perform actual API requests as ordinary users in addition to UI checks.

A settings screen and its detail routes check the relevant `settings` item, never `page` `access`, so they are not offered as page grants.

## Match permissions to real business operations

Build the application-owned action catalog from the operations that the application actually implements. Map each independently assignable operation to its visible entry or button, server request, affected fields and record scopes before composing the Registry rows. Reuse the same action when list and detail pages perform the same operation. Use the button's business name in the permission title and explain the outcome in its description. Do not invent CRUD actions for an application that has no such operation, and do not bundle independently assignable steps behind an ambiguous Manage permission. Save, Cancel, search and pagination are interaction controls, not additional business permissions.

For example, an equipment borrowing application can expose Submit request, Approve, Reject, Register return and Withdraw; a repair application can expose Submit report, Start repair, Decline repair and Complete repair. These are illustrative operations, not a built-in catalog. Declare each application's actual steps. A page-access grant opens a business page; View reads permitted records; a transition grant authorizes that transition within its own record ranges. A read list must not require an unrelated write permission. Every system-settings entry belongs to the System settings tab and still needs an actual exposed configuration page.

Keep permission, data range and business eligibility distinct. Having Approve does not bypass the pending state, device availability, actor checks, validation or concurrency controls. Render action availability from the operation's server decision and current record state, and enforce the same action and all affected record scopes for direct requests. A form's related-record picker uses that operation's scope, rather than assuming that the broader register View scope authorizes submission. Only show the named ranges the operation uses; do not display every collection in the module.

For a Create action, the new record has no pre-existing row to filter. Hide its own created-record scope selector in the role UI, while keeping the registered scope and any stored value intact. If creation selects an existing related record, continue to show and enforce that related-record range; label it by business purpose (for example, devices available for a borrowing request). Localize custom-filter field captions for the actual collection without changing field paths or saved filter parameters. Treat these as application-owned presentation decisions, not fixed Registry data.

Changing a label cannot split a bundled permission. Change its server declaration, request enforcement, frontend availability and application selection together. Upgrade existing grants and action-specific default, sharing and restriction rules transactionally, preserving selections, custom filters, subjects and unrelated settings. Retain immutable installation seeds and add an incremental, repeatable compatibility step; never select All records as a shortcut. Test each new action independently, denied sibling actions, out-of-scope target and related records, invalid states, retries and unchanged historical data. Registry source and examples supply presentation, not application authorization or migration policy.
