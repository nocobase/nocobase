# Query decoding and transaction inspection overhead

This change addresses [PM-397](https://studio.v2.test.nocobase.com/main/issues/392187556659200) without sharing resolved physical schemas across transactions. Query result mapping prepares column names and decoder references once per execution instead of creating several entry arrays and remapping names for every row. Common stored UTC and offset-free timestamps are validated and formatted in one pass; nonzero offsets, legacy epoch values, invalid values, nulls, and the public temporal contract retain their existing paths.

PostgreSQL now reads the physical table, columns, constraints, indexes, and expression index keys in one catalog statement. Its catalog arrays are grouped independently as JSON to avoid a Cartesian product. An explicitly named schema still requires its existing permission/existence check. SQLite joins the index-list, index-key, and schema SQL sources in one read, removing two queries per index. Both inspectors still use the transaction's client and snapshot, and both continue to inspect hand-written DDL. No cross-transaction Collection cache or public configuration option was added.

## Measurements

These are local measurements on Node 24.21.0, Linux x64, Intel Core Ultra 9 285, with PostgreSQL 16 in an isolated Docker service and SQLite in memory. The baseline is commit `494fb7e49`; the same fixture and benchmark script ran against a separate unchanged checkout and the modified checkout. Timings are medians of 30 repetitions after 10 warmups. They are not measurements of the production Studio deployment.

The join returns 4,000 rows with ten columns, including five timestamps. The native comparison executes the same SQL and bindings using the same Knex client and driver codecs. The difference includes Query preparation, mapping and decoding; it is an estimate of API overhead, not a separately instrumented decoder duration. SQL tracing and result verification are outside timed samples.

| Measurement                                 | PostgreSQL before | PostgreSQL after | SQLite before | SQLite after |
| ------------------------------------------- | ----------------: | ---------------: | ------------: | -----------: |
| Identical join through Knex, ms             |             10.03 |            10.33 |          2.31 |         2.87 |
| Join through Query, ms                      |             36.83 |            14.75 |         27.53 |         7.73 |
| Query minus Knex, ms                        |             26.80 |             4.42 |         25.22 |         4.86 |
| Query Node CPU, ms                          |             33.31 |             8.71 |         28.26 |         7.88 |
| 12-table transaction, metadata statements   |                61 |               25 |           145 |           73 |
| 12-table transaction, ms                    |             40.12 |            41.23 |          6.21 |         5.13 |
| 12-table transaction Node CPU, ms           |              9.29 |             7.99 |          6.99 |         6.19 |
| Warm empty transaction, all statements      |                 2 |                2 |             2 |            2 |
| Warm empty transaction, metadata statements |                 0 |                0 |             0 |            0 |

The transaction fixture accesses twelve Collections with three ordinary indexes each, with the root naming snapshot already warm. It retains twelve business reads and `BEGIN`/`COMMIT`. PostgreSQL metadata cost changes from one version check plus five statements per Collection to one version check plus two per Collection. SQLite changes from twelve to six per Collection. An empty transaction never resolves a Collection and only emits `BEGIN` and `COMMIT`; the first Collection lookup is what triggers a version read.

For the actual agents-plugin claim path, the existing `tests/harness.ts` creates a team runner with ten slots and an agent with `maxConcurrentRuns: 10`. One run is enqueued and claimed to warm the root; a second run is then enqueued and claimed through `services.claims.claim(runner, 1, undefined)`. The runner is authenticated before recording queries with `{ touch: false }`, so authentication writes are excluded. Counts come from Knex's `query` event around that second claim. This exercises the plugin's real services and migrations with the harness's sample subject, not Studio's project/issue integrations.

| Warm claim                                      | PostgreSQL before | PostgreSQL after | SQLite before | SQLite after |
| ----------------------------------------------- | ----------------: | ---------------: | ------------: | -----------: |
| All statements                                  |               112 |               70 |           218 |          126 |
| Metadata/catalog statements                     |                71 |               29 |           177 |           85 |
| Other statements, including transaction control |                41 |               41 |            41 |           41 |

Fewer catalog requests do not imply an equivalent reduction in database work: PostgreSQL still inspects every aspect and now also aggregates catalog rows as JSON. Its local twelve-table transaction wall time did not improve in this measurement. Query decoding is the clear CPU and latency improvement; batching reduces round trips and Node-side query handling. Database CPU, production request latency, lock duration, and sustained event-loop delay were not measured. Further schema-cache reuse needs an explicit invalidation and DDL-detection contract and is not implied by the metadata version alone.

## Reproduce

From the repository root, after installing dependencies and building `@nocobase/dev-config`, run each database separately:

```bash
node --import tsx dev/db/benchmarks/read-overhead.ts sqlite > /tmp/read-overhead-sqlite.json
node --import tsx dev/db/benchmarks/read-overhead.ts postgres > /tmp/read-overhead-postgres.json
```

The [benchmark](../../../../dev/db/benchmarks/read-overhead.ts) creates an in-memory SQLite database or starts and removes a dedicated PostgreSQL Compose service through the integration runner. It prints JSON with individual samples, SQL traces, Node CPU time, and statement counts. Run it in an unchanged checkout with the same script for a comparison, and avoid other test suites or benchmarks while measuring. The timings are diagnostic; no timing threshold is imposed on CI.

Regression coverage includes temporal validation at leap-year and year-range boundaries, offset and precision handling, prototype-like result aliases, SQLite composite/automatic/expression/partial indexes, PostgreSQL expression keys and included columns, bounded catalog query counts, raw DDL inside a transaction, and rollback. The existing transaction metadata cache tests continue to cover naming-snapshot isolation, invalidation, nested transactions, metadata writes and single-connection pools.

## Validation notes

Package-scoped lint, typecheck, unit tests, and build passed for `@nocobase/db`, all five OSS dialect packages, and `@nocobase/db-testkit`. The core unit suite passed 626 tests. The benchmark passed ESLint and `pnpm db:typecheck`; changed documentation passed formatting and local-link checks, and the changeset passed validation. An additional differential check compared 60,984 timestamp results and errors against the unchanged baseline, including leap years, invalid calendars, UTC and nonzero offsets, and fractional precision, with no differences.

Full integration suites ran sequentially through their owning dialect packages. Skips are the suites' existing capability-dependent selections.

| Database   | Passed | Skipped |
| ---------- | -----: | ------: |
| SQLite     |    967 |       3 |
| PostgreSQL |    975 |       4 |
| MySQL      |    977 |       3 |
| MariaDB    |    977 |       3 |
| SQL Server |    972 |       4 |
| Oracle     |    967 |       6 |

After making the shared alias regression portable, the Query select contract was rerun successfully on SQLite, PostgreSQL, MySQL, and MariaDB. The successful full SQL Server and Oracle runs already include that final version.

The agents-plugin claim, admission, and skill-cost test selection passed its 23 enabled tests on SQLite, with 18 optional cost-report cases disabled because `PM387_COST_REPORT` was unset. The warm claim measurements above also executed successfully on PostgreSQL. Prototype-like property names are tested directly at the result mapper boundary; the shared SQL regression exercises portable aliases, nulls, and timestamps because native drivers differ in how they assemble prototype-like column names before the mapper receives a row.

Two supplemental checks fail identically in the unchanged baseline and this checkout: `@nocobase/db api:check` reports an already-outdated public API snapshot, and `@nocobase/db-testkit typecheck:integration` reports seven existing errors in `builder/text-defaults.test.ts`, `repository/fixtures/tenants.ts`, and `repository/policy/scope-pushdown.test.ts`. Their baselines were not updated as part of this performance change.

## Local acceptance rerun, 2026-10-15

The local acceptance pass compares baseline `494fb7e49` with PR commit `06b801193` on the same host and runtime described above. The benchmark and locked dependencies are identical in the two checkouts. It runs three independent rounds per checkout and database, each with ten warmups and thirty samples. Round two reverses the baseline/candidate order; rounds one and three run the baseline first. Other database tests finished before sampling, and monitoring found no overlapping Docker services during any performance run. No runtime code was changed for this acceptance pass.

The agreed local gates are at least a 50% reduction in both Query wall time and Node CPU time on each database, and no more than a 10% regression in the twelve-table transaction wall time. The comparison takes the median of each round's medians. These are controlled local acceptance gates, not CI timing assertions or production service objectives.

| Database   | Round | Query before / after, ms | Query CPU before / after, ms | Transaction before / after, ms |
| ---------- | ----: | -----------------------: | ---------------------------: | -----------------------------: |
| PostgreSQL |     1 |            36.63 / 15.11 |                 33.08 / 8.74 |                  47.14 / 39.95 |
| PostgreSQL |     2 |            34.95 / 15.87 |                 32.23 / 8.74 |                  40.11 / 39.75 |
| PostgreSQL |     3 |            35.83 / 14.86 |                 33.14 / 8.62 |                  39.85 / 42.29 |
| SQLite     |     1 |             26.76 / 7.69 |                 26.93 / 7.82 |                    6.18 / 5.17 |
| SQLite     |     2 |             27.01 / 7.85 |                 27.44 / 8.02 |                    6.25 / 5.14 |
| SQLite     |     3 |             29.55 / 7.82 |                 30.09 / 7.98 |                    6.41 / 5.17 |

| Acceptance metric                                        |                     PostgreSQL |                        SQLite | Result |
| -------------------------------------------------------- | -----------------------------: | ----------------------------: | ------ |
| Query median of medians                                  | 35.83 → 15.11 ms, 57.84% lower | 27.01 → 7.82 ms, 71.06% lower | Pass   |
| Query Node CPU median of medians                         |  33.08 → 8.74 ms, 73.58% lower | 27.44 → 7.98 ms, 70.94% lower | Pass   |
| Twelve-table transaction median of medians               |  40.11 → 39.95 ms, 0.40% lower |  6.25 → 5.17 ms, 17.37% lower | Pass   |
| Twelve-table transaction metadata statements, each round |                        61 → 25 |                      145 → 73 | Pass   |
| Warm claim metadata statements, each round               |                        71 → 29 |                      177 → 85 | Pass   |
| Warm empty transaction, each round                       |       2 statements, 0 metadata |      2 statements, 0 metadata | Pass   |

The PostgreSQL transaction results support the absence of a material regression, not a meaningful speedup. Native Knex medians were 9.60 → 9.11 ms on PostgreSQL and 2.36 → 2.94 ms on SQLite. The raw samples retain this variation; the SQLite native control is about 0.59 ms slower in this run. The Query improvement remains above the acceptance threshold on both databases.

All three rounds preserve the fourteen non-metadata statements of the twelve-table transaction: BEGIN, twelve business reads, and COMMIT. Warm claims were independently traced three times per checkout and dialect through the real agents services. Their 41 other statements retain identical SQL text and order after normalizing generated fixture schema names. Counts stay at 112 → 70 total statements on PostgreSQL and 218 → 126 on SQLite. Assertions also check the claimed run identity, dispatched status, runner assignment, input, and credential payload. SQL traces omit binding values; this comparison verifies the executed statement sequence rather than bound-value equality.

The following targeted PostgreSQL regression passed all 34 tests in four files, with no failures or skips:

```bash
pnpm test:db postgres --filter @nocobase/app-plugin-agents -- tests/claim.test.ts tests/claim-admission.test.ts tests/claim-concurrency.test.ts tests/claim-secrets-safety.test.ts --maxWorkers=1 --no-file-parallelism
```

Coverage includes duplicate prevention when four runners claim twelve runs concurrently, agent and runner capacity limits, assembly failure handling, admission rejection, and rollback of refused claims without retained run tokens or delivered inputs. The comment-chain burst completed 24 polls and six distinct claims in 1,057 ms, with 17 writing transactions and no sampled lock waits on run rows. Other lock-wait samples were present; the test does not require all database locking to disappear.

Raw samples, SQL traces, JSON test results, environment details, fixture scripts, and a verification script are retained in the local `pm397-acceptance-2026-10-15.tar.gz` evidence archive. Its verifier checks the performance gates, counts, normalized business SQL sequences, and zero failed or skipped PostgreSQL tests. The archive is generated output and is not part of the package release.

Local performance, SQL-count, and PostgreSQL claim acceptance are complete. Studio deployment, page and project/issue integration checks, application request latency, and database CPU measurements remain pending. The previously completed cross-dialect suites were not rerun for this documentation-only acceptance update.
