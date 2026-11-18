# Deployment control and archive isolation

Managed deployments remain serial per Host. Cancellation bypasses that queue: queued operations are removed immediately, and running operations stop after the current download, verification, extraction or preparation step. The final checkpoint closes cancellation before application replacement starts. Once switching starts, the actual success or failure is reported. Cancellation waits for archive workers to exit before removing staging files; installed cache entries and the running revision are preserved.

The release service replaces older queued deployments only after the replacement has passed authorization, release/configuration/variable validation and persistence. The Host makes the queued-only decision, so an operation that started while its queued event was being persisted stays running. A replacement never requests cancellation of a running operation. The deployment and any approval request settle as cancelled, with a separate cancellation event; there is no additional deployment option.

## Protocol and cost

`HostManagementService.cancelDeployment(operationId, appId, { scope, queuedOnly })` returns `cancelled`, `cancelling`, `tooLate` or `notFound`. Admission is cancellable while scope binding or operation recording is pending. `deploymentProgress` returns transient state, queueAhead and whether cancellation is still open. Scope and App identity must match. Existing IPC transports both methods independently from the serial work queue. Archive workers perform SHA-256 validation and safe tar extraction, run at reduced scheduling priority where supported, and are limited to one worker per Host, including on-demand materialization. They disconnect on completion and exit if their Host disappears.

Queue changes emit at most one log event per queued operation, with structured queueAhead and operation/deployment identity. They do not write queue positions to the database. A detail poll retains three service reads (App, deployment, release) and adds one Host IPC request only for an active deployment; authentication and permission resolution are unchanged. The existing App summary poll reads the pending status in its existing pending-deployment query, with no new query or timer. Each visible pending App tab refreshes its deployment list once per existing 1.5-second summary poll: two HTTP requests per poll instead of one. Stable and hidden tabs retain their existing polling policy. No runner claim, heartbeat, sweeper, database schema or migration changes.

Each deployment reserves one local result slot using the existing per-App promise-lock mechanism before runtime submission. The Host can execute its successor while prior phase writes or SQL are delayed, but predecessor reads, terminal writes, configuration cleanup and success/failure events complete in submission order. The predecessor ID is saved in the existing terminal transaction; queued cancellations settle immediately and leave a no-op slot so later successes still follow the running predecessor. Startup finalization processes recorded outcomes in creation order and reads the committed predecessor. No new persistent state, protocol, poll request or transaction is introduced; the old preliminary predecessor read is removed.

Creation adds one same-App queued-deployment query and cancellation work only for matching obsolete records. Cancellation adds record/permission reads, an optional Host control request and a transaction settling the deployment and its approved request; running cancellation adds one intent update first. Phase writes are deduplicated, and queued position events add zero writes. The deployment-control and summary-refresh tests bound detail query count and requests per poll.

## Resource-limited production-artifact comparison

With the real framework archive under sustained application load, parent CPU time fell about 37% and cold end-to-end time fell about 5%. Upload metadata scanning remains in the parent and still produces roughly 0.6-second request-latency spikes; it needs a separate change. The method and baseline variation below bound those observations.

The production archive is built with `pnpm --filter @nocobase/app-template-default build --tar` on Linux x64, Node v24.22.2 (ABI 137). It is the actual framework default application, including its production dependencies, client, authentication, authorization, user APIs and SQLite migrations: 84,616,956 compressed bytes (80.70 MiB), 34,568 archive entries, 21,843 regular files and 286,525,036 regular-file bytes. SHA-256: `892dac76a7075b7a9222077cbd4edc448a2f30ab9e0099265e419039f3a39d91`. The archive contains no runtime configuration or business database.

The independent local Host serves this production application as `main` while deploying the identical archive as `preview`. A separate Node process sends an open-loop 200 requests/second, cycling through the declared authenticated GET endpoints `/api/users`, `/api/users/me/preferences`, `/api/authorization/permissions` and `/api/auth/get-session`. It signs in through the application's native email/password API using a newly seeded local administrator. The generator caps concurrent requests at 32 and counts skipped arrivals; it does not silently turn overload into a lower configured request rate. No management-instance authentication or data is used.

Each fresh Host, its application load generator and its archive workers share a cgroup with `CPUQuota=200%`, `MemoryMax=3G` and `MemorySwapMax=0`, and inherit CPU affinity `0,1`. Recorded `cpu.max` is `200000 100000`, `memory.max` is `3221225472`, and `memory.swap.max` is `0`; every scope records zero OOM kills. Start a scope using `XDG_RUNTIME_DIR=/run/user/1000 systemd-run --user --scope -p CPUQuota=200% -p MemoryMax=3G -p MemorySwapMax=0 taskset -c 0,1 <benchmark command>`. This constrains two logical CPUs and 3 GiB for the whole group, including filesystem cache, rather than just setting a V8 heap limit.

The control-plane harness uses the real release service, migrations, local artifact drive, HTTP upload route and Host driver, connected directly to that independent Host. Uploads authenticate with the plugin's native one-use upload tickets. The harness supplies the permission port for its synthetic administrator; it does not benchmark a full Studio permission deployment. Deployment admission calls the same release service used by the HTTP deployment route. The end-to-end interval starts before upload-ticket creation and includes the HTTP upload, admission, runtime operation, database settlement, event publication and a successful native preview `/api/healthz` response. It excludes a remote network transfer and the browser UI.

The only execution-path difference between the two cases is the archive resolver: the implementation at `3681eb091e` versus the isolated resolver, with the same current Host and instrumented release-service pipeline. Temporary copies add timing wrappers around the unchanged upload receive/metadata functions; no production module or installed dependency is edited. Both cases include upload hashing and metadata scanning, so those remaining parent-process costs appear separately. Scripts and raw measurements stay outside the repository.

Three cold/warm pairs per case run in the order before/after, after/before, before/after, in fresh Host processes. Each pair has a two-second load warmup, a five-second baseline, a cold deployment, an immediate warm deployment and three seconds of post-load. “Cold” means an empty expanded-revision directory and a new preview database; “warm” reuses the exact checksum and preview database. Both upload the same archive again; checksum deduplication avoids a second artifact-store write. The operating-system page cache is not flushed. Only one deployment runs at a time.

### Stages and main-application response

Values are medians of three samples per column, in milliseconds unless stated otherwise. Resolver diagnostics distinguish local archive read/verification, expansion and entry discovery. Structured events time queueing and switch/start; the final interval includes revision commit, SQL settlement, events and the explicit preview health request. Individual medians and nested sub-stages do not sum to the end-to-end median.

| Stage / measurement                          | Previous cold | Isolated cold | Previous warm | Isolated warm |
| -------------------------------------------- | ------------: | ------------: | ------------: | ------------: |
| HTTP upload, including nested stages         |         3,714 |         3,107 |         3,683 |         3,713 |
| ↳ receive, spool and hash                    |         1,752 |         1,376 |         2,249 |         2,214 |
| ↳ metadata scan                              |         1,468 |         1,375 |         1,348 |         1,421 |
| ↳ artifact-store write                       |           346 |           257 |             0 |             0 |
| Deployment admission                         |           127 |            86 |            62 |            68 |
| Host queue                                   |             1 |             0 |             0 |             0 |
| Local archive read and checksum              |           411 |           151 |             0 |             0 |
| Archive expansion                            |        27,984 |        25,672 |             0 |             0 |
| Entry discovery                              |            59 |            42 |             0 |             0 |
| Resolver total / cache lookup                |        28,378 |        25,877 |             6 |             7 |
| Configuration preparation                    |             3 |             4 |            24 |            21 |
| Switch and native application start          |         3,066 |         3,070 |           347 |           334 |
| Revision commit, result and health           |           125 |           102 |            74 |            74 |
| End to end                                   |        34,523 |        32,802 |         4,273 |         4,273 |
| Parent CPU, including application load       |        36,597 |        22,906 |         5,780 |         5,802 |
| Archive children CPU                         |             0 |        14,439 |             0 |             0 |
| Parent peak RSS, MiB                         |         1,016 |           872 |         1,119 |           960 |
| Largest archive child peak RSS, MiB          |             0 |           481 |             0 |             0 |
| Main application HTTP p95, end-to-end window |         69.71 |         48.04 |        371.06 |        349.86 |
| Main application HTTP p95, expansion window  |         10.04 |          6.82 |             — |             — |

Cold end-to-end time decreased about 5%, and parent CPU time decreased about 37%. The new archive children used a median 14.44 CPU seconds (checksum and expansion combined); the median sum of parent and child CPU per cold run was 37.35 seconds versus 36.60 seconds before. CPU work is relocated, not eliminated. Warm deployment time remained 4.27 seconds, and no archive worker started for a warm revision.

During expansion, main-application p95 was 10.04 → 6.82 ms and the median maximum response was 363 → 84 ms. Across the entire cold upload/deploy interval, p95 was 69.71 → 48.04 ms. All completed probes returned HTTP 200. Whole-pair skipped arrivals were 860/754/779 before and 722/743/727 after; these overload admissions must be considered alongside response latency. Warm end-to-end p95 remained 371 → 350 ms because upload work is still in the parent.

The shared machine has baseline variation: before/after baseline p95 was 94.23/56.57, 4.23/4.53 and 72.05/4.24 ms for the three pairs. The middle pair has closely matched baselines; its cold end-to-end p95 was 65.44 → 48.74 ms and expansion p95 was 10.04 → 6.82 ms. The other baseline differences limit a precise causal latency claim. These are observations for this real framework application with one administrator and SQLite, rather than a production Studio latency guarantee or a throughput SLO.

### Parent and child memory and I/O

Parent RSS is sampled every 10 ms, with start/end RSS included. Each archive child writes `process.cpuUsage()`, `process.resourceUsage()` and `/proc/self/io` synchronously at exit, before the Host reports worker closure. The extraction child's peak RSS was about 481 MiB; the checksum child's peak was about 237 MiB. Median cgroup peak usage, including parent, generator, workers and page cache, was 1,659 → 1,626 MiB. The largest observed group peak was 1,718 MiB, below the 3 GiB limit. Child isolation still consumes machine resources.

Linux `/proc/<pid>/io` includes waited-for children. The raw results preserve that parent total and each child's counters; the table below subtracts the measured, completed archive children for a direct-parent estimate. Logical `rchar`/`wchar` include application responses and local upload client/server traffic. Physical `read_bytes` was zero with the warm OS page cache; `write_bytes` reflects dirty pages and block rounding, not durable storage latency.

Median cold-deployment MiB:

| I/O counter    | Previous parent | Isolated parent estimate | Isolated archive children |
| -------------- | --------------: | -----------------------: | ------------------------: |
| Logical read   |           533.8 |                    367.7 |                     166.3 |
| Logical write  |           528.2 |                    250.2 |                     277.9 |
| Physical read  |             0.0 |                      0.0 |                       0.0 |
| Physical write |           499.0 |                    166.6 |                     332.5 |

### Remaining upload cost

Metadata inspection still parses the complete compressed stream in the release process, selecting only manifests, variables and configuration metadata for extraction. Median scan time was 1.47 → 1.38 seconds in cold runs and 1.35 → 1.42 seconds in warm runs. Parent CPU during the scan, including concurrent application requests, was approximately 2.0–2.1 CPU seconds in all cases. Requests starting in that stage had median per-run p95 of 578 → 638 ms cold and 674 → 628 ms warm. A cached expanded revision therefore does not make uploading the same archive cheap.

The separate receive/spool/hash stage cost 1.75 → 1.38 seconds cold and 2.25 → 2.21 seconds warm. These stages explain the remaining latency spikes, including end-to-end maximums around 1.3 seconds despite lower expansion stalls. Move upload metadata processing out of the serving process in a separate change; keep streamed upload hashing in that investigation as well. This evidence identifies a measurable remaining archive hot path, while sustained production CPU still needs its own workload profile.

## CPU evidence and remaining work

Two 2-second V8 CPU profiles sampled an otherwise idle managed Host, first empty and then with 13 minimal applications active and a one-second eviction sweep. Both were dominated by idle samples (over 99%); CPU was approximately 4% with profiling enabled and RSS about 163 MiB. The Host alone with minimal applications did not reproduce sustained 180% idle CPU.

Determining production's sustained CPU requires profiles with its actual Studio and preview workload, garbage-collection data, event-loop delay, open application count, I/O and swap pressure. In particular, release-upload metadata inspection still streams/parses archives in the release service, and application background work shares an in-process Host; these measurements do not assign either as the cause of sustained production CPU. Record a separate workload-profiling task before changing those paths.

Keep single-deployment execution. Two simultaneous extractions would increase machine CPU, I/O and memory pressure, and application switching/cleanup still relies on serialization. The resource-limited single-deployment comparison above establishes an isolation baseline; measuring two simultaneous deployments remains a separate experiment. Queued operations interrupted by a restart are not automatically replayed: the existing recovery records the outcome when available and otherwise explicitly asks for redeployment. Replaying configuration, registry credentials and approvals is separate work.
