# Executable list and edit example

The starting point for a new list page: copy these files, rename the entity, then change fields, permissions and copy to your page plan. The source runs as the `/skill-projects` page of the Examples application (`packages/templates/app-template-examples/client/pages/skill-projects/`); the files linked below are generated from it and tested with it, so they follow the rules in [`ui-guidelines.md`](../ui-guidelines.md). For patterns it leaves out (filters, a status column, delete from the row menu, settings pages) see the [worked example](example.md); for relation pickers and batch assignment see the [customer/contact example](executable-relation-batch.md); for parent/child transactions and reviewers see the [business example catalogue](../../business-examples.md).

## What it shows

- [`index.tsx`](../../../assets/list-edit-example/client/pages/skill-projects/index.tsx) at `/skill-projects`: `PageHeader` with the only New button (shown with `useCan`), a metric card, `DataTable` with `DataTableSearch`, URL list state through the template's list-state hooks, built-in list states and phone cards via `renderCard`.
- [`edit.tsx`](../../../assets/list-edit-example/client/pages/skill-projects/edit.tsx) at `new` and `:projectId/edit`: create and edit in a `RouteDialog` (edit stacked on the drawer, reading the record fresh), `FeedbackForm` with `values`/`savedValues`, validation, submission lock and retry after an unknown outcome.
- [`detail.tsx`](../../../assets/list-edit-example/client/pages/skill-projects/detail.tsx) at `:projectId`: the detail in a `RouteDrawer` with loading, missing and denied states, Edit and Delete in the footer shown with `useCan`, and a delete confirmation that returns to the list.
- [`scopes.ts`](../../../assets/list-edit-example/client/pages/skill-projects/scopes.ts): the [data scopes](data-changes.md) views declare and writes announce, so the list, metric and drawer update without callbacks through the `Outlet`. [`locales.ts`](../../../assets/list-edit-example/client/pages/skill-projects/locales.ts): English and Chinese copy under one key group. [`access.ts`](../../../assets/list-edit-example/client/pages/skill-projects/access.ts): the `useCan` checks that show Create, Edit and Delete; the server checks every request again.

Server and database: [authenticated API](../../../assets/list-edit-example/server/routes/skill-projects.ts), [service](../../../assets/list-edit-example/server/providers/skill-projects.ts) and [migration](../../../assets/list-edit-example/database/main/migrations/202611030001_create_skill_projects.ts): server validation, an explicit page permission, transaction-bound writes and idempotency receipts. Tests: [client](../../../assets/list-edit-example/tests/client/skill-projects.test.tsx), [cross-view updates](../../../assets/list-edit-example/tests/client/skill-projects-changes.test.tsx), [application/API](../../../assets/list-edit-example/tests/server/skill-projects.test.ts) and [migration reversal](../../../assets/list-edit-example/tests/database/skill-projects-migration.test.ts).

## Copy it for a new page

1. Copy `client/pages/skill-projects/` to `client/pages/<feature>/`, and the server route, provider, migration and tests to the matching application directories. Rename the entity everywhere at once: identifiers, the scope name in `scopes.ts`, endpoint paths, the page permission id, route names and the locale group.
2. Give the copied migration a new, unused name and filename that sorts after every existing migration. The application must already have the submission receipt migration and the authentication and authorization providers; never expose the routes without them.
3. Merge `enUS`/`zhCN` from `locales.ts` into the application's locale resources under your feature's key, and register the server routes in `server/routes/index.ts`.
4. Declare the routes. The Examples `client/routes.ts` entry for `skill-projects` is the reference; in outline:

```ts
{
  name: 'skill-projects',
  path: '/skill-projects',
  auth: 'required',
  authz: { resource: { type: 'page', id: 'skill-projects' }, action: 'access' },
  navigation: { title: 'skillProjects.title', icon: FilePenLine },
  componentLoader: () => import('./pages/skill-projects/index.js'),
  children: [
    {
      name: 'skill-projects-new',
      path: 'new',
      presentation: { kind: 'dialog', title: 'skillProjects.create' },
      componentLoader: () => import('./pages/skill-projects/edit.js'),
    },
    {
      name: 'skill-projects-detail',
      path: ':projectId',
      presentation: { kind: 'drawer', title: 'skillProjects.detail' },
      componentLoader: () => import('./pages/skill-projects/detail.js'),
      children: [
        {
          name: 'skill-projects-edit',
          path: 'edit',
          presentation: { kind: 'dialog', title: 'skillProjects.edit' },
          componentLoader: () => import('./pages/skill-projects/edit.js'),
        },
      ],
    },
  ],
}
```

The children inherit the page grant. Give the overlay routes permission display names (`skillProjects.create`, `skillProjects.edit`, the detail title) in the application's page-permission title mapping ([`page.md`](page.md)).

5. Change the fields to the page plan. A record with more than about 15 fields, sections or related lists gets a detail page at `:id/details` instead of the drawer ([`page.md`](page.md)); forms stay in a `RouteDialog`. The example caps its dataset at 100 records and says so; for larger data page on the server as the [worked list page](example/list-page.md) does.

The client source imports template components through `#components` and hooks through `#hooks`; it is application code, not a standalone package. The client tests use the Examples template's authenticated rendering helper; adapt that import to your application's test harness.

## Run and check

In a NocoBase source checkout, configure and start `packages/templates/app-template-examples` as usual (`pnpm dev`), sign in and open `skill-projects` under the printed application entry URL. Use the root administrator or assign its page permission explicitly; never widen every member's access to run an example. From that directory:

```bash
pnpm exec vitest run tests/client/skill-projects.test.tsx tests/client/skill-projects-changes.test.tsx tests/server/skill-projects.test.ts tests/database/skill-projects-migration.test.ts
pnpm typecheck
pnpm build
```

The client tests use the real application client with controlled responses (fast and slow requests, covered lists, cancellation, form errors, recovery); the server tests start the actual application on disposable databases and assert persisted rows and receipt replay. Neither replaces looking at the page at 1440 and 390 px ([`ui-workflow.md`](../ui-workflow.md)).

## Maintain the contract

Edit the Examples implementation and its tests first, then run `node scripts/sync-app-skill-examples.mjs` from the repository root to refresh the published copies; `--check` rejects missing, changed or obsolete copies and runs in the root script tests. Never edit a generated copy alone or delete a failing assertion to hide drift.

## Recovery boundaries

Only the operation key and an input digest survive a reload; project names are not persisted. A restored uncertain form accepts the original name exactly, rejects a different one before sending, and retries with the original key. A missing row alone does not prove whether an earlier update committed: the update endpoint resolves its same-key receipt first and either confirms the earlier save (the row was removed afterwards) or records a terminal "not applied" receipt. The client acknowledges only these explicit outcomes; a generic 404 during recovery stays retryable. This relies on one database update and no external side effects; keep application-specific reconciliation when adapting.
