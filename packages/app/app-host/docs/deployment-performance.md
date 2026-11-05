# Deployment control and archive isolation

Managed deployments remain serial per Host. Cancellation bypasses that queue: queued operations are removed immediately, and running operations stop after the current download, verification, extraction or preparation step. The final checkpoint closes cancellation before application replacement starts. Once switching starts, the actual success or failure is reported. Cancellation waits for archive workers to exit before removing staging files; installed cache entries and the running revision are preserved.

The release service replaces older queued deployments only after the replacement has passed authorization, release/configuration/variable validation and persistence. The Host makes the queued-only decision, so an operation that started while its queued event was being persisted stays running. A replacement never requests cancellation of a running operation. The deployment and any approval request settle as cancelled, with a separate cancellation event; there is no additional deployment option.

## Protocol and cost

`HostManagementService.cancelDeployment(operationId, appId, { scope, queuedOnly })` returns `cancelled`, `cancelling`, `tooLate` or `notFound`. Admission is cancellable while scope binding or operation recording is pending. `deploymentProgress` returns transient state, queueAhead and whether cancellation is still open. Scope and App identity must match. Existing IPC transports both methods independently from the serial work queue. Archive workers perform SHA-256 validation and safe tar extraction, run at reduced scheduling priority where supported, and are limited to one worker per Host, including on-demand materialization. They disconnect on completion and exit if their Host disappears.

Queue changes emit at most one log event per queued operation, with structured queueAhead and operation/deployment identity. They do not write queue positions to the database. A detail poll retains three service reads (App, deployment, release) and adds one Host IPC request only for an active deployment; authentication and permission resolution are unchanged. The existing App summary poll reads the pending status in its existing pending-deployment query, with no new query or timer. Each visible pending App tab refreshes its deployment list once per existing 1.5-second summary poll: two HTTP requests per poll instead of one. Stable and hidden tabs retain their existing polling policy. No runner claim, heartbeat, sweeper, database schema or migration changes.

Creation adds one same-App queued-deployment query and cancellation work only for matching obsolete records. Cancellation adds record/permission reads, an optional Host control request and a transaction settling the deployment and its approved request; running cancellation adds one intent update first. Phase writes are deduplicated, and queued position events add zero writes. The deployment-control and summary-refresh tests bound detail query count and requests per poll.

## Same-artifact comparison

The comparison swaps only the archive resolver at base commit `3681eb091e` for the isolated resolver, under the same current Host, registry, volume manager, runtime and measurement harness. This isolates the archive change from queue/API changes. A deterministic fixture contains a minimal HTTP application and 6,000 4-KiB client assets, 6,002 files overall. The compressed archive is 171,528 bytes, SHA-256 `38499a5469faaed6c11ff23003f6c350ec5d7faf1fa5d3150dd9f8e0cf10714d`. Node is v24.22.2, Linux x64, with 6 logical CPUs and 19.5 GiB RAM. This is a local independent test environment, not a production deployment.

Each resolver runs three times against fresh expanded-revision directories and three times with its expanded revision cached. Runs alternate old/new and new/old. Archives remain on local storage; “cold” means an empty expanded revision cache, not a flushed operating-system page cache. A separate already-running application answers HTTP probes every 5 ms while the deployment executes. Archive stage timings come from resolver diagnostic fields, switching/start timings from structured phase events, CPU from process.cpuUsage, and event-loop delay from monitorEventLoopDelay. The temporary harness and CPU profiles stay outside the repository; raw result files accompany the verification record.

Median milliseconds across three runs:

| Stage / measurement                                  | Previous, empty revision cache | Isolated, empty revision cache |
| ---------------------------------------------------- | -----------------------------: | -----------------------------: |
| Queue                                                |                           0.14 |                           0.21 |
| Local archive read and SHA-256                       |    below 1-ms timer resolution |                             66 |
| Extraction                                           |                          1,137 |                          1,276 |
| Manifest/entry discovery                             |                              1 |                              1 |
| Switching and startup                                |                           1.88 |                           1.96 |
| Complete deployment                                  |                       1,142.63 |                       1,349.27 |
| Host process CPU, including HTTP probe client/server |                       1,459.46 |                         254.47 |
| Event-loop p95                                       |                           1.08 |                           1.56 |
| Maximum event-loop delay                             |                          48.53 |                           4.86 |
| Probe HTTP p95                                       |                           0.80 |                           1.03 |

With a cached expanded revision, total time is 3.17 ms versus 4.20 ms; no worker starts. The isolated cold deployment is about 18% slower in this small, unloaded fixture. Its Host CPU time falls by about 83%, and maximum event-loop stalls fall by about 90%. HTTP p95 does not improve in this fixture. Child CPU, filesystem pressure and machine-wide contention still exist; this result demonstrates isolation, not faster end-to-end deployment or a production latency claim. Process RSS grew across interleaved in-process module loads and is not used as a comparative memory result.

## CPU evidence and remaining work

Two 2-second V8 CPU profiles sampled an otherwise idle managed Host, first empty and then with 13 minimal applications active and a one-second eviction sweep. Both were dominated by idle samples (over 99%); CPU was approximately 4% with profiling enabled and RSS about 163 MiB. Archive extraction in the old resolver consumed about 1.46 CPU seconds for a 1.14-second deployment, so it demonstrably consumes Host CPU during deployments. The Host alone with minimal applications did not reproduce sustained 180% idle CPU.

Determining production's sustained CPU requires profiles with its actual Studio and preview workload, garbage-collection data, event-loop delay, open application count, I/O and swap pressure. In particular, release-upload metadata inspection still streams/parses archives in the release service, and application background work shares an in-process Host; this measurement does not assign either as the cause. Record a separate workload-profiling task before changing those paths.

Keep single-deployment execution. Two simultaneous extractions would increase machine CPU, I/O and memory pressure, and application switching/cleanup still relies on serialization. Revisit concurrency only with a resource-limited workload test that measures the main application's p95 and child CPU/RSS/I/O. Queued operations interrupted by a restart are not automatically replayed: the existing recovery records the outcome when available and otherwise explicitly asks for redeployment. Replaying configuration, registry credentials and approvals is separate work.
