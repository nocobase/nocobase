# Numeric performance benchmarks

These standalone benchmarks measure the current five-database numeric result contract without changing runtime code. They are not timing assertions in the normal test suite and impose no machine-dependent CI latency threshold.

For the 4,000-row timestamp join and transaction catalog overhead, see [query decoding and inspection measurements](../../../packages/libs/db/docs/read-overhead.md) and `read-overhead.ts`. That benchmark provisions its own disposable PostgreSQL service or uses SQLite in memory.

## Run

Use Node 24 with the installed native SQLite addon. From the repository root:

```sh
# Integration tests own their dialect-specific Compose environments. Benchmarks
# require a separately prepared environment and explicit *_HOST/*_PORT values.
# Never target production.

# Smoke run: every scenario on all five databases.
pnpm db:benchmark --databases=all --rows=1000 --writes=2 --repeats=1 --warmups=0 --output=/tmp/numeric-smoke

# Baseline: 10k/100k input rows, 100/1000 writes, 5 samples after 2 warmups.
pnpm db:benchmark --output=benchmarks/results/local-baseline

# One database or selected scales; unsupported/unavailable databases fail the run.
pnpm db:benchmark --databases=sqlite --rows=1000000 --writes=100 --repeats=7 --warmups=2

# Targeted controls retain the same fixture and measurements.
pnpm db:benchmark --rows=100000 --writes=1 --repeats=7 --match='control/|aggregate/count|read/integer/100/warm'

pnpm db:typecheck
pnpm db:test tests/unit/benchmarks/numeric.test.ts

```

The integration-test Compose files use random host ports and are destroyed by the test runner, so they are not suitable as persistent benchmark services. Prepare benchmark services separately and pass `POSTGRES_*`, `MYSQL_*`, `ORACLE_*`, and `MSSQL_*` environment variables explicitly. SQLite uses an isolated in-memory database. See `numeric/config.ts` for defaults. No credentials or SQL binding values are written to reports. The benchmark preserves normal driver behavior, including MySQL warnings for unsupported RETURNING; their logging overhead remains part of the write timings.

Each fixture uses a random `nbp_` prefix. Only its three exact table names are removed in `finally`, including on assertion failure. Schema creation, seeding, deletes between write samples, and cleanup are outside timing. Normal failures write a partial report and exit nonzero; there are no skipped scenarios. Abrupt process termination may leave these prefixed fixture tables behind.

## Scenarios and interpretation

| Scenario                     | Variants                                        | What it measures                                                                           |
| ---------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Integer-only projection      | Knex / Query / Repository; 100/1000 rows        | API overhead without decimal result conversion; source table also contains decimal columns |
| Mixed numeric projection     | Same APIs/pages                                 | INTEGER, BIGINT, DECIMAL, FLOAT, DOUBLE result handling                                    |
| Collection cache             | Warm / invalidated Query and Repository         | Metadata reads, field resolution and cloning; not cold DB pages or a new TCP connection    |
| COUNT                        | Same APIs                                       | SQL and decode overhead for one count result                                               |
| SUM + AVG                    | INTEGER / DECIMAL / FLOAT / DOUBLE              | Native SQL vs current normalized aggregate implementation                                  |
| Group, SUM and sort          | 10 / up to 10,000 groups                        | Numeric aggregate sorting and result normalization                                         |
| SQL controls                 | COUNT result projection / null-order expression | Separate SQL-shape costs from JS API overhead                                              |
| createMany returning records | INTEGER / DECIMAL; 100/1000 rows                | Database round trips and result reload; both use the same public mutation API              |

The Knex reference intentionally uses the **same connected client and current DB driver codecs**. It calls native SQL aggregates and avoids public Query / Repository processing; it is not an unmodified pre-change driver benchmark. Comparisons isolate API/query/aggregate overhead, not the total cost of driver patches. SQL Server native AVG(integer) truncates fractions; that baseline is validated against native semantics and is not a correctness-compatible substitute.

Fixtures use deterministic binary-exact `.25` fractions and a BIGINT above Number.MAX_SAFE_INTEGER. Integer/decimal values, rows, ordering and write results are validated outside timing; public count/decimal/sum/avg types are checked too. Float/double aggregate results are checked for finite values and their actual errors against the mathematical sum/average are recorded explicitly; binary-exact inputs can still round during floating-point accumulation. BIGINT SUM/AVG overflow and arbitrary floating-point precision are correctness-suite concerns, not measured here.

One database, one connection and one scenario run at a time. APIs run in a fixed, documented order (Knex, Query, Repository); repeated warmups reduce initial noise but do not remove thermal, GC, OS or Docker contention. Re-run before making a small percentage-based claim. Five samples give a baseline, not a reliable p99. Metadata uses InMemoryCollectionMetadataStore; cold reads still inspect physical schema, but deployments using database-backed metadata may add other work.

## Output

`results.json` contains each sample, SQL count range, a separate actual SQL trace (with execution frequency and binding count), result types/preview and aggregate numerical errors, server and Node/driver versions, host details, Git HEAD and runtime source hashes. Git HEAD alone does not describe uncommitted runtime changes; use those hashes as well. `report.md` is a compact comparison table. Partial results are saved after each scenario. SQL includes transaction commands and metadata queries; these are **Knex query events**, not a network-packet count or a count of every server-side statement inside a SQL batch. Trace capture runs once before warmups outside the measured samples. Timing samples only increment a query counter.

Reported metrics:

- Wall-clock median and min/max include SQL, public API preparation and decoding.
- CPU is Node process CPU, excluding the remote database's CPU.
- Heap/RSS deltas are noisy signed before/after values, not peak allocations; GC
  is neither forced nor disabled. Negative values can occur.
- Immediate delay is one `setImmediate` probe per sample, useful for detecting
  synchronous SQLite blocking; it is not sustained event-loop p95/p99.
- Cold metadata invalidation and warm metadata priming happen outside timing;
  the cold query itself must load the invalidated definition during timing.

Results are ignored by Git by default. Keep raw local reports for diagnosis; commit curated summaries separately when useful. No changeset is needed for benchmark-only tooling; it does not change emitted library code or types.
