# Light Extension end-to-end performance benchmark

This benchmark harness is intentionally split into deterministic preparation and final measured collection. The preparation test does not claim that the rollout acceptance gates have passed.

## Fixed protocol

- Matrix version: `1`.
- Small fixture: 1 Entry and 10 files.
- Medium fixture: 20 Entries and 200 files.
- Each of the 8 scenarios runs once cold and at least 20 times hot.
- Baseline and target runs must use the same Node version, dependency fingerprint, machine, database version, and database configuration fingerprint.
- Record `sourceCommit` for the code under measurement and `harnessCommit` for the collector version. Baseline and target evidence must use the same harness commit.
- Collect SQLite and at least one paired PostgreSQL, MySQL, or MariaDB dataset.
- Record the selected Tasks 09–14 in `releaseScope`. Exact single-consumer and unused-shared structural gates are enabled only when Task 12's runtime/type dependency graph is in scope; otherwise those scenarios remain measured against the conservative shared fallback.
- Do not mix cold and hot samples. Do not retain only the best run.
- Raw evidence may contain metrics summaries and environment fingerprints, but must not contain source text, repository IDs, Entry IDs, credentials, or database connection strings.

The matrix and fixture roles are defined in `helpers/compilePerformanceBenchmarkMatrix.ts`. The medium benchmark fixture deterministically rewires the Task 01 fixture so `src/shared/shared-01.ts` has one consumer and `src/shared/shared-20.ts` has no consumers while preserving 20 Entries and 200 files.

## Preparation verification

```bash
yarn test packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/compile-performance-benchmark-prep.test.ts --run --reporter=verbose
```

This is a pure contract test. It verifies fixture topology, all matrix scenarios, deterministic mutations, pending report behavior, acceptance calculations, and Markdown/JSON serialization. It does not execute the final database benchmark.

The collector configuration and evidence gate also have a pure test:

```bash
yarn test packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/compile-performance-benchmark-evidence.test.ts --run --reporter=verbose
```

## Real collector

The collector test executes real `saveSource` calls, including compile rejection rollback and two same-Head requests. It is disabled unless `LIGHT_EXTENSION_BENCHMARK_COLLECT=true`. `sourceCommit` identifies the code being measured; `harnessCommit` identifies this collector and must be the same in baseline and target checkouts.

SQLite acceptance collection:

```bash
LIGHT_EXTENSION_BENCHMARK_COLLECT=true \
LIGHT_EXTENSION_BENCHMARK_SOURCE_COMMIT=<measured-source-commit> \
LIGHT_EXTENSION_BENCHMARK_HARNESS_COMMIT=<shared-harness-commit> \
LIGHT_EXTENSION_BENCHMARK_OUTPUT=/absolute/path/to/sqlite-evidence.json \
LIGHT_EXTENSION_BENCHMARK_UI_SAVE_VERIFIED=true \
LIGHT_EXTENSION_BENCHMARK_REFERENCES_VERIFIED=true \
DB_DIALECT=sqlite \
DB_STORAGE=/absolute/path/to/compile-performance.sqlite \
yarn test packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/compile-performance-benchmark-collector.test.ts --run --reporter=verbose
```

PostgreSQL uses the same command with `DB_DIALECT=postgres` and the normal `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, and `DB_PASSWORD` environment. Run SQLite and PostgreSQL serially, with different output paths. Do not put connection strings or passwords in evidence metadata.

PostgreSQL issues the two same-Head requests concurrently. SQLite executes the two already-stale client intents serially because it is a single-writer database; the evidence still requires exactly one successful commit and one outdated response, while the repository's dedicated concurrency regression test covers overlapping execution.

The default is 1 cold run and 20 hot runs. A shorter smoke collection can override `LIGHT_EXTENSION_BENCHMARK_COLD_RUNS` and `LIGHT_EXTENSION_BENCHMARK_HOT_RUNS` and set `LIGHT_EXTENSION_BENCHMARK_REQUIRE_ACCEPTANCE=false`; its `gate.passed` may be true, but `gate.acceptanceReady` remains false until the fixed minimum is met.

Both Vitest and `jq` provide non-zero gate exits:

```bash
jq -e '.gate.passed == true and .gate.acceptanceReady == true' /absolute/path/to/sqlite-evidence.json
jq -e '.gate.passed == true and .gate.acceptanceReady == true' /absolute/path/to/postgres-evidence.json
```

Set `LIGHT_EXTENSION_BENCHMARK_UI_SAVE_VERIFIED=true` and `LIGHT_EXTENSION_BENCHMARK_REFERENCES_VERIFIED=true` only after the listed client Save and Reference regression tests pass on the same source commit. Otherwise the collector intentionally writes failing functional evidence.

## Final collection protocol

After Tasks 02–08 and the selected P2 tasks are present on the target branch, use one clean checkout for the baseline commit and one for the target commit. Apply the same benchmark harness commit to both checkouts, install the same lockfile, and execute database-backed collectors serially. A collector must emit one `CompilePerformanceBenchmarkDataset` JSON object per commit and dialect using the matrix helper.

Run the functional regression files serially for each dialect before accepting its dataset:

```bash
yarn test packages/plugins/@nocobase/plugin-vsc-file/src/server/__tests__/performance-smoke.test.ts --run --reporter=verbose
yarn test packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/save-source-runtime.test.ts --run --reporter=verbose
yarn test packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/compile-preview.test.ts --run --reporter=verbose
yarn test packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/references-service.test.ts --run --reporter=verbose
yarn test packages/plugins/@nocobase/plugin-light-extension/src/client-v2/__tests__/RepoWorkspacePage.test.tsx --run --reporter=verbose
```

Copy `compile-performance-acceptance-input.example.json`, replace its placeholders with collected datasets and canary evidence matching `CompilePerformanceAcceptanceReportInput`, then generate the attachable report:

```bash
yarn tsx packages/plugins/@nocobase/plugin-light-extension/src/server/__tests__/helpers/generateCompilePerformanceAcceptanceReport.ts \
  --input /absolute/path/to/compile-performance-acceptance-input.json \
  --output-prefix /absolute/path/to/compile-performance-acceptance
```

The command writes `.json` and `.md` files. The report remains `PENDING` when matrix, paired database, environment parity, functional, or canary evidence is missing. It becomes `FAIL` when complete measured evidence violates a gate, including less than 50% median improvement for the medium private-file hot save or more than 10% p95 regression for the small private-file hot save.
