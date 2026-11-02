---
'@nocobase/concurrency': minor
'@nocobase/app-plugin-concurrency': minor
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-skills': patch
---

Provide business concurrency interfaces with shared errors and application-owned native Mutex instances. Support unbounded ordinary acquisition, native single and bounded attempts, acquisition-only cancellation, optional renewable lease durations accepted and ignored by local Mutex, no-argument Executors, strict named configuration and public managed-instance extension tools. Keep business results independent of automatic cleanup failures and actively release confirmed occupancy during application-owned shutdown.

Expose managed-instance contracts and tools through the single Server entry, with the built-in Mutex implementation organized under its own internal directory.

Keep local Lock and Executor ownership until explicit release, actual runner settlement or instance shutdown. Managed lease tools do not own TTL timers or renewal; preserve public duration validation and native bounded acquisition. Separate confirmed Lease registration from per-request acquisition observation, track in-flight completions in the owning instance, and keep Mutex adaptation private without changing business APIs.
