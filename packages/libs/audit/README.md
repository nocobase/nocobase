# NocoBase Audit

`@nocobase/audit` provides request auditing, route declarations, and event delivery. The application supplies this package as a production dependency. The official application templates include its provider and the built-in `file` driver. An application assembled separately with `@nocobase/app-server` can add `AuditProvider` from `@nocobase/audit/runtime` with `app.addServiceProvider(AuditProvider)` in its server composition root. Add it after the other providers and runtime contributions so its transports close before the services they use. Register `defineAuditConfig()` from `@nocobase/audit` in the application config factories. Plugins that import its route declarations or service token declare a peer dependency on `@nocobase/audit`.

## Configuration

Add the `audit` section to the application's `config.yaml`:

```yaml
audit:
  transports:
    localFile:
      driver: file
      options:
        path: logs/audit.jsonl
```

With at least one destination, `audit.enabled` defaults to `true` and the app records explicitly declared operations. `audit.enabled: false` disables collection and delivery. `audit.autoDetect` defaults to `false`. Enable it to also record documented POST, PATCH, PUT, and DELETE operations that have an operation ID and are visible in the API document. An explicit `describeAudit(false)` excludes a route. A dynamic declaration that returns `undefined` leaves the route eligible for automatic detection. The audit provider reads generated Repository endpoint metadata before guards, records mutations, and excludes queries.

Relative file paths resolve under application storage. Absolute paths are supported. The driver creates directories with mode `0700` and opens files with mode `0600` on POSIX, subject to the process umask. Destinations that share a local file serialize appends within one process. Each file must have a single writer process. Complete records are written as JSON Lines and the file handle closes after each append. Use your deployment's log management for file rotation and retention.

Audit uses `auth.advanced.ipAddress.trustedProxies` and `auth.advanced.ipAddress.ipAddressHeaders`. For a trusted socket peer, it tries the configured headers in order, defaulting to `X-Forwarded-For`, and walks each chain from right to left to its first untrusted address. Invalid proxy entries are skipped with a startup warning. An untrusted peer, an empty allowlist, or a chain with no usable client address results in the socket peer address.

## Routes and transports

Audit events store the operation's declared name or its English default, with API summary and action as fallbacks. The name is independent of the request language. JSON Lines contains the event as recorded, including any `operationNameI18n` namespace and key.

The official templates contribute the lazy loader from `@nocobase/audit/locales` as a locales-only entry in their client plugin list. Custom applications can add the same entry with `defineClientPlugin({ packageName: '@nocobase/audit', locales: auditLocales })()` before client initialization. Installed business plugins provide their labels through their own locale contributions. Resolve `operationNameI18n` in the viewer's language, falling back to the stored `operationName`, then `action` for older events. The audit provider also registers the Repository labels on the server for localized exports.

Import `describeAudit` from `@nocobase/audit` and declare it alongside the route. Set an action, resource, and optional operation name for display. Use `target` for identifiers available before guards and `resolveTargets` for identifiers derived from a successful handler result. Use `captureBody: false` to omit both snapshots and `redact` to mask additional fields with `{ field: 'name' }` or paths with `{ path: 'parent.name' }`. The built-in credential masking and snapshot limits always apply.

In a service provider's `register` or `boot`, resolve `auditServiceToken` and register the transport with `registerDriver({ name, createTransport })`. Configure each named destination under `audit.transports` with its driver and driver-specific options. The synchronous factory receives the options and `{ name, paths }`, with the application storage directory available as `paths.storageDir`. The transport implements `write(event, { signal })` and can implement `close()` to release resources. The application validates active destination names, drivers, and factory options at startup. The commercial audit plugin supplies the `database` driver, which can be configured alongside `file`.

The coordinator delivers independent copies of the sanitized event in parallel. It bounds pending writes, signals timeouts through `AbortSignal`, and invokes transport cleanup as part of shutdown. A transport failure leaves the HTTP response intact. Audit records the HTTP outcome after the handler runs, independently of the business transaction. A process failure can lose an event awaiting delivery.
