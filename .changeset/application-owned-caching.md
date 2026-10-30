---
'@nocobase/caching': minor
'@nocobase/app-server': patch
---

Make cache driver registration application-scoped and validate the selected default after all server providers register. Unused configurations for unavailable drivers no longer prevent Memory applications from starting; explicitly selecting an unavailable driver still fails without fallback.

Breaking change: replace global `registerCachingDriver()` and `getCachingDriver()` usage with registration on the application's `Caching` instance. Register backend drivers during the server Provider's `register()` phase and retain the original host `cachingToken`. See the caching package README for migration examples.

Export the reusable `ManagedCacheProvider` lifecycle decorator and the positive safe-millisecond TTL parser for backend authors, without requiring internal imports.

Close cached capability handles to new work while draining admitted loaders, retain failed cleanup for explicit retry, round positive fractional TTLs up to safe integer milliseconds, and reject non-finite Memory counter results before mutation. Memory's supported value types are unchanged.

Stop owned Memory expiration timers and release their local contents during cleanup, retaining only failed resources for an explicit retry.
