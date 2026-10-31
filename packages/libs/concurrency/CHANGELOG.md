# @nocobase/concurrency

## 0.1.0-beta.1

### Minor Changes

- 5e32117: Provide business concurrency interfaces with shared errors and application-owned native Mutex instances. Support unbounded ordinary acquisition, native single and bounded attempts, acquisition-only cancellation, optional renewable lease durations accepted and ignored by local Mutex, no-argument Executors, strict named configuration and public managed-instance extension tools. Keep business results independent of automatic cleanup failures and actively release confirmed occupancy during application-owned shutdown.

  Expose managed-instance contracts and tools through the single Server entry, with the built-in Mutex implementation organized under its own internal directory.

  Keep local Lock and Executor ownership until explicit release, actual runner settlement or instance shutdown. Managed lease tools do not own TTL timers or renewal; preserve public duration validation and native bounded acquisition. Separate confirmed Lease registration from per-request acquisition observation, track in-flight completions in the owning instance, and keep Mutex adaptation private without changing business APIs.

## 0.0.2-beta.0

### Patch Changes

- 7ab80a0: Add fixed-TTL concurrency contracts, shared execution lifecycle and public backend testing tools.
- 7ab80a0: Recheck monotonic deadlines before cancelling bounded waits and return a normal miss when the wait budget expires before any backend acquisition starts.
- 7ab80a0: Abort and settle backend waits safely when acquisition deadline monitoring fails, retaining the fault and cleaning any confirmed grant.
- 7ab80a0: Rearm early lease timers and ignore callbacks cancelled by release so conservative expiry notifications remain reliable.
- 7ab80a0: Release executor leases even when final lease checks fail, preserve independent business errors, and reject leases lost during monitoring startup before delivery.
- 7ab80a0: Restore ordinary lock and executor acquisition without an overall waiting deadline, reserve timeouts for try methods, and require the initial backend protocol v1 with explicit unbounded waits.
- 7ab80a0: Give each runtime exclusive ownership of its backend and close it automatically after draining work, without a shared session layer.
- 7ab80a0: Expose only implemented fixed-TTL lock and executor APIs, removing semaphore placeholders, automatic-renewal options and capability negotiation.
- 7ab80a0: Capture each acquisition call’s cancellation signal once so later options changes cannot misclassify cancellation or leak abort listeners.
- 7ab80a0: Retain and clean confirmed grants when lease monitoring cannot start, and recheck monotonic close deadlines before reporting timeout.

## 0.0.1

Initial fixed-TTL concurrency core.
