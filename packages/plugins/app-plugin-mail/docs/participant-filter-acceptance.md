# Mail participant filter acceptance

## Scope and decision

The participant-filter implementation has completed the agreed feature acceptance, with OceanBase verification explicitly waived by the user. This records the pre-delivery working-tree acceptance, not a release, a production-capacity approval or proof that every supported dialect ran the full Mail suite. The Git history and pull request, rather than this validation snapshot, track subsequent delivery.

The implementation lives in `packages/plugins/app-plugin-mail` on `feat/mail-participant-filter`, based on `b5c6a64cbb8ba7b67674d16ea261f46d77eb4f3e`. Dependencies and the lockfile were not changed. The internal proposal is `13-participant-filter-implementation-plan.md`; the public matching and maintenance contract is in the [plugin README](../README.md#exact-participant-filtering). Detailed scale measurements and their limitations are in [scale verification](participant-filter-verification.md).

## Requirement review

Test paths below are relative to the plugin root. Each row identifies the production surface and observable evidence rather than treating a successful build as behavior verification.

| Requirement                                                  | Implementation and evidence                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Exact From/To/Cc address or domain matching                  | `shared/participant.ts` and `server/store/message-participants.ts`; `tests/server/message-participant-normalization.test.ts` and `message-participant-queries.test.ts` cover normalization, repeated roles, exclusions and exact domain boundaries. Unsupported addresses are skipped without truncation.                                                                                  |
| Preserve keyword search and intersect existing filters       | `server/store/messages.ts` adds only the optional correlated participant `EXISTS`; query tests cover `q`, account, folder, label, conversation, unread, starred and draft visibility. The derived predicate is absent when no participant is supplied.                                                                                                                                     |
| Preserve permissions and validate explicitly invalid input   | Personal and management routes retain their own permission checks before validation. `tests/server/message-participant-api.test.ts` exercises actual application requests, forbidden/anonymous callers and field-level `INVALID_INPUT` responses, including empty, whitespace-only and oversized values.                                                                                   |
| Consistent totals, cursor/offset pages and account scope     | The correlated predicate matches both account and message IDs before counts and paging. Query tests cover duplicate roles, tied timestamps, both paging modes, mismatched redundant account IDs, owned-account isolation and unchanged suspended/removing visibility.                                                                                                                      |
| Preserve complete threads and IMAP copies                    | Query tests verify full conversation details/counts and separate local folder copies with the same RFC Message-ID. The feature does not add logical deduplication.                                                                                                                                                                                                                         |
| Accepted writes and address replacement remain atomic        | `message-writes.ts` replaces only accepted rows in the existing transaction. `message-participant-writes.test.ts` covers replacement, emptied roles, duplicate provider input, refused/stale writes, rollback and bounded parameter counts.                                                                                                                                                |
| Scheduled snapshots, submission closure and sync-step guards | `message-participant-lifecycle.test.ts` exercises real-database scheduled snapshot creation/replacement, refused edits, submission-triggered closure by ID/key, accepted completion, cross-account isolation, tombstones, live restoration and lost-lease/cancellation rollback.                                                                                                           |
| Deletion, cleanup and retries leave no orphan index          | Explicit participant cleanup is integrated into sync deletion, manual deletion, draft closure and account-removal batches; folder-only removal does not delete participants. Write/lifecycle/account-removal tests verify bounded cleanup, refused deletes, rollback and retries; the message FK provides cascading protection.                                                            |
| Historical backfill is self-contained and repeatable         | `202610090001_mail_create_message_participants.ts` embeds its own normalization, uses 100-message keyset pages and at most 100 participant rows / 500 bindings per insert, preserves source rows, and cleans up after failed backfill. Migration tests cover historical data, malformed values, aggregate-only diagnostics, failure/retry and apply/down/reapply on the principal engines. |
| Portable schema and equality                                 | `message-participants-structure.test.ts` verifies field bounds/nullability, the composite PK, both account/value/message indexes and the single cascading message FK. Selected supported-engine migration/query checks exercise full-width fields and distinct ASCII punctuation. Their scope is listed below.                                                                             |
| Public client and OpenAPI contract                           | `MailListMessagesInput`, personal/management client query types and both route mappings include optional `participant`. Client tests verify unchanged serialization. Actual Examples OpenAPI inspection found both optional string parameters with `maxLength: 320`, retained `q`, no derived-table API and no document-schema/undeclared-route problems.                                  |
| Independent workspace field and stale-response protection    | Actual `MailWorkspacePage`, host providers and theme were exercised with a synthetic HTTP transport. Client tests cover immediate pagination/selection invalidation, the existing debounce, invalid-input suppression, omit-on-clear and stale list/page/detail responses. Both English and Chinese labels/errors are rendered in client tests.                                            |
| Accessibility and theme integration                          | Browser checks exercise labels, hints, error associations, keyboard/focus, field-scoped axe and AA field-text contrast at desktop/mobile widths in light/dark modes. Existing workspace-wide mobile issues are separate limitations, not silently classified as passing.                                                                                                                   |
| Maintenance and measurable cost                              | The README, plugin Skill and changeset require a backup and stopped application/Mail workers before migration. Opt-in SQLite/MySQL/PostgreSQL workloads measure backfill, real row/count plans, storage, log/lock observations and accepted writes. These are synthetic measurements, not an online-upgrade guarantee.                                                                     |

## Test results and scope

The latest SQLite full suite was rerun after the final UUID-order fixture correction. PostgreSQL's full suite includes the final attachment guard and portable-structure test; the later correction changed test identifiers only, not production code. The earlier MySQL full suite predates those final two additions; the final selected runs cover the additions and the participant implementation, without presenting the interrupted larger run as successful.

| Check                                | Result                                                                                          | Scope                                                                                                                                                                                  |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SQLite full Mail suite               | 75 files passed, 1 skipped; 912 tests passed, 2 skipped                                         | Final working tree. The skipped file contains the two opt-in performance workloads.                                                                                                    |
| MySQL earlier full Mail suite        | 74 files passed, 1 skipped; 910 tests passed, 2 skipped                                         | Before the final attachment regression and standalone structure test; not a latest-tree full-suite claim.                                                                              |
| MySQL final core suite               | 6 files / 67 tests passed                                                                       | Structure, attachment storage, participant queries, writes, HTTP API and lifecycle transactions.                                                                                       |
| MySQL final pagination fixtures      | 3 passed; 125 deliberately not selected                                                         | Delivery-history, synchronization-log and whole-batch pagination in `mail-runtime.test.ts`, after the deterministic UUID correction.                                                   |
| PostgreSQL full Mail suite           | 75 files passed, 1 skipped; 912 tests passed, 2 skipped                                         | Includes final production changes; the subsequent fixture-only ordering correction was not rerun on this engine.                                                                       |
| SQL Server selected suite            | 6 files / 67 tests passed                                                                       | Migration, participant queries/writes, cleanup and lifecycle; not the full suite or the final three legacy-runtime pagination fixtures.                                                |
| Oracle selected suite                | 3 files / 19 tests passed, 2 not selected                                                       | Portable structure, fresh installation/boundary/punctuation/diagnostics and queries. Oversized historical-source and injected-backfill-failure fixtures were not verified in this run. |
| Kingbase selected suite              | 3 files / 19 tests passed, 2 not selected                                                       | The same selected structural/query scope; not full historical-backfill/failure acceptance.                                                                                             |
| Dameng selected suite                | 3 files / 19 tests passed, 2 not selected                                                       | The same selected structural/query scope; not full historical-backfill/failure acceptance.                                                                                             |
| OceanBase                            | Not run to completion                                                                           | Explicitly waived by the user; no compatibility claim is inferred from MySQL.                                                                                                          |
| Scale workloads                      | 2 passed per engine on SQLite, MySQL and PostgreSQL                                             | 5,000 / 30,000 messages and 22,483 / 122,383 participant rows, including the mass-recipient and sparse/multi-account cases. See the separate scale report.                             |
| Actual browser acceptance            | 26 / 26 assertions passed                                                                       | Real components/providers/theme, synthetic transport; not a real-provider or database-matching test.                                                                                   |
| Focused browser-related client tests | 22 / 22 passed                                                                                  | Their cases are also included in the full SQLite suite.                                                                                                                                |
| Mail Example consumer                | Lint, typecheck, test and build passed; 2 files / 5 tests                                       | `@nocobase/app-plugin-mail-example`.                                                                                                                                                   |
| Examples application consumer        | Lint, typecheck, test and build passed; 66 files / 357 tests                                    | `@nocobase/app-template-examples`; its build verified server imports.                                                                                                                  |
| Final Mail package gates             | Lint, typecheck, build and formatting passed                                                    | Standard package configuration, including generated declarations and migration manifests.                                                                                              |
| Repository contract checks           | Portability, peer/runtime dependency checks, changeset validation and `git diff --check` passed | Scoped changes plus root contract checkers; no dependency changes.                                                                                                                     |
| Final Examples OpenAPI check         | Passed: 389 routes, 418 documented operations                                                   | Actual started application document, no new undocumented API or schema issue.                                                                                                          |

A broader MySQL affected-file rerun reached the 900-second tool deadline without a terminal test result. It is recorded as interrupted, not passed and not a demonstrated assertion failure. The final core and pagination checks then completed successfully against that task-owned disposable MySQL service. The service and its Compose network were removed afterward; pre-existing PostgreSQL and pgAdmin containers were left untouched.

Final SQLite coverage was 85.26% statements, 76.35% branches, 87.69% functions and 87.80% lines. Standard package typechecking passes. A separate test-inclusive TypeScript experiment previously found six baseline diagnostics in legacy test helpers/API fixtures; they were compared against the base revision, not suppressed or claimed fixed by this feature.

## Review corrections and approved deviations

Independent code review found no additional confirmed production correctness/security issue after examining the optional predicate, permissions, transactions, lifecycle, backfill, client generations, compiled declarations and migration manifests. It did find three legacy-runtime fixtures sorting random UUID strings and assuming SQL Server uses the same order. Those fixtures now vary only the final bytes of canonical UUIDs under a fixed prefix; expected counts, ownership, tie ordering, lookahead batches and pagination assertions are unchanged. The three cases passed on SQLite and MySQL, and the final SQLite full suite passed. This is not a claim that these three cases were rerun on SQL Server.

The user explicitly approved minimal corrections to the released `202609030001_create_mail_tables` migration under the root policy's never-installable-on-supported-engines exception. Fresh MySQL installation needed smaller fully indexed outbound storage-key/subscription-ID bounds; SQL Server needed removal of duplicate direct account cascade paths while keeping foreign-key checks. Existing successfully migrated columns are not resized or truncated. The README and changeset disclose the checksum warning and reviewed `nocobase db repair` acknowledgement. The new participant migration remains self-contained; this approval does not allow arbitrary historical migration edits.

PostgreSQL verification also exposed an existing localized-draft problem: provider attachment parts such as `part-0` were queried against local-upload UUID columns. `getOutboundAttachment()` now ignores non-UUID IDs before that metadata query. A dedicated regression and the full PostgreSQL suite passed; provider identifiers themselves are not rewritten.

## Evidence locations and reproduction

Local `/tmp` paths are session artifacts, not files guaranteed to exist in another checkout. Keep the complete logs when reviewing this delivery, or rerun the commands from the worktree root. The test source and this report are repository files.

- Final SQLite: `/tmp/mail-participant-full-sqlite-final.log`.
- Earlier MySQL full suite and PostgreSQL full suite: `/tmp/mail-participant-full-{mysql,postgres}-final.log`.
- Final MySQL core and UUID-pagination checks: `/tmp/mail-participant-final-mysql-core.log` and `/tmp/mail-participant-final-fixture-mysql.log`.
- Interrupted MySQL run: `/tmp/mail-participant-final-mysql-affected.log`.
- Other engines: `/tmp/mail-participant-{mssql,oracle,kingbase,dameng}-final.log`.
- Performance: `/tmp/mail-participant-benchmark-{sqlite,mysql,postgres}-final.log` and [scale verification](participant-filter-verification.md).
- Browser: `/tmp/mail-participant-ui/REPORT.md`, `assertions.json`, `requests.jsonl`, `artifact-manifest.json` and the desktop/mobile light/dark screenshots. Requests 50–76 are the final successful functional run.
- Consumer checks: `/tmp/mail-participant-consumer-20261010-094015-*`, including the actual Examples document assertions.
- Final package/repository checks: `/tmp/mail-participant-final-{lint,typecheck,build,format,portability,peers,deps,changesets,openapi}.log`.

```bash
pnpm --filter @nocobase/app-plugin-mail lint
pnpm --filter @nocobase/app-plugin-mail typecheck
pnpm --filter @nocobase/app-plugin-mail test
pnpm --filter @nocobase/app-plugin-mail build
pnpm --filter @nocobase/app-plugin-mail format:check

# Disposable services: run one dialect at a time.
pnpm test:db mysql --filter @nocobase/app-plugin-mail -- \
  tests/database/message-participants-structure.test.ts \
  tests/server/attachment-storage.test.ts \
  tests/server/message-participant-queries.test.ts \
  tests/server/message-participant-writes.test.ts \
  tests/server/message-participant-api.test.ts \
  tests/server/message-participant-lifecycle.test.ts \
  --maxWorkers=1 --coverage.enabled=false

pnpm db-tests:check
pnpm peers:check
pnpm deps:check
node scripts/check-openapi.mjs examples
node scripts/validate-changesets.mjs
git diff --check
```

## Remaining operational and delivery boundaries

Production upgrades still require measurements against representative sanitized data, a verified backup/restore plan, sufficient storage and a stopped-writer maintenance window. Bounded batches do not imply short transactions or online compatibility. The scale report explicitly records the suboptimal PostgreSQL 5,000-message/four-account address plan and limits of native log counters, sampled journal/lock/RSS observations, crash recovery, replication and sustained contention. No production migration or real mailbox mutation was performed during acceptance.

The browser fixture found pre-existing fixed three-column mobile clipping and a non-keyboard-accessible empty reader scroll region. The participant field itself passed its scoped checks; this feature does not include a broader responsive-workspace redesign.

Not every scheduled-send recovery/restart branch has a dedicated participant-specific assertion. The nine added lifecycle cases cover the listed accepted/closed/refused/lease/cancellation paths, not every possible scheduler failure. Oracle/Kingbase/Dameng selected checks are structural/query evidence, not complete large-history recovery certification.

The matching `minor` changeset is `.changeset/mail-participant-filter.md` and covers the only changed publishable package, including its shipped Skill. The commit-range `require-changesets.mjs` check must run against the delivery commit before pushing; a check against the pre-delivery unchanged `HEAD` would not validate the working-tree edits recorded here. Commit, push and PR creation are subsequent delivery actions, separate from this acceptance snapshot.
