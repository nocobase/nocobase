# Executable list and edit example

For parent/child transactions, scoped reference selection, exact amounts and a designated reviewer, see the [business example catalogue](../../business-examples.md). Keep this shared-dataset list/edit example's permission policy distinct from those business record scopes.

Start here for the tested core list/create/edit interaction. The source runs as the `/skill-projects` page in the Examples application. These [published source files](../../../assets/list-edit-example/client/pages/skill-projects/index.tsx) are generated from that application's compiled source, not independently maintained Markdown snippets. Adapt the business names, permission resource, schema and copy to your requirement; the example's page grant allows management of one shared learning dataset, not a production authorization policy.

## Source

- [List page](../../../assets/list-edit-example/client/pages/skill-projects/index.tsx): the real DataTable, preserved parent list, active request guard, cancellable 300 ms feedback and a permanently reserved feedback slot.
- [Create/edit dialog](../../../assets/list-edit-example/client/pages/skill-projects/edit.tsx): fresh record read, FeedbackForm, validation inside the submission lock, corrected-field revalidation, retry, original-input recovery after reload, and successful return to the list.
- [English and Chinese copy](../../../assets/list-edit-example/client/pages/skill-projects/locales.ts).
- [Authenticated API](../../../assets/list-edit-example/server/routes/skill-projects.ts), [database service](../../../assets/list-edit-example/server/providers/skill-projects.ts) and [migration](../../../assets/list-edit-example/database/main/migrations/202611030001_create_skill_projects.ts): server validation, explicit page permission, transaction-bound writes and idempotency receipts. An existing App must already have the submission receipt migration and authentication/authorization providers; do not silently expose these routes without them. Give a copied migration a new, unused name and filename before its first application.
- [Client regression tests](../../../assets/list-edit-example/tests/client/skill-projects.test.tsx), [actual application/API tests](../../../assets/list-edit-example/tests/server/skill-projects.test.ts) and [migration reversal test](../../../assets/list-edit-example/tests/database/skill-projects-migration.test.ts).

## Run and adapt

In a NocoBase source checkout, the application is `packages/templates/app-template-examples`. Follow its normal configuration, database apply and `pnpm dev` instructions, then sign in and open `skill-projects` under the printed application entry URL. Use the existing root administrator or explicitly assign its page permission; never broaden all members' access just to run an example. No extra database service is required for the default SQLite configuration.

In an existing application, copy the required source files into the matching application-owned directories, merge `enUS`/`zhCN` from the example's `locales.ts` as `skillProjects` in your locale resources, and register `skillProjectsRoutes` in `server/routes/index.ts`. Register a parent page named `skill-projects` at `/skill-projects`, requiring authentication and `{ resource: { type: 'page', id: 'skill-projects' }, action: 'access' }`, loading `client/pages/skill-projects/index.tsx`. Its `new` and `:projectId/edit` child routes both load `edit.tsx`. Give the parent navigation the `skillProjects.title` key, and give the overlay permission titles the `skillProjects.create` and `skillProjects.edit` keys. Use your own feature's identifiers when adapting it. The source imports template components through `#components` and hooks through `#hooks`; it is application code, not a standalone React package. The client tests use the Examples template's authenticated rendering helper and locale resources; adapt those imports to your application's test harness.

From the Examples application, run the behavior and database checks with:

```bash
pnpm exec vitest run tests/client/skill-projects.test.tsx tests/server/skill-projects.test.ts tests/database/skill-projects-migration.test.ts
pnpm typecheck
pnpm build
```

Client tests use the real application client and controlled HTTP responses to exercise fast/slow requests, covered lists, cancellation, form errors and recovery. Server tests start the actual application on disposable databases, sign in through native authentication and assert persisted rows and receipt replay. Neither is a substitute for browser layout inspection. The example caps its dataset at 100 records and explicitly reports that cap; use the [server table pattern](example/server-table.md) when the business needs larger datasets.

## Maintain the contract

In the source repository, edit the Examples implementation and its tests first. Run `node scripts/sync-app-skill-examples.mjs` from the repository root to refresh the published resources. `node scripts/sync-app-skill-examples.mjs --check` rejects missing, changed or obsolete copies. The root script test suite runs that check, while the existing Examples `test`, `typecheck` and `build` commands exercise the actual implementation in CI. Do not edit a generated resource alone or remove a failing assertion to make documentation drift pass.

The [expanded worked example](example.md) covers further patterns such as detail drawers, delete recovery and server pagination. Those additional Markdown examples are not included in this first executable contract.

## Recovery boundaries

Only the operation key and input digest survive a reload; this example does not persist project names. A restored uncertain form permits entering the original name exactly (including whitespace), rejects a mismatch before sending a request, and retries with the original key. Within the same mount, the original snapshot remains locked.

A missing row alone does not prove whether an earlier update committed. The update endpoint resolves its same-key receipt first: it either confirms the earlier save and reports that the row was subsequently removed, or commits a terminal no-update receipt under the unique claim before reporting that nothing was applied. The client acknowledges only these explicit outcomes. A generic recovery 404 keeps the operation retryable. These terminal receipts rely on this example having one database update and no external side effects; retain application-specific reconciliation when adapting the example.
