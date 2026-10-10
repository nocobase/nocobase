# Mail participant filter scale verification

## Purpose and scope

`tests/server/message-participant-performance.test.ts` is a reproducible, opt-in verification harness for the participant index migration and the real Mail store. It uses `provisionTestDatabases()` and `open()` from `@nocobase/app-testing/server`, so the default run uses a real isolated, file-backed SQLite database, and the same test takes PostgreSQL or MySQL from the repository's dialect runner. A separate database manager opens the same provisioned configuration with an independent single-connection diagnostic pool, rather than queueing probes behind the migration's connection. No driver is imported or configured by the test, and no additional package dependency is needed. Fixtures are destroyed in `finally`.

This is synthetic correctness and scale evidence, not a production capacity estimate or a latency SLA. Timing assertions are intentionally absent: hardware, filesystem, database configuration, statistics, warm caches, and other workloads affect latency. Normal test runs skip both workloads unless `RUN_MAIL_PARTICIPANT_BENCHMARK=1` is set. A successful ordinary package suite does not mean the benchmark ran.

## Reproduce

Run these commands from the repository root after installing the locked dependencies. The test has a ten-minute timeout per workload. Disable coverage when measuring performance; this deliberately avoids the package-wide coverage thresholds for a single selected file. `--disableConsoleIntercept` keeps the structured measurement output visible even when a reporter buffers successful-test console output.

```bash
# Default SQLite: no Docker required.
RUN_MAIL_PARTICIPANT_BENCHMARK=1 \
  pnpm --filter @nocobase/app-plugin-mail exec vitest run \
  tests/server/message-participant-performance.test.ts \
  --coverage.enabled=false --disableConsoleIntercept \
  > /tmp/mail-participant-benchmark-sqlite-final.log 2>&1

# Confirm that ordinary runs skip the expensive fixture.
pnpm --filter @nocobase/app-plugin-mail exec vitest run \
  tests/server/message-participant-performance.test.ts --coverage.enabled=false
```

The following commands start disposable database services through the repository runner. Run them only when deliberately verifying those dialects, one at a time, and avoid other benchmark or integration runs on the same machine. The MySQL and PostgreSQL evidence below comes from completed runner executions, including successful service cleanup, not from a SQLite-only run or a projected result.

```bash
RUN_MAIL_PARTICIPANT_BENCHMARK=1 \
  pnpm test:db mysql --filter @nocobase/app-plugin-mail -- \
  tests/server/message-participant-performance.test.ts \
  --coverage.enabled=false --disableConsoleIntercept --maxWorkers=1 \
  > /tmp/mail-participant-benchmark-mysql-final.log 2>&1

RUN_MAIL_PARTICIPANT_BENCHMARK=1 \
  pnpm test:db postgres --filter @nocobase/app-plugin-mail -- \
  tests/server/message-participant-performance.test.ts \
  --coverage.enabled=false --disableConsoleIntercept --maxWorkers=1 \
  > /tmp/mail-participant-benchmark-postgres-final.log 2>&1
```

Every measurement is a line prefixed with `MAIL_PARTICIPANT_BENCHMARK ` followed by JSON. Preserve the full log, including the Vitest result, environment, timings, actual SQL/bindings, and native plans. All addresses and account IDs in that output are synthetic fixture values. Use the log's environment record and the checkout's lockfile when comparing runs. Check that the output contains both 5,000- and 30,000-message environment/backfill records and that Vitest reports two passed tests, not skipped tests.

## Workloads and checks

| Dimension              | Fixture                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Historical source rows | Separate fresh databases with 5,000 and 30,000 messages                                                                               |
| Accounts               | Four active accounts owned by one synthetic user, evenly distributed                                                                  |
| Normal participants    | One From, two To, one Cc; independent Bcc and Reply-To target values                                                                  |
| Exact-address hits     | 0.4%: 20 / 120 messages across four accounts; 5 / 30 in one account                                                                   |
| Exact-domain hits      | 0.8%: 40 / 240 messages across four accounts; 10 / 60 in one account                                                                  |
| Repeated roles         | Exact-address hits repeat the address in From, To and Cc, including a duplicate uppercase To value                                    |
| Mass recipients        | One source message with 1,250 To plus 1,250 Cc, producing 2,501 index rows including From                                             |
| Boundary values        | Local part of 64 characters plus valid domain of 253 characters; apostrophe, underscore, hyphen, plus and percent local-part variants |
| Sorting                | Identical timestamps with deterministic UUID tie-breaking; conversations of ten source messages and inbox relationships               |
| False positives        | Bcc, Reply-To and preview mention the sparse target throughout the fixture; participant totals still match only From/To/Cc            |

The final mass-recipient fixture uses `to-${i}@bulk.test` and `cc-${i}@bulk.test`, keeping the historical `recipientsSearch` TEXT payload below MySQL's 64 KiB limit without truncating it. The fan-out remains 1,250 To plus 1,250 Cc and 2,501 participant rows. All three recorded runs use this corrected fixture; earlier measurements with longer bulk addresses are superseded rather than mixed into these tables.

The harness first applies the historical migrations through `202609260001_add_mail_sync_retry_attempts`, seeds source messages and address JSON in bounded 25-row batches, then times `migrator.latest()` applying only `202610090001_mail_create_message_participants`. It independently computes the expected number of valid, role-deduplicated fixture addresses, verifies the participant count and observed inserted rows, checks 100-message keyset reads without offset, and asserts no participant insert exceeds 500 bindings / 100 rows. It compares source count and minimum/maximum `updatedAt` plus complete source rows for a bounded set of boundary/ordinary/mass-recipient examples before and after migration. It does not load all 30,000 source messages into memory or claim a byte-for-byte comparison of every source row.

For both mailbox sizes, list checks exercise one account and four accounts, with no participant, a sparse full address, and a sparse exact domain. Sparse cursor and offset traversal is checked against independent expected IDs on every page, including totals, terminal pages, timestamp ties, repeated roles, and no duplicates or missing messages. Boundary/punctuation addresses and a missing address are also queried. Five repeated samples measure first page plus total, cursor second page plus total, offset second page plus total, and deep offset plus total. The page size is three, so even the smallest sparse result requires another page. The reported list latency includes account selection, count, row query, relation hydration, and conversation counts; it is not a separately measured bare SQL count latency.

During the warm-up request, a listener on the adapter client's `query` event captures the actual compiled store row and count statements and bindings. Each statement is explained through that same client's `raw()`: SQLite uses `EXPLAIN QUERY PLAN`, PostgreSQL and MySQL use `EXPLAIN`, not `EXPLAIN ANALYZE`. PostgreSQL's captured native `$n` placeholders are converted to Knex `?` placeholders with bindings reordered/repeated by position, without interpolating values into SQL; the log retains the original SQL and bindings. Physical table names for diagnostics are obtained from `query.compile()` rather than assuming a naming strategy. The harness verifies that participant statements exist in both count and row SQL, and that neither statement without a participant mentions the derived table. Plans are optimizer estimates to review, not measured execution-row counts or assertions that a particular optimizer must always choose the same index.

Write measurements use two distinct comparisons:

- **Attributable replacement cost:** for batches of 100 and 500 existing messages, five samples compare same-value source JSON updates in one transaction, exactly those updates plus `replaceMessageParticipants()` in one transaction, and replacement alone in one transaction. Measurement order alternates to reduce systematic cache/order bias. Source fingerprints remain unchanged. The median difference is an estimate of added indexing work for this controlled operation, not the overhead against unavailable pre-change save/sync code, and replacement-only time includes transaction overhead.
- **Accepted production paths:** batches of 100 and 500 new messages are saved through sequential `store.saveMessage()` calls and inserted through one `store.commitSyncBatch()` call, then re-synced through the accepted update path. Source and participant counts prove the writes were accepted and the update did not duplicate rows. Per-message timings include the real path's guards, mapping, database work, relation operations and return loading. Save and sync have different transaction boundaries and must not be compared as if they were equivalent operations. A separate transaction measures replacing the 2,500-recipient message, while query-event observation checks runtime insertion bounds.

Native storage diagnostics run after backfill and before list measurements or additional save/sync data. SQLite optionally reads `dbstat` using index names from the physical schema inspector; PostgreSQL uses relation/index size functions; MySQL reads its table allocation estimates after `ANALYZE TABLE` on the derived participant table and `SET SESSION information_schema_stats_expiry = 0` on the measuring connection. This refresh avoids cached empty-table allocation metadata and affects the subsequent MySQL plan/list measurements. It does not analyze the source `mail_messages` table or add an optimizer hint. It runs after migration timing and the observer's final log snapshot, so its duration and any log work are excluded from those migration measurements. SQLite and PostgreSQL receive no manual statistics refresh from this harness. Automatic engine statistics work is not controlled. Allocation metrics differ between engines; SQLite's primary-key autoindex counts as index storage, whereas InnoDB's clustered primary key is part of table storage. If a native metric is unavailable, the log records that explicitly instead of failing correctness verification.

### Migration operational observations

`migration-operations` surrounds the actual `migrator.latest()` call, including DDL, backfill, transaction commit and migration bookkeeping. Before/after snapshots run on the independent observer; its single-session pool does not compete for the migration pool's default connection. PostgreSQL records `pg_current_wal_insert_lsn()` and `pg_wal_lsn_diff()` in bytes. MySQL records available global InnoDB log-written/current-LSN/logical-size/log-wait/row-lock-wait counters and `performance_schema.log_status`'s InnoDB LSN when permitted. Deltas use integer arithmetic; missing variables are absent rather than zero. These are server-wide observations, not exclusive migration attribution, and can include unrelated server activity and observer overhead; successful PostgreSQL row-lock probes can themselves generate WAL without changing logical source values. The MySQL logical redo size is a gauge, not a cumulative bytes-written counter. Size allocation is reported separately.

Native observations start on the first participant insert query event and every fiftieth insert thereafter, at most 32 samples with only one in flight. PostgreSQL samples grouped source/participant relation locks from `pg_locks`, also retaining fixture-database locks on relations absent from the observer's catalog snapshot as `uncommitted/unknown relation` (new migration tables/indexes are not yet visible to that connection), and native `Lock` wait events in the fixture database; MySQL samples grouped InnoDB data locks, metadata locks and data-lock waits in the fixture database. No row-level lock listing, application SQL text, connection configuration or database file path is logged. PostgreSQL observer statement/lock timeouts are 1,000/100 ms; MySQL SELECT execution, InnoDB lock wait and metadata lock wait limits are 1,000 ms/1 second/1 second. Failed diagnostics retain their diagnostic name and driver error code, not raw server messages. Catalog permissions and disabled instrumentation may hide locks; an empty result is not proof that no lock exists. Footprints are bounded snapshots, not peak lock counts, and native waits without representative competing traffic are not sustained application contention evidence.

Each sample also runs a safe competing probe: SQLite attempts `BEGIN IMMEDIATE` with zero busy timeout and immediately rolls back if successful; PostgreSQL/MySQL attempt an autocommit `SELECT ... FOR UPDATE NOWAIT` on one existing source row. These probes do not change source data. Recognized busy/lock-refusal/timeout codes are reported distinctly from successful probes and unavailable/failed probes. Every probe and successful native catalog result, including an empty catalog result, includes elapsed time and whether migration was still running at completion. If native timeout setup fails, native log/lock requests are disabled and reported unavailable instead of allowing an unbounded probe. A successful source-row probe cannot rule out other blocked reads/writes, especially locks on the new participant table. This limited traffic is not a load test, and diagnostic work adds overhead to the reported wall time.

SQLite discovers the file through `PRAGMA database_list`, records the selected `journal_mode`, and stats the database plus `-journal`, `-wal` and `-shm` siblings before/after and every tenth migration query event, capped at 2,048 file samples. Only existence/byte sizes are logged. Files deleted between samples can be missed; maximum sampled sizes are neither proven peaks nor cumulative log bytes written. The default journal mode is not changed to create artificial WAL evidence.

## Fresh three-dialect evidence

The authoritative local artifacts are `/tmp/mail-participant-benchmark-sqlite-final.log`, `/tmp/mail-participant-benchmark-mysql-final.log` and `/tmp/mail-participant-benchmark-postgres-final.log`. Each contains 92 structured records, both workloads and `Tests 2 passed (2)`; neither workload was skipped. They are local run artifacts, not repository fixtures. Every environment record reports Node.js `v24.15.0`, macOS arm64 and an Apple M1 Pro; Vitest is `4.1.10`. These identify the test worker, not the container database server's hardware. Database server versions and a complete settings inventory are not recorded, so retain the checkout's runner configuration when reproducing. Timings below are milliseconds rounded to three decimal places unless otherwise indicated; bytes and counts are exact logged values or explicitly identified sums.

| Engine     | 5,000-message environment timestamp (UTC) | 30,000-message environment timestamp (UTC) | Vitest overall seconds | Vitest test seconds | Result   |
| ---------- | ----------------------------------------- | ------------------------------------------ | ---------------------: | ------------------: | -------- |
| SQLite     | 2026-10-10T03:45:37.936Z                  | 2026-10-10T03:45:46.983Z                   |                  59.10 |               58.05 | 2 passed |
| MySQL      | 2026-10-10T02:56:56.667Z                  | 2026-10-10T02:57:40.865Z                   |                 101.55 |              100.56 | 2 passed |
| PostgreSQL | 2026-10-10T02:54:22.349Z                  | 2026-10-10T02:54:58.040Z                   |                  98.59 |               97.50 | 2 passed |

Coverage and console interception were disabled in all three runs; the dialect runner selected one worker for MySQL and PostgreSQL. The PostgreSQL log also contains a driver deprecation warning about calling `client.query()` while a query is already executing; it is not a diagnostic failure or a failed test. No earlier failed or partial attempt supplies measurements below.

### Backfill and statement bounds

| Engine     | Messages | Participant rows | Rows/message |   Seed ms | Final migration ms | Index insert statements | Source keyset pages | Maximum insert bindings | Sampled worker RSS bytes |
| ---------- | -------: | ---------------: | -----------: | --------: | -----------------: | ----------------------: | ------------------: | ----------------------: | -----------------------: |
| SQLite     |    5,000 |           22,483 |        4.497 |   483.816 |            367.760 |                     226 |                  51 |                     500 |              237,862,912 |
| SQLite     |   30,000 |          122,383 |        4.079 | 3,192.949 |          2,031.170 |                   1,226 |                 301 |                     500 |              953,761,792 |
| MySQL      |    5,000 |           22,483 |        4.497 | 1,363.857 |          3,694.793 |                     226 |                  51 |                     500 |              177,553,408 |
| MySQL      |   30,000 |          122,383 |        4.079 | 5,801.247 |         13,685.860 |                   1,226 |                 301 |                     500 |              288,899,072 |
| PostgreSQL |    5,000 |           22,483 |        4.497 |   855.892 |            762.921 |                     226 |                  51 |                     500 |              170,541,056 |
| PostgreSQL |   30,000 |          122,383 |        4.079 | 4,993.166 |          3,726.948 |                   1,226 |                 301 |                     500 |              349,880,320 |

Source fingerprints were unchanged in all six fixtures, and observed inserts exactly matched the resulting participant counts. Both migration and runtime paths reached but did not exceed 100 participant rows / 500 bindings per insert, including the mass-recipient message. Source page counts include the terminal empty keyset read. RSS is sampled every 50 migration query events and includes the whole worker, seeding, adapter caches and prior workload state; it is not migration-only memory usage, a proven peak or a memory cap. The proven bounds here are statement sizes and source-page shape, not total migration cost.

### SQLite journal files

Both SQLite fixtures selected the default `delete` journal mode, not WAL. The rollback journal was absent before and after migration but present during the sampled backfill; neither WAL nor SHM existed in any recorded sample. The database file grew by the derived allocation reported below. A rollback journal stores originals of overwritten pages rather than every newly appended index page, so its small observed size is not the migration's cumulative write volume.

| Messages | Database bytes before | Database bytes after | File samples | Journal-present samples | Maximum sampled journal bytes |
| -------: | --------------------: | -------------------: | -----------: | ----------------------: | ----------------------------: |
|    5,000 |            11,214,848 |           21,454,848 |           35 |                      31 |                        16,928 |
|   30,000 |            65,273,856 |          121,794,560 |          160 |                     156 |                        17,920 |

SQLite's `beforeLog` and `afterLog` are empty because file/journal observations supply this engine's log evidence; they are not a measured zero write volume. `footprintSamples` is empty because no native relation-lock catalog is implemented for SQLite; the independent writer-reservation probe supplies its lock evidence. Neither the file-sample cap nor the native-sample cap was reached.

### PostgreSQL WAL and MySQL redo

| PostgreSQL messages | WAL insert LSN before | WAL insert LSN after | WAL LSN difference bytes |
| ------------------: | --------------------- | -------------------- | -----------------------: |
|               5,000 | `0/258F9C8`           | `0/32525B0`          |               13,380,584 |
|              30,000 | `0/9979D08`           | `0/E0AD638`          |               74,660,144 |

| MySQL messages | `Innodb_os_log_written` delta bytes | `Innodb_redo_log_current_lsn` delta bytes | `log_status` LSN delta bytes | Logical redo size before bytes | Logical redo size after bytes | Logical redo gauge delta bytes |
| -------------: | ----------------------------------: | ----------------------------------------: | ---------------------------: | -----------------------------: | ----------------------------: | -----------------------------: |
|          5,000 |                          15,744,512 |                                15,267,621 |                   15,267,729 |                      9,460,736 |                    24,728,576 |                     15,267,840 |
|         30,000 |                          87,736,832 |                                85,432,778 |                   85,433,199 |                     16,586,752 |                    10,654,720 |                     -5,932,032 |

These server-wide WAL/redo snapshots include whatever server activity occurred in the observation window and diagnostic/probe overhead; they are not migration-exclusive bytes and are not directly comparable to allocated table bytes. MySQL status and `log_status` snapshots are separate queries, explaining their slightly different LSN deltas. The 30,000-message logical redo gauge decreased by 5,932,032 bytes; the retained logical size can shrink after checkpoint progress, so this is not negative bytes written or proof that the migration generated no redo. The actual log-written and LSN deltas are positive. MySQL `Innodb_log_waits`, `Innodb_row_lock_waits` and `Innodb_row_lock_time` were zero both before and after each migration, with zero deltas. `Innodb_lsn_current` was absent from the returned variables; it is not substituted with zero. The emitted `unavailable` array is `[]` for all six migration observations: no requested diagnostic failed or timeout setup was unavailable in these runs. The absent MySQL variable and SQLite's unimplemented relation catalog must still be distinguished from successful diagnostics.

### Native locks and competing probes

| Engine     | Messages | Native samples | Successful catalog results | Probe refusals | Probes completed without observed blocking | Probe start range ms | Probe elapsed range ms | Refusal code     |
| ---------- | -------: | -------------: | -------------------------: | -------------: | -----------------------------------------: | -------------------- | ---------------------- | ---------------- |
| SQLite     |    5,000 |              5 |                          0 |              5 |                                          0 | 20.265–271.124       | 1.970–2.367            | `SQLITE_BUSY`    |
| SQLite     |   30,000 |             25 |                          0 |             25 |                                          0 | 23.789–1,857.041     | 1.319–3.357            | `SQLITE_BUSY`    |
| MySQL      |    5,000 |              5 |                         15 |              1 |                                          4 | 134.670–3,366.240    | 0.378–0.950            | `ER_LOCK_NOWAIT` |
| MySQL      |   30,000 |             25 |                         75 |              1 |                                         24 | 209.724–13,466.684   | 0.272–1.000            | `ER_LOCK_NOWAIT` |
| PostgreSQL |    5,000 |              5 |                         10 |              5 |                                          0 | 53.642–641.707       | 0.434–4.024            | `55P03`          |
| PostgreSQL |   30,000 |             25 |                         50 |             25 |                                          0 | 54.615–3,621.132     | 0.393–2.647            | `55P03`          |

All probes and catalog results completed with `migrationStillRunning: true`; no probe was unavailable/failed, and no native-sample cap was reached. Start times are relative to the observation window, not separate migration phase durations. SQLite's zero busy timeout and PostgreSQL/MySQL's NOWAIT probes report immediate native refusal rather than measuring a sustained lock wait; elapsed times include adapter/event-loop and diagnostic overhead. SQLite refused every competing writer reservation, PostgreSQL refused every source-row locking probe, and MySQL refused only the first probe in each fixture (0.950 and 0.718 ms respectively); its remaining probes completed without observed blocking. Those successful MySQL probes do not prove all source rows or participant-table operations were nonblocking.

MySQL metadata samples consistently returned one granted transaction-duration `SHARED_WRITE` and one `SHARED_READ` lock. Data-lock snapshots ranged from empty to granted table `IX`/`IS` groups (one each) and record `S,REC_NOT_GAP` groups of up to 25 sampled locks in both fixtures. Every data-lock-wait snapshot returned `waits: 0`. The catalog query elapsed ranges were 0.402–3.462 ms and 0.281–3.895 ms for the two sizes. Zero waiting snapshots/global wait deltas do not contradict the two NOWAIT refusals: an immediately refused probe need not remain in a waiting catalog.

PostgreSQL snapshots consistently showed one granted `AccessShareLock`, `RowShareLock` and `ShareRowExclusiveLock` on `mail_messages`, plus granted `uncommitted/unknown relation` groups: six `AccessExclusiveLock`, two `AccessShareLock`, one or four `RowExclusiveLock`, two `ShareLock` and one `ShareRowExclusiveLock`. The unknown label preserves locks whose relation names were not visible in the independent observer's catalog snapshot; it does not identify each as a particular participant index. All `Lock` wait-event samples were empty. Catalog query elapsed ranges were 0.636–3.416 ms and 0.502–2.458 ms. These snapshots and the `55P03` refusals establish observed migration locks and refusal instants, not continuous lock coverage, peak lock counts, a representative application wait distribution or online-upgrade safety.

### Derived table allocation

SQLite `dbstat` allocation by B-tree:

| Messages | Table bytes | Address index bytes | Domain index bytes | Primary-key autoindex bytes | Total bytes (sum) |
| -------: | ----------: | ------------------: | -----------------: | --------------------------: | ----------------: |
|    5,000 |   3,026,944 |           2,744,320 |          2,539,520 |                   1,929,216 |        10,240,000 |
|   30,000 |  16,691,200 |          14,983,168 |         14,057,472 |                  10,788,864 |        56,520,704 |

MySQL refreshed table/index allocation and PostgreSQL native relation sizes:

| Engine     | Messages | Table bytes | Index bytes | Total bytes |
| ---------- | -------: | ----------: | ----------: | ----------: |
| MySQL      |    5,000 |   6,881,280 |  11,665,408 |  18,546,688 |
| MySQL      |   30,000 |  33,226,752 |  57,180,160 |  90,406,912 |
| PostgreSQL |    5,000 |   2,605,056 |   5,840,896 |   8,445,952 |
| PostgreSQL |   30,000 |  14,426,112 |  33,046,528 |  47,472,640 |

MySQL totals above are sums of the logged `table_bytes` and `index_bytes`, not a separately logged total-size function. The nonzero allocation follows the derived-table statistics refresh described above, rather than stale empty-table metadata. SQLite index pages alone sum to 7,213,056 and 39,829,504 bytes; PostgreSQL table size includes its native auxiliary storage, and MySQL table allocation includes the clustered primary key. These are allocated/estimated storage bytes, not logical address payload, total database footprint or journal/WAL/redo bytes. UUID representation, address lengths, recipient fan-out, page layout and engine storage differ in production; no engine-wide space ranking or production growth forecast follows from this fixture.

### Warm list latency

All values are median milliseconds over five samples, with `withTotal: true` in every request. Deep offset means `total - 3`, which is 29,997 for the largest unfiltered four-account result but only 117 or 237 for its sparse filters. The three tables use the same totals and inputs, but engine environment, statistics and plan choices differ; a larger fixture is not necessarily slower when the optimizer changes strategy.

#### SQLite

| Messages | Scope         | Participant  |  Total | First + total ms | Cursor second + total ms | Offset second + total ms | Deep offset + total ms |
| -------: | ------------- | ------------ | -----: | ---------------: | -----------------------: | -----------------------: | ---------------------: |
|    5,000 | Four accounts | None         |  5,000 |            8.123 |                    7.992 |                    7.604 |                 13.153 |
|    5,000 | Four accounts | Full address |     20 |            7.732 |                    7.877 |                    7.569 |                  7.900 |
|    5,000 | Four accounts | Domain       |     40 |            7.580 |                    7.662 |                    7.426 |                  7.868 |
|    5,000 | One account   | None         |  1,250 |            1.921 |                    2.297 |                    1.866 |                  2.051 |
|    5,000 | One account   | Full address |      5 |            2.747 |                    2.680 |                    3.153 |                  3.100 |
|    5,000 | One account   | Domain       |     10 |            2.566 |                    2.767 |                    3.091 |                  3.120 |
|   30,000 | Four accounts | None         | 30,000 |          100.281 |                  106.907 |                  107.225 |                347.615 |
|   30,000 | Four accounts | Full address |    120 |          112.589 |                  115.842 |                  112.544 |                114.620 |
|   30,000 | Four accounts | Domain       |    240 |          115.305 |                  116.931 |                  116.973 |                114.999 |
|   30,000 | One account   | None         |  7,500 |           14.846 |                   14.162 |                   14.083 |                 17.411 |
|   30,000 | One account   | Full address |     30 |           15.952 |                   16.615 |                   16.410 |                 22.147 |
|   30,000 | One account   | Domain       |     60 |           15.877 |                   16.222 |                   16.250 |                 22.849 |

#### MySQL

| Messages | Scope         | Participant  |  Total | First + total ms | Cursor second + total ms | Offset second + total ms | Deep offset + total ms |
| -------: | ------------- | ------------ | -----: | ---------------: | -----------------------: | -----------------------: | ---------------------: |
|    5,000 | Four accounts | None         |  5,000 |           89.541 |                   84.752 |                   86.879 |                 93.496 |
|    5,000 | Four accounts | Full address |     20 |          107.225 |                  104.391 |                  112.276 |                125.944 |
|    5,000 | Four accounts | Domain       |     40 |          107.487 |                   99.693 |                  103.922 |                122.058 |
|    5,000 | One account   | None         |  1,250 |           12.768 |                   13.085 |                   13.227 |                 23.805 |
|    5,000 | One account   | Full address |      5 |           23.599 |                   19.571 |                   26.206 |                 26.971 |
|    5,000 | One account   | Domain       |     10 |           17.442 |                   17.939 |                   20.255 |                 23.376 |
|   30,000 | Four accounts | None         | 30,000 |          194.627 |                  197.811 |                  193.048 |                217.628 |
|   30,000 | Four accounts | Full address |    120 |            8.120 |                    8.525 |                    8.088 |                  8.043 |
|   30,000 | Four accounts | Domain       |    240 |            9.985 |                   10.790 |                    9.273 |                  9.947 |
|   30,000 | One account   | None         |  7,500 |           64.725 |                   66.858 |                   62.840 |                101.306 |
|   30,000 | One account   | Full address |     30 |            4.837 |                    4.706 |                    4.969 |                  5.096 |
|   30,000 | One account   | Domain       |     60 |            5.106 |                    5.479 |                    5.063 |                  5.248 |

#### PostgreSQL

| Messages | Scope         | Participant  |  Total | First + total ms | Cursor second + total ms | Offset second + total ms | Deep offset + total ms |
| -------: | ------------- | ------------ | -----: | ---------------: | -----------------------: | -----------------------: | ---------------------: |
|    5,000 | Four accounts | None         |  5,000 |           16.812 |                   16.010 |                   15.973 |                 19.769 |
|    5,000 | Four accounts | Full address |     20 |          255.214 |                  228.312 |                  250.493 |                250.324 |
|    5,000 | Four accounts | Domain       |     40 |           18.516 |                   18.263 |                   17.583 |                 17.939 |
|    5,000 | One account   | None         |  1,250 |            8.008 |                    7.955 |                    8.155 |                  8.160 |
|    5,000 | One account   | Full address |      5 |            8.813 |                    7.089 |                    9.687 |                  9.556 |
|    5,000 | One account   | Domain       |     10 |           14.456 |                    7.606 |                    8.560 |                  9.627 |
|   30,000 | Four accounts | None         | 30,000 |           82.955 |                   81.600 |                   87.828 |                108.666 |
|   30,000 | Four accounts | Full address |    120 |          145.765 |                  122.990 |                  131.094 |                120.813 |
|   30,000 | Four accounts | Domain       |    240 |          111.217 |                  105.103 |                  109.945 |                114.940 |
|   30,000 | One account   | None         |  7,500 |            8.889 |                   25.988 |                    7.803 |                 20.962 |
|   30,000 | One account   | Full address |     30 |            4.009 |                    3.866 |                    4.156 |                  3.795 |
|   30,000 | One account   | Domain       |     60 |            5.269 |                    5.275 |                    4.873 |                  4.843 |

### Actual row and count plan review

SQLite row and count plans used `mail_participants_address_idx` or `mail_participants_domain_idx` as covering indexes with the complete `(account_id, address/domain, message_id)` equality lookup in both fixtures and scopes. One-account row plans used `mail_messages_account_sort_idx`; four-account row plans used `idx_mail_messages_account_id` and a temporary B-tree for ordering. Count plans used the account index and a temporary B-tree for `count(DISTINCT)`. The draft-visibility condition retained its correlated account-index lookup. Sparse four-account requests at 30,000 messages still took 112.544–116.973 ms across the reported medians: covering participant access does not eliminate outer candidates, totals, sorting or hydration.

MySQL 5,000-message row/count plans remained message-driven: `mail_messages_account_provider_unique` for counts and four-account rows, `mail_messages_account_sort_idx` with backward scans for one-account rows, and participant `ref` access using the matching address/domain index with `Using index; FirstMatch(mail_messages)`. Four-account rows used filesort. At 30,000 messages, sparse row/count plans instead started from the matching participant index: four-account range scans estimated 360 address-role rows or 480 domain-role rows, with temporary duplicate elimination (`Start temporary` / `End temporary`), then `eq_ref` message primary-key lookups; one-account `ref` scans estimated 90 / 120 participant rows with `LooseScan`, then message primary-key lookups. Sparse rows also used temporary sorting/filesort. These are role-row estimates, not the verified message totals of 120 / 240 or 30 / 60. Unfiltered four-account row/count plans used a full message scan at 30,000 messages, with filesort for rows; unfiltered one-account plans retained account/provider access for counts and backward account-sort access for rows. Draft visibility retained a dependent source lookup. The refreshed participant statistics did not refresh source statistics: the 5,000-message outer four-account estimate was only four rows despite a verified total of 5,000. The lower 30,000-message sparse medians reflect a different captured strategy, not evidence of inverse scaling or a guaranteed optimizer choice.

PostgreSQL's 5,000-message four-account exact-address row/count plans are a material limitation: nested-loop semi joins used `mail_participants_domain_idx` with `(account_id, message_id)` conditions and an address filter, not the address index or a complete address equality index condition. Their medians were 228.312–255.214 ms, substantially above this run's four-account domain medians. Four-account domain row/count plans used the full domain equality `Index Only Scan`. At 30,000 messages, both four-account sparse row/count plans used nested-loop semi joins with the appropriate address/domain `Index Only Scan` and complete account/value/message conditions. Outer four-account scans were bitmap account access at 5,000 and account-index scans at 30,000; rows sorted by timestamp/id and counts sorted IDs before aggregation. One-account sparse counts at 5,000 used merge semi joins and matching participant index-only scans; sparse rows used backward account-sort scans and backward participant index-only scans. At 30,000, both one-account sparse row/count plans became participant-driven index-only scans plus `HashAggregate` deduplication and message-ID index lookups, with row sorting and count aggregation. Unfiltered one-account rows used bitmap access plus sort at 5,000 and backward account-sort access at 30,000; counts used account access and sort/aggregate. Draft visibility retained its source subplan. Small estimated outer row counts and the lack of manual PostgreSQL statistics refresh limit interpretation; no `EXPLAIN ANALYZE` or forced-index experiment was run.

Across all three engines, the captured no-participant row and count SQL did not reference `mail_message_participants`, and every sparse traversal matched the independent expected IDs and totals without duplicates from repeated roles. The raw plans, original parameterized SQL, bindings and five-sample ranges remain in the logs. Index use is not a claim that the whole request is proportional only to the sparse hit count, and the PostgreSQL 5,000-message address plan must not be summarized as universal use of the address index.

### Write measurements

Median milliseconds over five same-input transactional samples:

| Engine     | Mailbox messages | Batch messages | Source only ms | Source + replacement ms | Replacement only ms | Difference of medians ms |
| ---------- | ---------------: | -------------: | -------------: | ----------------------: | ------------------: | -----------------------: |
| SQLite     |            5,000 |            100 |         15.055 |                  33.037 |              21.687 |                   17.982 |
| SQLite     |            5,000 |            500 |         62.575 |                 121.240 |              59.254 |                   58.665 |
| SQLite     |           30,000 |            100 |         13.758 |                  40.457 |              25.757 |                   26.699 |
| SQLite     |           30,000 |            500 |         61.527 |                 135.594 |              75.722 |                   74.067 |
| MySQL      |            5,000 |            100 |         50.551 |                  93.349 |              41.634 |                   42.798 |
| MySQL      |            5,000 |            500 |        173.334 |                 286.252 |             120.332 |                  112.918 |
| MySQL      |           30,000 |            100 |         43.786 |                  72.529 |              37.694 |                   28.743 |
| MySQL      |           30,000 |            500 |        158.435 |                 275.777 |             119.365 |                  117.342 |
| PostgreSQL |            5,000 |            100 |         54.972 |                  68.786 |              22.119 |                   13.814 |
| PostgreSQL |            5,000 |            500 |        231.358 |                 310.363 |              76.239 |                   79.005 |
| PostgreSQL |           30,000 |            100 |         53.310 |                  79.226 |              29.596 |                   25.916 |
| PostgreSQL |           30,000 |            500 |        182.025 |                 297.209 |             103.638 |                  115.184 |

Accepted-path observations below are one measured batch per path, not five-sample medians:

| Engine     | Mailbox messages | Batch messages | Sequential save ms | Save ms/message | Sync insert ms | Insert ms/message | Sync accepted update ms | Update ms/message |
| ---------- | ---------------: | -------------: | -----------------: | --------------: | -------------: | ----------------: | ----------------------: | ----------------: |
| SQLite     |            5,000 |            100 |            734.869 |           7.349 |         29.665 |             0.297 |                  65.289 |             0.653 |
| SQLite     |            5,000 |            500 |          3,799.201 |           7.598 |        182.520 |             0.365 |                 251.030 |             0.502 |
| SQLite     |           30,000 |            100 |            849.224 |           8.492 |         47.013 |             0.470 |                  77.412 |             0.774 |
| SQLite     |           30,000 |            500 |          4,164.242 |           8.328 |        141.213 |             0.282 |                 280.097 |             0.560 |
| MySQL      |            5,000 |            100 |          2,873.723 |          28.737 |         84.916 |             0.849 |                 152.460 |             1.525 |
| MySQL      |            5,000 |            500 |         14,103.244 |          28.206 |        151.710 |             0.303 |                 557.233 |             1.114 |
| MySQL      |           30,000 |            100 |          3,191.974 |          31.920 |         64.575 |             0.646 |                 133.136 |             1.331 |
| MySQL      |           30,000 |            500 |         14,703.888 |          29.408 |        177.444 |             0.355 |                 586.094 |             1.172 |
| PostgreSQL |            5,000 |            100 |          2,492.273 |          24.923 |         50.105 |             0.501 |                 223.603 |             2.236 |
| PostgreSQL |            5,000 |            500 |         13,040.260 |          26.081 |        156.520 |             0.313 |                 771.837 |             1.544 |
| PostgreSQL |           30,000 |            100 |          2,153.479 |          21.535 |         66.528 |             0.665 |                 146.524 |             1.465 |
| PostgreSQL |           30,000 |            500 |         11,002.729 |          22.005 |        144.870 |             0.290 |                 565.922 |             1.132 |

Replacement-only transactions for the mass-recipient message (2,500 recipients / 2,501 participant rows):

| Engine     | 5,000-message fixture ms | 30,000-message fixture ms |
| ---------- | -----------------------: | ------------------------: |
| SQLite     |                   40.161 |                    47.663 |
| MySQL      |                   91.148 |                   108.393 |
| PostgreSQL |                   82.722 |                   110.567 |

Source JSON and timestamps were not changed by these replacement-only transactions. Accepted save/sync insert counts increased by the expected source/participant totals, and accepted sync updates did not duplicate rows. No pre-change code was mocked or reconstructed to produce these numbers. Runtime insertion bounds were observed, but runtime-write log/lock impact was not sampled; the operational snapshots above cover migration only.

## Upgrade interpretation and remaining limits

The migration measurement covers the final schema change, historical parsing/backfill, transaction completion and migration bookkeeping, with the diagnostic overhead described above. The later MySQL derived-table statistics/allocation refresh is outside that duration and log snapshot; a real maintenance plan may need to budget statistics work separately. Bounded reads/inserts limit individual statements, not the total duration of the maintenance window or lock/log retention. Stop application writes and mail synchronization, take a backup, apply the migration, verify completion and only then serve participant results. This harness does not establish that an online upgrade or resumable concurrent backfill is safe.

Migration-time native log/journal snapshots, lock footprints/probes, derived allocation, real store lists/counts and accepted write timings were measured on SQLite, MySQL and PostgreSQL. Residual gaps are replication lag, crash recovery, cumulative SQLite journal bytes written, production storage pressure, sustained application contention and runtime-write log/lock impact. The fixture has one migration writer and only bounded diagnostic probes, not concurrent application traffic. Native refusals establish blocked probe instants; empty wait snapshots or later successful MySQL probes neither erase those refusals nor prove continuous blocking/nonblocking. Page allocation, server-wide WAL/redo deltas and sampled whole-worker RSS do not provide production throughput, retention or memory limits. Permission boundaries, malformed historical data, rollback/reapply and deletion lifecycle belong to the normal focused participant test suites rather than this benchmark.

Both count and row plans have been reviewed for the three recorded engines, including PostgreSQL's suboptimal 5,000-message four-account address lookup and MySQL's statistics/strategy changes. Other dialects are not covered by this plan diagnostic implementation; structural portability must be verified separately. Before approving a real upgrade, repeat with sanitized representative mailbox distributions and the target engine's configuration, measure sustained transaction-log and lock behavior under representative competing traffic, review plans after appropriate statistics maintenance, and size the maintenance window and additional storage from those results rather than extrapolating these two synthetic points.
