# Ordering required table fields

Repository reads omit NULL discriminator CASE expressions only for direct table scalar fields whose metadata declares `nullable: false`, or an `increments` field without an explicit nullable declaration. Ordinary reads, distinct representative ranking and its outer order, and relation-local ranking use the same rule. A relation-local read starts from the target table and preserves those columns through inner joins and projection; sorting a root record by a related value still uses a potentially empty scalar subquery and keeps its CASE.

Nullable or unspecified fields, views and materialized views, relation subqueries and grouped or aggregate result columns keep the existing CASE ordering. A primary-key flag alone is insufficient because SQLite can store NULL in text primary keys. No native `NULLS FIRST/LAST` substitution or cursor contract change is included.

## Minimal reproduction

Create a table-backed collection with an `increments('id')` field and `datetime('updatedAt').notNull()`, then call:

```ts
await tickets.findMany({
  sort: (s) => [s.field('updatedAt').desc(), s.field('id').desc()],
  limit: 20,
});
```

The previous order was:

```sql
ORDER BY CASE WHEN ("repository_root"."updated_at") IS NULL THEN 1 ELSE 0 END ASC,
         "repository_root"."updated_at" DESC,
         CASE WHEN ("repository_root"."id") IS NULL THEN 1 ELSE 0 END ASC,
         "repository_root"."id" DESC
```

The new order is:

```sql
ORDER BY "repository_root"."updated_at" DESC, "repository_root"."id" DESC
```

## PostgreSQL measurement

An isolated local PostgreSQL 18.6 cluster held 102,000 synthetic rows with integer primary keys, a required timestamp shared by each ten adjacent rows, and a 160-character payload. Both implementations used the same table, unchanged `(updated_at, id)` B-tree index, projection, bindings and limits. No planner settings were forced. The source baseline was commit `ca21461c81`, where `@nocobase/db` declares version `1.0.0-beta.25`; the fixed package's release version will be assigned by the normal changeset release.

Seed the table with the following SQL, then execute each repository query once to capture its actual SQL and parameters. Run `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` seven times per query, discard the first two warmups, and report the median PostgreSQL execution time of the remaining five. The temporary probe loads the original and fixed execution adapters with identical driver runtime bindings. It checks that the projections, parameters and twenty returned IDs match. The measurement script stays outside the repository.

```sql
CREATE TABLE sort_bench (id integer PRIMARY KEY, updated_at timestamp NOT NULL, payload text NOT NULL);
INSERT INTO sort_bench
SELECT i, timestamp '2026-01-01' + (i / 10) * interval '1 second', repeat('x', 160)
FROM generate_series(1, 102000) i;
CREATE INDEX sort_bench_updated_id ON sort_bench (updated_at, id);
VACUUM ANALYZE sort_bench;
```

| Offset | Previous median | Fixed median | Previous plan                                  | Fixed plan                                |
| ------ | --------------: | -----------: | ---------------------------------------------- | ----------------------------------------- |
| 0      |       68.777 ms |     0.025 ms | Parallel sequential scan → Sort → Gather Merge | Backward index scan, 20 rows, no Sort     |
| 9980   |      107.300 ms |     7.453 ms | Parallel sequential scan → Sort → Gather Merge | Backward index scan, 10,000 rows, no Sort |

The fixed first page reads twenty rows from the index rather than sorting all matching rows. Deep offset still reads and skips the preceding rows. Other predicates and searches may choose different plans. These are warm, synthetic PostgreSQL execution times, not HTTP latency or application workload acceptance.

Actual first-page SQL and bindings follow. The offset query adds `OFFSET $3` with the binding `9980`; full plans, buffer counts, all five timings and returned IDs are in the accompanying verification evidence.

### Before

```sql
select "repository_root"."id" as "id", to_char("repository_root"."updated_at", $1) as "updatedAt", "repository_root"."payload" as "payload" from "sort_bench" as "repository_root" order by case when ("repository_root"."updated_at") is null then 1 else 0 end asc, "repository_root"."updated_at" desc, case when ("repository_root"."id") is null then 1 else 0 end asc, "repository_root"."id" desc limit $2
```

Parameters: `["YYYY-MM-DD\"T\"HH24:MI:SS.MS", 20]`.

### After

```sql
select "repository_root"."id" as "id", to_char("repository_root"."updated_at", $1) as "updatedAt", "repository_root"."payload" as "payload" from "sort_bench" as "repository_root" order by "repository_root"."updated_at" desc, "repository_root"."id" desc limit $2
```

Parameters: `["YYYY-MM-DD\"T\"HH24:MI:SS.MS", 20]`.

## Regression coverage and cost

The shared `repository/capabilities/sort-nullability.test.ts` contract covers ascending and descending order with nulls first and last, mixed nullable and required keys, explicit primary-key ties, ordinary and distinct reads, forward and backward exclusive cursor pages, missing related rows, relation distinct and limited aggregate ranking, unknown nullability and views. Existing repository integration contracts cover offset pagination, relation cardinalities and grouping on each dialect. Nullable cursor fields remain rejected by the existing API.

Each ordinary or distinct read in the new contract issues one SELECT after metadata setup. The relation records plus limited aggregate example issues three SELECTs including the root, unchanged by the optimization. The change adds a field-definition lookup per sort key and no database queries, writes, locks or transactions. It changes no HTTP endpoint or request count.
