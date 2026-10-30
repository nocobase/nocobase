# @nocobase/app-plugin-concurrency

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
