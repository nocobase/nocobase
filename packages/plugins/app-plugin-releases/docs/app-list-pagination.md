# App list pagination

`listApps` applies the same permission, environment and case-insensitive literal name/id search condition to both paths. Explicit App scopes intersect the union of created and related Apps; an empty explicit scope matches no rows. Repository string equality has no `in` builder, so grouped disjunctions keep large explicit scopes within SQLite's expression-depth limit. Search uses the Repository's dialect-specific parameter binding and literal escaping.

## Request cost

Let N be the number of authorized rows matching environment/search before label filtering, P the page size, and E the number of environments with label-matched status candidates.

- Without label/runtime filtering, read a count and one full page, ordered by `createdAt desc, id desc`. Correct the page from the count before applying offset. Full-row transfer and decoding are O(P); count/offset work still depends on N.
- With filters, read `id`, `environmentId`, `createdAt`, `labels` in `floor(N / 500) + 1` queries. The final query can be an empty termination probe. A Repository cursor compiles `createdAt < t OR (createdAt = t AND id < i)`, with an equivalent `createdAt <= t` bound so SQLite can seek the index, using millisecond ISO time to preserve the three databases' `datetimeTz` precision. Read full rows only for the selected nonempty page, restoring the id order after fetching.
- Label-only filtering retains one batch, the requested page and a rolling last page: O(500 + P) rows/ids. Reset the last-page buffer before adding a row after a full page; an exact multiple therefore retains its final full page. Empty results return page 1.
- Runtime filtering discards labels after each batch and retains O(N) id/environment pairs plus driver results. Call status once per environment with candidates, then filter/count/correct the page. Summary generation reuses successful results and errors, without querying status again. This path intentionally retains linear id/status memory to preserve the driver's one-call-per-environment contract.
- Both paths retain the existing three summary queries (releases, pending deployments and current release), an environment read per page environment and existing session initialization. Permission-provider/metadata work is unchanged. There are no new request writes, locks or transactions. The index adds maintenance to App insert/delete and changes to its indexed fields.

The environment page still makes one App-list request per load, filter/page change or manual refresh per tab. There is no new poll or realtime request. CLI arguments and response shape are unchanged. Page and count are separate reads, as designed; this does not introduce a snapshot transaction for concurrent modifications.

## Regression verification

`tests/list-apps-paging.test.ts` uses one migrated real database fixture with 2000 Apps in one environment and 300 in each of two others. It compares ids, ordering, counts and corrected pages against a full-row reference read for searches, labels, runtime states and combinations. It covers 600 tied timestamps crossing batches, adjacent millisecond instants, empty/partial/exact-full final pages, related/created/explicit permission combinations, hidden search counts and 1600 explicit ids. Its driver records per-environment status calls, including failures and no candidates.

Knex `query-response` observations during each request assert at most 500 rows and exactly four lightweight columns per candidate query, at most one page of full rows, and bounded App-table query counts. For 2000 matching candidates the scan path has five batch queries, one full-page query and the existing summary join; the default path has a count, one full-page query and the summary join. Other summary queries read their own tables.

`tests/migrations.test.ts` applies, rolls back and reapplies `202611130001_rel_apps_environment_created_index`, asserting the composite index and retention of the original environment index. The PostgreSQL/MySQL package suites run these tests when the service, migrations or their regression tests change. Run sequentially:

```sh
pnpm --filter @nocobase/app-plugin-releases test tests/list-apps-paging.test.ts tests/migrations.test.ts
pnpm test:db postgres --filter @nocobase/app-plugin-releases -- tests/list-apps-paging.test.ts tests/migrations.test.ts
pnpm test:db mysql --filter @nocobase/app-plugin-releases -- tests/list-apps-paging.test.ts tests/migrations.test.ts
```

## Index measurement method

Use a disposable database created by the test harness and deterministic incremental 2k, 20k and 100k App samples in one environment, with a 1 KiB description, a small label JSON payload and millisecond creation times. Keep the one-off measurement script outside the repository and run it through a temporary Vitest configuration so it uses the same database adapters. Warm/read the same data before and after dropping/recreating the composite index; retain the original environment index throughout.

For each sample record 20-run median time and execution plan for count, first page, page 20 and a middle keyset batch. Use `EXPLAIN QUERY PLAN` on SQLite, `EXPLAIN (ANALYZE, BUFFERS)` on PostgreSQL and `EXPLAIN ANALYZE` on MySQL. Also compare the previous full-read/decode/slice core with the new count/page/decode core on the same indexed data. Summary work is excluded from that core comparison; measure the current service request separately. Verify a corrected label-only last page over the whole sample.

Record real migration index-creation time and median per-insert time for 1000 inserts with and without the index. Insert measurements run inside a transaction to isolate statement/index maintenance from per-commit disk durability, then remove the measurement rows. For concurrent writes use a separate database connection/process: start index creation and record insert latency while it builds. On SQLite a worker thread creates a second identical temporary index while the main connection inserts; drop the temporary index after measuring. This shows lock interference separately from the migration's schema/metadata work. Do not infer production lock-free upgrades from a fast local run. PostgreSQL ordinary index creation blocks writers; MySQL behavior depends on DDL algorithm/server, and SQLite serializes writers.

Cross-environment queries do not get a global `(createdAt, id)` index in this change. Their plans may still sort; permission/search selectivity and collation can also change index choice. Check actual plans before choosing production index/maintenance windows.

## Local SQLite results

Measured on Node 24.22.2 on a shared runner; these figures are local observations, not production latency promises. The comparison uses identical deterministic data and 20 iterations per read. Timings are milliseconds.

| Apps    | Old full-read core | New count/page core | Current service request | Label last page | Index creation |
| ------- | ------------------ | ------------------- | ----------------------- | --------------- | -------------- |
| 2,000   | 26.59              | 3.21                | 10.27                   | 48.98           | 29.51          |
| 20,000  | 254.11             | 2.90                | 6.63                    | 245.76          | 91.79          |
| 100,000 | 1251.66            | 5.21                | 9.14                    | 1040.20         | 136.51         |

| Apps    | First page, no index / index | Page 20, no index / index | Middle batch, no index / index | Insert, no index / index |
| ------- | ---------------------------- | ------------------------- | ------------------------------ | ------------------------ |
| 2,000   | 10.520 / 0.541               | 27.292 / 0.735            | 1.731 / 0.151                  | 0.400 / 0.350            |
| 20,000  | 92.022 / 0.594               | 141.467 / 0.643           | 18.480 / 0.127                 | 0.218 / 0.165            |
| 100,000 | 558.995 / 0.321              | 696.105 / 0.439           | 79.065 / 0.098                 | 0.143 / 0.138            |

Before indexing, all ordered reads used the environment index plus `USE TEMP B-TREE FOR ORDER BY`. Afterwards page reads used `rel_apps_environment_created_id` without a temporary sort; the bounded middle batch plan explicitly reported `(environment_id=? AND created_at<?)`. Count retained the covering environment index; at 100k its median was 3.82 / 4.00 ms before/after.

The first measurement without the redundant timestamp bound still scanned the environment portion of the index: the 100k middle batch took 18.81 ms. Adding the equivalent upper bound changed that plan to a range seek; the final middle batch took 0.098 ms. The 100k label scan returned total 50,000, page 500 and 100 items.

A second SQLite connection created an identical temporary index in 154.68 ms. The insert overlapping its creation took 231.72 ms; subsequent durable inserts had a median of 35.35 ms. The native synchronous connection delayed processing the worker completion message, so the later samples are after the build, not concurrent samples. This confirms a writer delay is possible; the in-transaction insert medians above exclude per-commit durability and must not be compared directly to these durable writes.

The benchmark worker's peak RSS was 1745 MiB (`process.resourceUsage().maxRSS`), including the repeated old full-row baseline and garbage collection. It does not isolate the new path's memory. Query result-size assertions provide the bounded-row regression check.

PostgreSQL/MySQL tests and measurements remain unverified locally: both `pnpm test:db` commands failed to start with `spawn docker ENOENT`; neither Docker nor a native server executable is installed. Their 2k/20k/100k plans, index creation, concurrent-write impact and migration up/down must be checked on a prepared runner. Full framework CI remains required.
