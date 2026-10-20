# @nocobase/logging

## 0.1.0-beta.7

### Patch Changes

- cf23bfe: Republish every package so the `latest` dist-tag points at its current beta release, matching `beta`.

## 0.1.0-beta.6

### Minor Changes

- ec92b20: Console log records can go to stderr. `console.stream: 'stderr'` in the logging output options writes them there instead of stdout, and a standalone scope's `consoleLogStream` sets it for an application without touching its logging configuration. The application command line uses this for every application a command creates, so records never mix with a command's `--json` document on stdout. Servers are unaffected: without the option, records go to stdout as before.

## 0.1.0-beta.5

### Minor Changes

- e13ed84: Organize Hub storage by ownership, add explicit managed revision and log directories, retain legacy layouts, and provide an offline migration preview and copy workflow. Keep standalone Hub data outside build output and place template build archives under storage/exports with matching publishing defaults.
- e13ed84: Persist per-deployment phase and failure logs and expose application runtime logs in Hub with scoped access, incremental reading, retention, and independent file and console outputs.

  Unify runtime logging configuration and source routing, merge default outputs into app files, connect workflow diagnostics with execution identities, and preserve legacy configuration and historical log readability.

  Enforce hosted capture policy, declare the Host server runtime peer, merge paged source logs chronologically with bounded opaque cursors, and preserve correlation and error details when truncating oversized records. Handle expired scans explicitly in the Hub viewer and downloads.

  Route HTTP request logs to separate request files by default in all application templates.

### Patch Changes

- e13ed84: Make development logs concise and application-scoped while retaining structured file diagnostics. Route configuration and authentication diagnostics through application logging, reduce routine startup and request noise, distinguish optional AI Skill directories from missing configured paths, and align development console settings across templates. Document that deployed applications need rebuilding to adopt the current logging protocol.
- 00362cf: Restore colored log levels in the development terminal. Replacing the pino-pretty transport with `console.pretty` dropped the ANSI escapes, so INFO, WARN and ERROR lost the colors developers had in v2. Pretty output colors the level label again, using the previous palette, and only when it helps: `console.color` decides when set, otherwise a terminal check applies, `NO_COLOR` disables the escapes, `FORCE_COLOR` requests them, and piped or captured output stays plain. Structured console output, journals and log files still never contain escapes. Applications pass an explicit `logging.console.color` (or `hub.logging.apps.console.color`) through to the logging library. A managed App Host child inherits a pipe and cannot see the terminal its output is relayed to, so the supervisor requests `FORCE_COLOR` for it when the environment states no preference, and captured child output drops terminal escape sequences so the Hub log viewer keeps showing readable text.

## 0.1.0-beta.4

### Patch Changes

- ceb356b: Handle the normal `finish` event when closing logging transport streams so rolling file transports do not hang during shutdown.

## 0.1.0-beta.3

### Minor Changes

- ac3f033: Replace aggregated application configuration objects and config factories with typed module-owned configuration definitions. Applications now compose defaults, file providers, environment layers, validation, explicit reloads, and subscriptions through `AppConfig`, while providers read their configuration through `app.config.get(definition)`.

### Patch Changes

- 948304d: Close logging transport workers during application shutdown to prevent full application test suites and server processes from hanging during cleanup.

## 0.1.0-beta.2

### Minor Changes

- 7cdffbd: Add explicit `server/plugin.ts` definitions for Providers, API routes, root routes, database sources, and queue jobs. Register routes in a dedicated Application phase after Provider boot, add reusable HTTP and runtime composition helpers to their owning packages, and remove the default template's duplicate runtime layer and legacy plugin discovery contract.

### Patch Changes

- ce4eab8: Add a focused ServiceProvider plugin example with a tokenized heartbeat
  service, lifecycle management, and an HTTP status route. Pass the Application
  directly to providers and standardize service access through `app.container`.
- Updated dependencies [b049266]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
- Updated dependencies [ce4eab8]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
- Updated dependencies [7cdffbd]
  - @nocobase/app-server-kit@0.1.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.0

## 0.0.1-beta.1

### Patch Changes

- eb195d0: Roll production log files daily and retain up to seven files by default.

## 0.0.1-beta.0

### Patch Changes

- da1b1b0: 首次发布。
