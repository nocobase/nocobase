# Demo reset resource regression

## Scope and reproduction

The benchmark starts the published minimal example as a complete fixture application through `createTestApp`, with Authentication, Authorization, Users and Demo Mode, real migrations, isolated temporary SQLite storage and database, real demo account provisioning, HTTP login and session reuse. It calls the registered application's production import, clear and reset paths. It adds a fixed 20,000 historical tasks to the example's one project and two tasks, retains the full 90-day date distribution, and passes one large ID array through `context.track`. The same generation callback alternates between the supported `generate` and `steps` interfaces. An application-registered fixed mock adapter supplies the external result; no live credentials or remote service is used. This is a complete fixture application benchmark, not an ITAM, CRM or Studio production-sized reproduction, and not a helper-only stress test.

Use Node **v24.22.1** and the repository's frozen pnpm lockfile. From the repository root, with no other process editing this worktree:

```bash
pnpm install --frozen-lockfile --filter @nocobase/app-plugin-demo-mode...
python3 packages/plugins/app-plugin-demo-mode/tests/resources/probe.py /tmp/demo-reset-instrument-probe
python3 packages/plugins/app-plugin-demo-mode/tests/resources/run.py /tmp/demo-reset-base.json 8f3e54db4f50146fd8b0376c603d09b486058249
python3 packages/plugins/app-plugin-demo-mode/tests/resources/run.py /tmp/demo-reset-changed.json
# Formal repeats: AB, BA, AB; each worker warms up and measures five resets.
python3 packages/plugins/app-plugin-demo-mode/tests/resources/compare.py /tmp/demo-reset-formal 8f3e54db4f50146fd8b0376c603d09b486058249
```

The optional second argument overlays the Demo Mode production sources and the three changed Mail/DB source files from that commit. It saves a small recovery copy under `/tmp/demo-reset-source-backup-*`, restores the current files in `finally`, and never copies a checkout or `node_modules`. The test script, fixture, dependency tree and Node options remain identical. Do not edit this worktree or run its other tests during an overlay. After a forced termination of the Python parent, restore the source backup identified by the environment JSON before doing more work. Source and fixture SHA-256 hashes accompany the raw measurements so uncommitted production code can be identified exactly.

Each command holds `/tmp/demo-reset-resource-benchmark.lock` while overlaying, measuring and restoring. The comparison runner holds it for one independent base/changed pair at a time and releases it between pairs; ordinary checks are outside the lock. Each measurement launches an independent Node worker. The parent treats nonzero exit, signal, missing results and a 660-second deadline as failure, and terminates the process group on timeout. The worker test has a 600-second deadline. The regular package test skips these resource cases; the opt-in runner enables them. Separate fast integration tests cover cross-process daily admission, reset failures, bounded retries, stale owners and long `steps` heartbeats.

## Measurement and fixed budgets

After initial generation, a complete warm-up reset and integrity checks, the worker performs **five measured resets**. The measured window begins immediately before `reset` and ends after `whenIdle`; verification and GC occur outside that window. Every round verifies business counts, the unchanged 90-day history endpoints, original user identity and the original authenticated session; final cleanup verifies zero business tasks. Resource samples cover the application worker, including its real plugins and test harness. Heap/RSS are sampled every 5 ms and at generation/round boundaries; synchronous work can hide intermediate heap peaks, so these are sampled heap peaks rather than an exact allocation maximum. The application JSON separately records OS high-water RSS in KiB through the workload and through the explicit `await app.close()` observation, with the actual application PID and close state. Neither field claims worker-exit coverage. The environment JSON records `commandMaxRssBytes` from external `/usr/bin/time -l` on macOS (`-v` on Linux), covering the complete command and its descendants, including startup, warm-up, verification, application close and Vitest teardown. This is a command-level maximum rather than a simultaneous sum or a reset-window peak. The runner requires it to be at least the observed application high-water value after unit conversion. Missing OS metrics, incomplete workload or failed close fail the runner; they are never replaced by zero. A sub-minute probe exercises normal and exceptional Vitest runs before the resource comparison. No forced GC runs during generation, cleanup, reset or peak measurement. `--expose-gc` is used only at the quiescent warm-up/round boundaries to record retained heap. The fixed 1,536 MiB old-space ceiling is a test constraint; production heap limits are not raised.

The checked budgets are **256 MiB sampled heap**, **640 MiB RSS**, **32 MiB retained-heap growth over warm-up**, and **60 seconds per reset**, excluding integrity checks. They apply to the complete fixture application; the RSS cap also covers the external whole-command high-water metric. These tighter regression budgets retain roughly 70% headroom over the successful pilot peaks; the original diagnostic pilot used 768/1,200/128 MiB and is preserved separately. Budget compliance is a guard, not the evidence of improvement; the independent paired results below provide that evidence. Soft resource assertions preserve all five raw rounds and still make the test exit nonzero. No runner option updates or accepts budgets. The RSS budget deliberately detects native allocation growth that does not appear in V8 retained heap; failures must be investigated, not recorded as a new automatic baseline.

## Three independent formal pairs

In all three pairs, changed reset RSS and sampled heap were lower than their paired base values, with non-overlapping observed process ranges. Paired RSS reductions were 75.98–77.95%; sampled heap reductions were 8.55–22.34%. Even the largest changed whole-command RSS (389.578 MiB) was below the smallest base reset-window observation (1615.125 MiB). This establishes a reproducible peak-RSS reduction for this complete fixture on the measured host; it is not a production application or per-component attribution.

All six processes completed the same initial import, one warm-up, five measured resets, integrity checks, final clear and application close. The order was **AB, BA, AB**, with one shared-lock window per pair and explicit coordinator release before the next pair. No profiler was enabled. Base exited nonzero only for the fixed RSS budget; all changed runs passed the unchanged budgets. No pair or round was discarded.

Each reset peak below is the maximum of five rounds in one independent process. The summary reports the median and range of the three process values, not 15 resets treated as independent trials. Retained heap and duration first use the median of five rounds per process. The raw JSON contains every round; values here are rounded to three decimals.

| Metric                                            |           Base median [range] |     Changed median [range] |
| ------------------------------------------------- | ----------------------------: | -------------------------: |
| Maximum sampled reset heap (MiB)                  |    157.552 [156.131, 183.878] | 142.794 [142.782, 143.289] |
| Maximum sampled reset RSS (MiB)                   | 1690.141 [1615.125, 1720.625] | 387.922 [379.391, 389.484] |
| Sampled heap after startup through workload (MiB) |    193.566 [183.878, 204.487] | 159.622 [156.621, 160.150] |
| OS RSS through application close (MiB)            | 1718.719 [1690.188, 1727.500] | 388.000 [379.406, 389.562] |
| External whole-command OS RSS (MiB)               | 1718.719 [1690.188, 1727.500] | 388.000 [379.406, 389.578] |
| Median retained heap after quiescent GC (MiB)     |       84.103 [84.100, 84.107] |    88.647 [88.640, 88.648] |
| Median reset duration (seconds)                   |          9.469 [9.331, 9.484] |       0.597 [0.585, 0.647] |

| Pair / order | Variant | Reset heap (MiB) | Reset RSS (MiB) | All-workload sampled heap (MiB) | App-close OS RSS (MiB) | Command OS RSS (MiB) |
| ------------ | ------- | ---------------: | --------------: | ------------------------------: | ---------------------: | -------------------: |
| 1 / AB       | base    |          156.131 |        1615.125 |                         204.487 |               1718.719 |             1718.719 |
| 1 / AB       | changed |          142.782 |         387.922 |                         156.621 |                388.000 |              388.000 |
| 2 / BA       | base    |          183.878 |        1720.625 |                         183.878 |               1727.500 |             1727.500 |
| 2 / BA       | changed |          142.794 |         379.391 |                         159.622 |                379.406 |              379.406 |
| 3 / AB       | base    |          157.552 |        1690.141 |                         193.566 |               1690.188 |             1690.188 |
| 3 / AB       | changed |          143.289 |         389.484 |                         160.150 |                389.562 |              389.578 |

Retained heap increased by 4.544 MiB when comparing the medians of process medians. No retained-memory improvement is claimed. Maximum changed retained growth above its own post-warm-up GC reading was 0.832 MiB, within the fixed 32 MiB growth budget. The sampled heap values can miss synchronous short peaks; OS command high-water covers startup and teardown but is not a reset-window measurement. Three pairs describe this host and workload, not a population-level statistical guarantee.

The complete fixture contains one project, two demo accounts and 20,002 tasks (the example’s two tasks plus 20,000 fixed historical tasks). Historical endpoints remain 90 days inclusive, and the original account/session identities survive every reset. These results cannot be assigned to CRM, ITAM, Studio, the separate Mail drain or the narrow DB clone operation individually.

Measured implementation: `7cc61197c940070fedbebeb53e83d7ba92215b9d`; base: `8f3e54db4f50146fd8b0376c603d09b486058249`. Pair 1’s changed HEAD is the implementation commit; later changed HEADs include only documentation/evidence commits. Production bytes, fixture, harness and lockfile hashes match across all repetitions of their respective variant. Node v24.22.1, SQLite and a fixed 1,536 MiB old-space ceiling; hardware/platform/CPU fields are required to match across all six environment reports.

| Fingerprint        | SHA-256                                                            |
| ------------------ | ------------------------------------------------------------------ |
| fixtureSha256      | `2202371f89e6a24a187df4ecaed4dc4ee7cbe3bfce39e533c01f89ee25143430` |
| harnessSha256      | `0b48d09510a451d02c963c1d38a502ee4c0da26231e90d148e18740df56a8328` |
| lockfileSha256     | `baf7bd6797e20074e33d5585ebbd8bdc8ada59468228c20ab83af12263c3d410` |
| base production    | `dcda79dcc36562c1dcc4eb6c7bdd9ea568f5ad83d03246274e0ed635adc704fa` |
| changed production | `6149719b9db78d793d19f785ecba671394b4241c0ac5ab0d6bed11c4edd49f48` |

Raw reports, actual application PIDs, exact commands, start times, environment, OS output and baseline failure logs are in [resource-results/formal](resource-results/formal/). Earlier pilots and the two preliminary reset-window pairs remain separate and are not counted in this three-pair series.

The recorded host was Apple M4 (10 logical CPUs), 16 GiB RAM, macOS 27.0 arm64, with pnpm 11.7.0. The advisory shared lock serialized resource windows; other developer applications and ordinary work remained possible.

## Interpretation and limits

The scope-preserving changes batch tracking inserts (100 rows, bounded SQL parameters), aggregate default status counts in the database, query only carried identity records during generation, and obtain the next ordinal with SQL `max`. Custom `counts(context)` and application cleanup still receive their complete records context for compatibility. The clock reuses two ICU formatters per generation; its timezone conversion, DST handling, negative-day support and historical range are unchanged.

A preliminary 20,000-row run before the clock change failed the RSS budget with 1,682,341,888 bytes RSS while sampled heap was 146,877,616 bytes and GC-retained heap 91,124,088 bytes. This motivated examining native allocation churn: the old clock constructed three `Intl.DateTimeFormat` instances per historical row. These preliminary numbers are diagnostic evidence, not the formal base/changed comparison. They do not establish the cause of the reported production ITAM heap OOM, whose deployed revision and application graph are unverified.

The formal comparison never enables Inspector allocation sampling. In Node v24.22.1, the [Inspector sampling setup](https://github.com/nodejs/node/blob/v24.22.1/deps/v8/src/inspector/v8-heap-profiler-agent-impl.cc#L515) sets the force-GC flag, and [reading the allocation profile](https://github.com/nodejs/node/blob/v24.22.1/deps/v8/src/profiler/sampling-heap-profiler.cc#L266) collects garbage under that flag; both profile reads and stopping sampling can therefore perturb object survival even without an explicit `collectGarbage` or heap snapshot request. Supplied allocation profiles are used only to locate allocation work, never as a natural-GC retained-object graph or peak-memory proof. This does not change or invalidate the profiler-free paired measurement protocol.

All measurements run on a shared developer host. The advisory lock serializes cooperating heavy benchmarks; editors, browsers, normal validation and other processes can still affect timing and RSS. Only SQLite was measured here; the migration/query operations use the repository's dialect-neutral API, but results do not establish budgets for PostgreSQL, MySQL or other drivers. The fixture has no Agents model graph, Mail mailbox lifecycle or solution-specific caches. Native ICU/allocator behavior is platform-sensitive.

## Mail deletion scope

The separate Mail change replaces one batch per relay tick with a drain that starts at most eight independently claimed batches and stops starting more once 100 ms has elapsed. It yields to the event loop after each batch. A single database transaction or external cleanup can exceed that admission budget; it is not interrupted halfway through. Existing lease renewal, token fencing, 500-row transaction limits, account ordering, failure backoff and the runtime's shared in-flight promise remain in place. Tests cover bounded/yielding execution, small-account fairness, concurrent kicks, stale lease fencing and slow external cleanup.

The CRM baseline supplied during this task (five mailboxes, 162 messages, roughly 37.949 seconds median reset and 35.2 seconds cleanup) used its already-published Mail dependency. It is evidence for the scheduler bottleneck, not a measurement of this framework patch. This fixture's before/after results must not be used as a Mail speedup claim. A downstream application must upgrade to a release containing the Mail changeset and remeasure its full workflow before assigning an end-to-end improvement to this change.

## DB metadata lookup scope

`CollectionRegistry.get()` previously called `getResolution()`, cloning the entire resolution object before discarding its inspection and warnings. It now clones only `result.collection` from the existing internal resolution path. `getResolution()` and `getPhysical()` still return defensive copies, physical inspection still refreshes on every call, and cache generation/invalidation behavior is unchanged. Existing per-execution query memoization predates this PR and is not a claimed new optimization. The additional regression verifies that mutations through `get`, `getForQuery` and `getResolution` cannot modify one another or the registry cache.

CRM supplied an allocation profile that motivated this small DB change. A diagnostic overlay reportedly reduced cumulative sampled clone allocations from 141.33 to 125.87 MiB, but cumulative allocations are not live peak memory. The subsequent profiler-free, complete CRM pilot **did not demonstrate peak improvement**: one independent process per side, each with warm-up, five resets and final cleanup, on Node v24.22.1 and the same frozen worker (`cada46647ed50ae3ccec6c4d96af485bd25e6c9a7ba756fd95d59d73e85148bf`). The CRM session supplied the following results; they are not measurements from this repository's fixture.

| CRM pilot metric                           | Published DB | Narrow-clone overlay |
| ------------------------------------------ | -----------: | -------------------: |
| Maximum reset-window sampled heap (MiB)    |      229.030 |              246.771 |
| Maximum reset-window sampled RSS (MiB)     |      456.609 |              480.750 |
| Median reset-window sampled heap (MiB)     |      226.251 |              229.769 |
| Median reset-window sampled RSS (MiB)      |      437.109 |              405.484 |
| All-phase sampled heap (MiB)               |      290.189 |              288.044 |
| Node-observed OS RSS before teardown (MiB) |      664.344 |              657.891 |
| Median retained heap (MiB)                 |      147.885 |              148.437 |
| Median reset duration (seconds)            |       37.915 |               37.921 |

The mixed one-pair result establishes neither repeatable peak benefit nor stable regression; lower median RSS does not override higher maximum reset heap/RSS. No further repeats are used to select a favorable result for this candidate. The reported source application was `9b24798`, and its artifacts are `storage/demo-benchmark/pilot-v2-{base,db-overlay}/` in the separate CRM worktree. Its overlay was restored and is not a committed application dependency update. This PR claims a narrower defensive-copy operation with semantic regression coverage, not a CRM or Studio peak reduction from the DB patch. Those applications retain their own version-pinned tests and must validate upgrades independently. Their current demo generators primarily use their own date logic, so the clock results here do not establish their benefit.

## Earlier evidence retained

The `resource-results/pilot/` directory preserves the original pilot and tracking-only diagnostic. Its old reset window included verification and used wider initial budgets, so it is not pooled with the formal results. `resource-results/reset-window-preliminary/` preserves two subsequent independent pairs with verification excluded, but its `maxRssKiB` field was observed before `app.close()` and does not represent the full worker lifecycle. Those pairs support only their stated reset-window observation and are not counted as the final three instrument-consistent pairs. `resource-results/instrument-probe/` contains the successful normal and intentionally failing exceptional Vitest probes, explicit application-close records and raw external OS measurements. No exit hook is used.

## Additional static investigation

The [SQLite prepare-path investigation](sqlite-prepare-investigation.md) records the actual driver/native lifecycle, binding cleanup and schema-reprepare boundaries. No statement cache or new diagnostic resource window is part of this PR. It does not attribute unexplained application RSS to SQLite.
