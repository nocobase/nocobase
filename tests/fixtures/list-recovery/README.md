# List recovery acceptance fixture

This fixture supplies the application-owned equipment lending business and its browser assertions for Default and Examples. It does not supply a template upgrade engine, publish candidates, advance a template version, or turn a source patch into a version upgrade. Candidate packaging, target discovery and the upgrade completion checks use the shared version-upgrade tooling and the application's upgrade Skill.

## Four independent applications

| Sample ID           | Source                           | Required lifecycle                                                                                                                                                                  |
| ------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `default-new`       | Verified Default TARGET tarball  | Generate with `pnpm create @nocobase/app`, install the business fixture, connect through the target's shared hooks.                                                                 |
| `default-upgraded`  | Published Default BASE           | Install business fixture, commit customizations and lock, retain data, follow the original upgrade Skill through TARGET selection, source/dependency reconciliation and acceptance. |
| `examples-new`      | Verified Examples TARGET tarball | Generate with `pnpm create @nocobase/app`, retaining Examples composition, then connect the business fixture.                                                                       |
| `examples-upgraded` | Published Examples BASE          | Retain Examples routes/plugins, business fixture, dependency lock and database; complete the same version-upgrade lifecycle.                                                        |

The old application's installed Skill must remain the starting point. Read the selected TARGET's upgrade requirements when the BASE-to-TARGET comparison discovers them. Do not install new Skills or shared recovery source before target selection. Invoke `connect.mjs` for the known business page **during that same source reconciliation**, not as a separate patch after a supposedly completed upgrade. It writes no template files, dependencies or completion marker and refuses missing hooks or an unrecognized business conflict. Resolve template and dependency conflicts using the shared upgrade path, run acceptance, and only then confirm TARGET. Missing targets, unresolved conflicts and failed acceptance remain incomplete.

`install.mjs /absolute/app` installs only the synthetic business page, secured API, migration and route registration. It refuses to overwrite existing business sources and supports both templates without replacing their original routes. This is for disposable test applications only. Copying this fixture into an arbitrary business application is not a supported upgrade operation.

## Business behavior retained

The sample has cost center and approval fields, a protected approved record, cost-center validation, server permission checks, soft deletion and a deletion-event counter. Its migration and business DELETE API remain unchanged across the upgrade. The reset endpoint accepts only a bounded count and requires native authentication and the permission-set administration action. It creates synthetic records only. Record source hashes and an authenticated business snapshot before upgrading; compare them after upgrading before running tests that reset data.

Use `NOCOBASE_SOURCE` for the repository used by Playwright and `VERIFICATION_WORK` for a separate evidence directory **per sample**, with an `evidence/` subdirectory. Set `APP_ENTRY` to the application's verified full-stack entry including base path, and `SAMPLE_ID` to the corresponding table entry. Supply `E2E_USERNAME` and `E2E_PASSWORD` only through the native isolated application's process environment. Scripts never save browser sessions or authentication headers. Do not use management-instance credentials.

```bash
node tests/fixtures/list-recovery/install.mjs /absolute/generated-app
# For a new TARGET app, or during the old app's confirmed source reconciliation:
node tests/fixtures/list-recovery/connect.mjs /absolute/generated-app
```

Read the generated application's AGENTS.md and installed Skills, install dependencies and configure its isolated database. When running multiple applications on the same machine, start them sequentially with `NOCOBASE_STRICT_STARTUP=true` and different `APP_SERVER_PORT` values, verify the printed Local entry and distinct database files. A loopback address is suitable for the browser runner only and is not a user-accessible delivery URL.

## Browser matrix

`browser.mjs before` reproduces the uncorrected last page and saves `evidence/old-retained-before.json` in the old sample's evidence directory. Keep that database through the actual version upgrade. Run these commands from the repository after configuring the environment for each application:

```bash
# Published BASE old app, before source reconciliation:
node tests/fixtures/list-recovery/browser.mjs before
# Newly created TARGET app:
node tests/fixtures/list-recovery/breadcrumbs.mjs new
node tests/fixtures/list-recovery/browser.mjs new
# Old app after the version-upgrade reconciliation, before confirming completion:
node tests/fixtures/list-recovery/breadcrumbs.mjs old
RECHECK_ONLY=1 node tests/fixtures/list-recovery/browser.mjs old
```

The first old breadcrumb run strictly compares the retained pre-upgrade snapshot before resetting any data. `RECHECK_ONLY=1` is only for an additional pass after a previous successful snapshot comparison because browser scenarios intentionally modify the synthetic records. Do not use it to bypass a failed preservation check. Keep each sample's results, locks, target provenance and source reconciliation separately.

The breadcrumb suite configures actual search/status/sort/page-size/tab controls, navigates to page two and enters a real detail child route. Each sample covers a still-valid page, an overflowing page and deletion of all matching records through the original business API; each case is repeated using the actual header breadcrumb, the page Back link and browser Back. It asserts the destination, URL, controls, page/total and actual table IDs against database snapshots. Primary breadcrumb clicks record `isTrusted`, source and href. Surviving details are reopened to check the corrected breadcrumb destination. The all-empty case uses a second authenticated writer for other matching rows, leaving the detail's normal single-record delete unchanged.

The original twelve scenarios cover single and batch deletion, failed and partially successful mutations, first/last page, refill and empty results, full-data client pagination, detail return, stale responses, bounded recovery and retained business policy. Screenshots and sanitized request logs are written per sample. Never replace these function-specific results with another issue's list-feedback tests.

## Version and release evidence

For each sample, preserve BASE/TARGET names and versions, registry URL, tarball integrity, target manifest dependencies, installed lock, original and reconciled commits, discovered target guidance, resolved conflicts, source diff, final template baseline and the pre/post business snapshots. Candidate versions must increase explicitly and live only in the isolated registry. A same-version checkout overlay cannot satisfy this matrix. Public TARGET versions are recorded only after actual release; repeat target fetch, integrity verification, upgrade and this same matrix using those real packages before calling public version upgrades verified.

## Preview handoff

The current repository preview workflow is maintained in the external CI repository. It builds `packages/templates/app-template-examples` and deploys one archive to the PR application. It does not deploy these four generated applications or install this fixture. A ready generic Examples preview therefore does not prove that Equipment loans is available.

Provide distinct live application entries for the four accepted samples, or an existing preview entry that explicitly identifies and reaches them. Verify each published entry and its Equipment loans menu, detail child page and header breadcrumb. Retain native login; do not publish passwords. Explain reset behavior before allowing a reset: it clears only this isolated sample's synthetic loans. Keep enough records to reach the second page, and provide valid/overflow/empty reset choices. The management CLI's offered release-deployment operations cannot upload new archives; use the existing authorized CI publishing mechanism. Report missing capabilities and the exact refusal instead of reusing a management credential or bypassing the CLI.
