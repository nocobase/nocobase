# Formal paired measurements

The complete measurement set contains three independent process pairs in AB, BA, AB order. Each process performs the same initial import, warm-up, five resets, integrity checks and final cleanup. All three pairs are complete. Each pair ran only after its coordinated shared-host window was released; no extra pair or round was selected or discarded.

Measured changed implementation: `7cc61197c940070fedbebeb53e83d7ba92215b9d`; base: `8f3e54db4f50146fd8b0376c603d09b486058249`. Production, fixture, harness and lockfile SHA-256 values are recorded in each `.environment.json`. The source overlay is restored between processes and after each pair. Ordinary checks are outside the resource lock.

Each `.json` is the application worker's schema-v2 report. `maxRssThroughWorkloadKiB` stops before application close, while `maxRssThroughAppCloseKiB` is explicitly observed after `await app.close()` (or its failure). Neither claims worker-exit coverage. `.environment.json` records the external whole-command and descendants high-water value as `commandMaxRssBytes`, plus the actual measured command and environment; `.time.txt` preserves its raw OS output. Application PID and close/workload status are explicit. `.log` contains raw Vitest output and `.invocation.log` contains the wrapper's budget result.

The baseline completes all business and session assertions, all five resets and final cleanup, but exits nonzero for the fixed RSS budget. The comparison does not accept a new budget. Abnormal signals, incomplete workload/close, missing metrics and deadline failures are rejected separately from an expected baseline budget violation.

Recompute the summary without running any benchmark:

```bash
python3 packages/plugins/app-plugin-demo-mode/docs/resource-results/formal/summarize.py
# Or pass a new directory containing the six pair-*.json reports and their environment files.
```

[summary.json](summary.json) preserves unrounded derived values; [summary.md](summary.md) contains the rounded tables and scope notes. The script validates complete rounds, expected exit states, matching fingerprints/environment, and command-level RSS coverage before summarizing. It does not change any resource budget.
