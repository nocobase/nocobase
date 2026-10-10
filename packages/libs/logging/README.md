# Logging

Application and plugin code resolves `loggingToken` from `@nocobase/app-server/logging` and calls `getLogger(source)`. The source is recorded as `logger`; it does not select a separate file automatically. `getLogger()` uses the `system` source. No `default` setting is needed. The default file stem is `app`, not the default source name.

```yaml
logging:
  level: info
  file:
    enabled: true
    name: app
    retentionDays: 7
    maxFileSizeMB: 10
    maxTotalSizeMB: 500
  console:
    enabled: true
    pretty: false
    # Colored level labels are for a terminal; NO_COLOR disables and FORCE_COLOR requests them.
    color: false
  loggers:
    request:
      file:
        name: request
    scheduler:
      level: debug
      file:
        name: scheduler
```

Without `loggers`, every source shares `app.<UTC-date>.<part>.log`. The example routes request and scheduler records only to their own files, without also copying them to app. Two sources using the same file name share rotation state within the process. Files contain JSON Lines regardless of terminal formatting. Applications force the directory to their persistent `storage/logs/`; library-only callers supply `file.directory`. Standalone `createLogging()` without output settings retains Pino stdout behavior.

`file.enabled: false` disables all file output; a source cannot re-enable it. Outside a Host capture policy, a source can disable its own file output without changing console output. Source file overrides accept only `enabled` and `name`; directories and retention budgets always come from the shared file policy. Source levels override the general level. Hosted applications obey the Host level, output policy, persistent directory, and identity bindings, including when an App or source sets `enabled: false`. Their custom transports cannot bypass that policy. Outside that boundary, an explicit Pino transport owns its destinations and reports a warning when built-in file or console settings are ignored.

Rotation happens at UTC date boundaries and before a record exceeds the configured segment size. A single record may exceed a very small segment size; records are capped at 32 KiB. Retention and the total size budget cover all `.log` files in the directory, including separately routed sources. Cleanup runs on writes/rotation and shutdown waits for pending cleanup. It protects the most recently written file; an individual protected file may exceed a smaller retention budget. Use one process to own each App log directory. Multiple processes do not coordinate their rotation state.

File capture is independent of `console.enabled` and `console.pretty`. Templates enable both outputs and use pretty terminal output in development, JSON in production; YAML can override this. Files always remain structured. Oversized records retain source and correlation identities and bounded error message, stack, and cause before discarding optional payloads. Errors preserve message, stack and cause; sensitive fields and common credential patterns are redacted. Do not intentionally log secrets. Logging I/O failures report once to stderr instead of recursively logging or failing the business operation.

Application templates configure the `request` source with `file.name: request` by default, separating HTTP request logs from the shared app file.

Pretty console output uses local time, readable levels and `[appId/logger]` identity, with duration and additional fields rendered inline. Level labels are green for INFO, yellow for WARN and red for ERROR when the console is a terminal: `console.color` wins when set, otherwise `FORCE_COLOR` requests the escapes, `NO_COLOR` disables them with the precedence Node itself uses, and piped or captured output stays plain. A managed App Host child inherits a pipe, so the supervisor asks for `FORCE_COLOR` on its behalf when the environment states no preference. Structured console output, journals and files never contain escapes. Successful request completions omit repeated request fields and correlation identifiers from the terminal; JSON output and files retain them. Request starts and their input headers use DEBUG, while failed completion records include the selected request headers and query even at INFO. Configuration loading and AI registration stages also use DEBUG. Set `logging.level: debug` (or `hub.logging.apps.level` for hosted applications) when investigating those details.

## Compatibility

New configuration omits `default`, top-level `pretty`, and `file.maxSizeMB`. Legacy `default` still chooses the no-argument logger source, with a warning. Legacy `pretty` is the terminal fallback when `console` is absent. Migrate it to `console.enabled` and `console.pretty`. Legacy runtime `maxSizeMB` means total retained size; migrate it to `file.maxTotalSizeMB`. Legacy aliases take precedence over merged new defaults until removed, with a warning, so old limits remain effective. Legacy Host App policies using flat `enabled`, `retentionDays`, and `maxSizeMB` migrate into `file`. Deployment `maxSizeMB` historically limits one deployment journal and migrates to `maxFileSizeMB`, not total size. Keep only the new spelling after migration.

Existing log files are not renamed or rewritten and remain readable until retention removes them. Application composition roots use `createAppFromRuntime(runtime)` to transfer the Host logging policy into `Application.runtimeLogging`; older deployed artifacts must be upgraded to honor the Host policy. Deployment journals retain their separate storage role.

## Incremental reading

`readJournal` merges append-ordered source files by timestamp across pages, scanning at most 256 KiB and returning at most approximately 256 KiB per call. A scan can return an empty page with `hasMore: true` while finding the next record across sources; continue with its cursor. Equal timestamps use the file identity and byte offset as a deterministic tie-breaker. Entries appended later with older timestamps can still arrive during following; viewers should merge by time and `logId`.

Cursors are short opaque identifiers scoped to the directory, file, and filters. Immutable checkpoints support retries and expire after five minutes; the process keeps at most 128 checkpoints and 64 MiB of checkpoint data. A restart, expiry, or eviction restarts the requested scan with `reset: true`. Viewers replace their window on reset, and exports must fail and ask for a retry instead of silently concatenating restarted history. Multiple Hub processes need requests for one scan routed to the same process.
