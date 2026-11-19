# Design application permissions

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

Declare `authz` on the first page of every path in `client/routes.ts`: `{ resource: { type: 'page', id }, action: 'access' }` for a business page, the page's `settings` item for a configuration page, `'unrestricted'` for a root-only page, or `'skip'` explicitly; nothing is inferred from the route name. Nested pages inherit it; an omitted value on a first page defaults to `'unrestricted'` for protected pages and `'skip'` otherwise, with a development warning. Use `useCan({ resource, action })` for button visibility and server-computed eligibility for record-sensitive actions. Keep pending/failed checks closed and refresh after permission changes. Client visibility does not enforce the API. The authorization Skill’s `references/client-development.md` includes the component, relation controls and settings lifecycle; all required APIs are bundled in that Skill rather than external package documentation.

## Configure the three-tab role editor

When you add an application feature with business permissions, update `client/pages/settings/permission-workspace.ts` in the same change. Keep the template's role form and its installed `@nocobase/permission-editor` component. Edit `permissionWorkspaceSelection` to expose the app's implemented business operations and connect its pages to the objects they use.

- **Menus** uses the application's registered navigation. A business route declares `authz: { resource: { type: 'page', id }, action: 'access' }`. The menu checkbox controls the page grant. Object tags are references, and checking a menu whose primary object lacks View triggers the empty-page warning. Give home pages that require sign-in only `authz: 'skip'` to keep their visible-for-everyone state.
- **Business objects** has one `business` entry per server-registered composite resource. List the exact registered action IDs the app actually implements. Name the read action `view` or `read`, or designate it with `view`. Declare its data scope on its own collection. Other operations on that collection follow View, and an additional scope on a different selected object's collection follows that object's View. Followers can use the View scope or a provably narrower scope.
- **System settings** comes from real settings routes and the catalog actions they use. Opening a settings page requires its opening action. Settings switches have no data scope controls.

Keep the template and component's layout and copy. Leave the artificial Main menu group, explanatory banners and footers, and object-list scope summaries out of the app. Keep the object reference tags, empty-page warning, unsaved-change feedback, per-action data scope controls, and security reminders.

Use stable, feature-qualified IDs, such as `sales.quotes`. The page permission ID is `route.authz.resource.id` and the business object ID is the name passed to `defineCompositeResource`. For a page dedicated to one object, give its page permission and composite the same ID. The template will infer the primary object if that object is selected. `pages` is keyed by `route.name` (for example, `'sales-quotes'`). Its `primary` and `related` arrays contain the selected business IDs without the `composite:` prefix. Use `primary` for the data needed to open a useful page and `related` for auxiliary data such as a picker. A declaration overrides inference for that route, so include `primary` when adding related objects to a page that would otherwise infer it. Omit `primary` for a related-only mapping or use `{}` to suppress the inferred object altogether. These associations leave stored grants unchanged.

### Example: quotes with a project picker

This example assumes the app registers `sales.quotes` with `view`, `edit` and `submit`, and `sales.projects` with `view`. Quote Submit declares separate scopes on the `quotes` and `projects` collections. Register each collection with a localized title and register each action with its localized business name. For example, register `projects` with title `{ key: 'sales.projects.title', ns: appPackageName }`, and give the Submit action `{ key: 'sales.quotes.actions.submit.title', ns: appPackageName }`. For catalog titles returned by the server, `appPackageName` is the application namespace from its `package.json`. A plugin uses its own package namespace for its own titles.

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
        quotes: { key: 'sales.quotes.title' },
        projects: { key: 'sales.projects.title' },
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

Give every selected action a one-sentence description in the app's locale files and reference it from `actionDescriptions`. Use the same feature/object/action keys for names and descriptions. Use `scopeOrder` for the display order of registered record access keys, widest first. Separately, declare every proven containment pair in `scopeSubsets`, outer key to inner keys, including any transitive pairs the editor should offer. In this example the server registers both custom quote scopes and Team quotes includes all My quotes for the same user. Leave independent scopes unrelated. Order and containment declarations configure presentation and do not implement server filtering.

Use the registered collection's localized title for every named scope. When the default scope caption is just the scope key or collection name, the template can take that title from the catalog. If supplying `scopeTitles` explicitly, key it by the scope's collection name and reuse that collection's title key, as shown above. Do not set `risks` in new application business selections. The template supplies the security reminders for system settings.

Add the following `sales` group to the existing exports in `client/locales/en-US.ts` and `client/locales/zh-CN.ts` respectively. Use the first group as the shape for every app locale. Keep application copy out of `client/locales/system/`.

```ts
// en-US.ts
sales: {
  quotes: {
    title: 'Quotes',
    actions: {
      view: { title: 'View', description: 'Read quotes within the selected scope.' },
      edit: { title: 'Edit draft', description: 'Change the amount and notes on draft quotes.' },
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
      edit: { title: '编辑草稿', description: '修改草稿报价单的金额和备注。' },
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

Test an ordinary user with no grant, page-only and action-only grants, rows owned by another user, forbidden fields, invalid relation targets, and stale workflow states. For multi-table operations, remove each required scope independently. Test direct API requests, rollback and independent revocation of direct/inherited sources. Use the inspector to understand decisions, not as a substitute for running the operation.

Explain to the user which business decisions were implemented, which settings they can maintain and which changes require development. Use the authorization Skill’s bundled quote/project/delivery workflow as the implementation reference, but do not copy demo credentials, fixed record IDs or reset endpoints into the App.

For a custom initial administrator, configure `users.initialAdmin` before the first seed run; see the authentication plugin Skill for its username/password contract. Omitting the node preserves the legacy account. The authentication seed creates the account only in an empty user table, and the authorization seed assigns root using the same configured username. Do not reset credentials at startup.

## Visible and manageable assignments

Default to named users selected through User management → Assign roles. Do not infer that all signed-in users should inherit a new business role. In particular, never seed a business permission set onto `authenticated:*`, add business grants to the platform member role, or reapply assignments at startup to make a feature accessible. A role editor lists that role's grants; unchecked actions are not denials of grants inherited from other sources. Inspect effective assignments before interpreting a permission test.

A global default is supported only when the user explicitly requests it and the application delivers an authorized administration control to inspect its recipient population, change the default role and revoke that assignment. User access details must distinguish direct roles from inherited roles and link to the source. If those controls are unavailable, explain the limitation and use explicit user assignments instead. Never invent a configuration flag, seed-only setting or undocumented SQL instruction as the administrator's normal adjustment interface.

Retain and run `pnpm exec vitest run tests/server/authorization-assignment-safety.test.ts` from the template. The test starts the real application on an isolated database, including registered migrations/seeds, and checks actual global assignments and member grants rather than searching source literals. When adding a genuinely requested global default, extend the expected baseline narrowly only after delivering the management UI and testing its visibility, update, revocation and authorization. Record that deliberate exception with the feature's tests; never delete or skip the guard. This test covers initialized state, not every later administrative write or custom subject resolver; also test effective access and direct API denials with ordinary identities.
