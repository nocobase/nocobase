## Three independent formal pairs

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

Raw reports, actual application PIDs, exact commands, start times, environment, OS output and baseline failure logs are in [this artifact directory](./). Earlier pilots and the two preliminary reset-window pairs remain separate and are not counted in this three-pair series.
