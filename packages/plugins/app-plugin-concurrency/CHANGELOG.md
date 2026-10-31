# @nocobase/app-plugin-concurrency

## 0.1.0-beta.1

### Minor Changes

- 5e32117: Provide business concurrency interfaces with shared errors and application-owned native Mutex instances. Support unbounded ordinary acquisition, native single and bounded attempts, acquisition-only cancellation, optional renewable lease durations accepted and ignored by local Mutex, no-argument Executors, strict named configuration and public managed-instance extension tools. Keep business results independent of automatic cleanup failures and actively release confirmed occupancy during application-owned shutdown.

  Expose managed-instance contracts and tools through the single Server entry, with the built-in Mutex implementation organized under its own internal directory.

  Keep local Lock and Executor ownership until explicit release, actual runner settlement or instance shutdown. Managed lease tools do not own TTL timers or renewal; preserve public duration validation and native bounded acquisition. Separate confirmed Lease registration from per-request acquisition observation, track in-flight completions in the owning instance, and keep Mutex adaptation private without changing business APIs.

### Patch Changes

- cf23bfe: Move Redis realtime broadcasting to the commercial Realtime Redis plugin. Register its Server plugin before selecting Redis in an application, or import the standalone broker from its `/broker` entry. Preserve the Memory default, service identity, authorization and recovery protocol, and republish runtime consumers against the new host and realtime major versions. Install the compatible commercial cohort before deploying the final removal.
- Updated dependencies [5e32117]
- Updated dependencies [83f28b1]
- Updated dependencies [cf23bfe]
  - @nocobase/concurrency@0.1.0-beta.1
  - @nocobase/app-server@4.0.0-beta.0

## 0.1.0-beta.0

### Minor Changes

- e4ff32a: Rename the unpublished Mutex adapter to @nocobase/app-plugin-concurrency and add its application-owned service token, Provider, strict named configuration and pure configuration factory. Default and Examples explicitly register the plugin and its in-process Mutex configuration. Install the compatible concurrency core and host peers; the default remains process-local and does not coordinate multiple instances. Server APIs, including deliberate low-level Mutex construction, are exported from /server; configuration uses /config. No library-style package-root export, private implementation subpath, app-server concurrency subpath or old-package alias is provided.

### Patch Changes

- 7ab80a0: Support cancellable unbounded ordinary acquisition with the initial backend protocol v1 while preserving single and bounded try waits.
- 7ab80a0: Use a single-use Mutex backend directly owned and closed by its runtime, retaining retryable cleanup without shared sessions.
- 7ab80a0: Align Local sessions with the complete lock-only backend contract without reserved capability flags.
- 7ab80a0: Settle retry timer failures without uncaught callback exceptions and roll back undelivered resource grants with retryable cleanup.
- 7ab80a0: Add an async-mutex-backed, in-process fixed-TTL concurrency adapter with cancellable ordinary waits and bounded try calls.
- Updated dependencies [7ab80a0]
- Updated dependencies [7ab80a0]
- Updated dependencies [7ab80a0]
- Updated dependencies [7ab80a0]
- Updated dependencies [7ab80a0]
- Updated dependencies [7ab80a0]
- Updated dependencies [7ab80a0]
- Updated dependencies [7ab80a0]
- Updated dependencies [7ab80a0]
- Updated dependencies [7ab80a0]
- Updated dependencies [a0b4568]
- Updated dependencies [5ce4a7c]
- Updated dependencies [b6934ad]
- Updated dependencies [171f7fb]
  - @nocobase/concurrency@0.0.2-beta.0
  - @nocobase/app-server@3.0.0-beta.5

## 0.0.1

Initial local fixed-TTL backend.
