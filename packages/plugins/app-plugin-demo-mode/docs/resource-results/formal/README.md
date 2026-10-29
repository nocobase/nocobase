# Formal paired measurements

The complete measurement set will contain three independent process pairs in AB, BA, AB order. Each process performs the same initial import, warm-up, five resets, integrity checks and final cleanup. Pair 1 is complete; later pairs are pending the coordinated shared-host resource queue. No final three-pair conclusion is asserted yet.

Measured changed implementation: `7cc61197c940070fedbebeb53e83d7ba92215b9d`; base: `8f3e54db4f50146fd8b0376c603d09b486058249`. Production, fixture, harness and lockfile SHA-256 values are recorded in each `.environment.json`. The source overlay is restored between processes and after each pair. Ordinary checks are outside the resource lock.

Each `.json` is the application worker's schema-v2 report. `maxRssThroughWorkloadKiB` stops before application close, while `maxRssThroughAppCloseKiB` is explicitly observed after `await app.close()` (or its failure). Neither claims worker-exit coverage. `.environment.json` records the external whole-command and descendants high-water value as `commandMaxRssBytes`, plus the actual measured command and environment; `.time.txt` preserves its raw OS output. Application PID and close/workload status are explicit. `.log` contains raw Vitest output and `.invocation.log` contains the wrapper's budget result.

The baseline completes all business and session assertions, all five resets and final cleanup, but exits nonzero for the fixed RSS budget. The comparison does not accept a new budget. Abnormal signals, incomplete workload/close, missing metrics and deadline failures are rejected separately from an expected baseline budget violation.
