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

The agents-plugin claim, admission, and skill-cost test selection passed its 23 enabled tests on SQLite, with 18 tests skipped by their existing database selection. The warm claim measurements above also executed successfully on PostgreSQL. Prototype-like property names are tested directly at the result mapper boundary; the shared SQL regression exercises portable aliases, nulls, and timestamps because native drivers differ in how they assemble prototype-like column names before the mapper receives a row.

Two supplemental checks fail identically in the unchanged baseline and this checkout: `@nocobase/db api:check` reports an already-outdated public API snapshot, and `@nocobase/db-testkit typecheck:integration` reports seven existing errors in `builder/text-defaults.test.ts`, `repository/fixtures/tenants.ts`, and `repository/policy/scope-pushdown.test.ts`. Their baselines were not updated as part of this performance change.
