# Procurement request example

This application-owned example covers four collections, reference selection, integer minor-unit amounts, atomic parent/child saves and one designated reviewer. It reuses native Users, Permission Sets, submission receipts and the registered lifecycle example runtime/history. It is a fixed single-person confirmation flow, not the commercial Approval plugin. It adds no workflow management page. Authorized history is shown on the request itself.

## Run

From the source workspace, install with `pnpm install`, then use `pnpm --filter @nocobase/app-template-examples exec nocobase config init` and `pnpm --filter @nocobase/app-template-examples exec nocobase config check`. Configure a separate disposable database/storage before starting `pnpm --filter @nocobase/app-template-examples dev`; use the printed server `Local:` URL followed by `/procurement`. Enable `app.sampleData` before the first install to load the deterministic supplier and material samples. Existing installations can run `pnpm nocobase db sample` from this application; preview the available CLI command/flags first with `--help`.

Create two ordinary users through native registration or Users management. An administrator explicitly assigns **Procurement applicant** to one user and **Procurement reviewer** to the other in Users → roles. The roles include page access and the corresponding procurement action; there is no wildcard assignment or member-role extension. A root user still follows ownership and non-self-review rules. Reviewer choices require current native review permission. Suppliers/materials require `active=true` and either a null `allowedUserId` (shared) or the applicant's user ID. Dictionary changes are maintained through the existing permission-protected database administration capability; business roles receive no generic collection-write grants.

The page searches requests by title and state. Reference controls search names, explicitly filter availability and never select an inactive record. Add, edit or remove up to 50 lines, save the draft, close/reopen it, and submit. The designated reviewer can reject; the applicant edits and resubmits; the reviewer approves. Submitted and approved requests are read-only. A stale save/decision is refused rather than overwriting current state. Reload after conflicts or uncertain decisions. Creation retries reuse the existing receipt mechanism; this example creates no new receipt table.

## Rules and APIs

`GET /api/procurement/context`, `GET /api/procurement/candidates?kind=suppliers|materials|reviewers&q=&active=true`, `GET /api/procurement?q=&status=&page=1&pageSize=20`, `GET /api/procurement/{id}`, `POST /api/procurement`, `PATCH /api/procurement/{id}` and `POST /api/procurement/{id}/fire` are declared in the signed-in API document. Paths below a deployment include that application's base path. The server enforces capabilities and record scope independently of page permissions and button visibility. Detail includes child rows and native transition history; there is no unscoped child endpoint. Generic repository endpoints confer no procurement write permission.

Quantities are integers from 1 to 100,000. Prices are nonnegative decimal strings with at most two fractional digits and seven integer digits; USD is the example's one currency. The server converts to integer cents, limits each request to 2,000,000,000 cents and compares the submitted preview total to its own calculation. It stores line name/price snapshots. New drafts may omit title, supplier, reviewer and lines; provided lines must be valid. Submission revalidates completeness, amounts and references inside its transaction. A rejection can be resubmitted; approval is terminal.

Each save uses one outer transaction for the parent, child writes and creation history. Editing conditionally updates the current state/version before replacing lines. State changes use native `runtime.fire()` with the displayed version and a request key, joining the outer transaction. Capability/reviewer membership is checked before the transaction, while record state, reference visibility and amount validation occur inside it. Reference changes do not retroactively rewrite submitted snapshots. No background task, poll or runner-claim work is added.

## Verify and reset

From this application's directory:

```bash
pnpm exec vitest run tests/client/procurement.test.tsx tests/server/procurement.test.ts tests/database/procurement.test.ts tests/server/authorization-assignment-safety.test.ts
pnpm typecheck
pnpm lint
pnpm build
pnpm exec playwright test tests/playwright/procurement.test.ts
pnpm nocobase app procurement-reset --dry-run --json
pnpm nocobase app procurement-reset --force --json
```

The browser test requires `APP_URL` to identify an independent disposable application and synthetic test administrator credentials in `E2E_USERNAME`/`E2E_PASSWORD`; pass them through the environment, not command-line arguments. It uses native login/registration and explicit native role assignments, retains real English screenshots, and never accesses the management system. `PLAYWRIGHT_BROWSERS_PATH` can select a private browser installation. Unit/API tests create independent databases. Rollback tests throw from a Repository `inTransaction` listener after a child was actually inserted, for both new and edited requests, and compare the complete original parent/children/history. No test-only failure route is exposed.

Stop the development service before reset. The reset command refuses production mode and requires explicit confirmation; it clears only procurement requests, their children and their lifecycle history, retaining Users, roles, dictionaries, other demonstrations and existing retry receipts. Use a new form after reset. It is test-data maintenance, not a production undo operation. The preview lists counts before deletion.

## Adapt in Default

Start with the catalogue scenario index (`assets/business-examples/index.json` in the Skill, or `docs/business-examples/index.json` in Examples). Copy the procurement source files into the corresponding application directories; merge the route/provider registrations and locale resources instead of replacing composition roots. Register a `procurement` parent page requiring its page grant, with `new` and `:id` drawer children, and add the two overlay permission-title mappings. Add the catalogue card only if the target has a catalogue. Copy no old baseline source or test fixture into the new application.

The source uses the Examples template's already registered `@nocobase/app-plugin-lifecycle-example/server` runtime and its two log collections. A Default application must explicitly register that compatible server capability (including its migrations), or replace that token with its existing application lifecycle runtime and standard log store. Do not install a second runtime per route or expose demonstration permissions automatically. Register `procurementLifecycle` once on the selected runtime. Preserve the native submission provider/receipt migration. The copied code also uses `#components`/`#hooks`, the template's DataTable, RouteDrawer, FeedbackForm and shadcn Input/Select/Button primitives. Client tests use the template's authenticated test helper; merge those imports with the target's harness. Rename new migration/seed filenames and exported names together before first application so they follow that target's migration head. Never edit an already applied migration.

For another business model, replace collection/field names, reference visibility, applicant/reviewer rules, states, labels and amount units together. Keep transaction handles, strict input allowlists, conditional versions, server scope checks and the after-child rollback test. A reimbursement model may need dates, expense categories and receipt rules; those are intentionally not implemented here. Its frozen held-out assertions remain separate. Passing these example tests supplies no same-condition Default build score. Record a later agent adaptation's prompt/resources/model/time/manual corrections/usage and independent assertions separately, with unknown metrics retained.
