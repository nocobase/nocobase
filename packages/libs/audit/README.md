# NocoBase Audit

`@nocobase/audit` provides request auditing, route declarations, and event delivery. The application supplies this package as a production dependency. The official application templates include its provider and the built-in `file` driver. An application assembled separately with `@nocobase/app-server` can add `AuditProvider` from `@nocobase/audit/runtime` with `app.addServiceProvider(AuditProvider)` in its server composition root. Add it after the other providers and runtime contributions so its transports close before the services they use. Register `defineAuditConfig()` from `@nocobase/audit` in the application config factories. Plugins that import its route declarations or service token declare a peer dependency on `@nocobase/audit`.

## Configuration

Add the `audit` section to the application's `config.yml`:

```yaml
audit:
  captureBody: false
  redact:
    fields:
      - identityNumber
    paths:
      - profile.mobile
  transports:
    localFile:
      driver: file
      options:
        path: logs/audit.jsonl
        maxFileSizeMB: 50
        retentionDays: 180
```

An application without destinations collects no audit events. With at least one destination, `audit.enabled` defaults to `true` and the app records explicitly declared operations. `audit.enabled: false` disables collection and delivery. `audit.autoDetect` defaults to `false`. Enable it to also record documented POST, PATCH, PUT, and DELETE operations that have an operation ID and are visible in the API document. An explicit `describeAudit(false)` excludes a route. A dynamic declaration that returns `undefined` leaves the route eligible for automatic detection. The audit provider reads generated Repository endpoint metadata before guards, records mutations, and excludes queries.

The app validates capture settings at startup. Restart it after changing them. Body capture requires an explicit `true` on the application or the route. An explicit `false` at either level always takes precedence. Leave both settings unset to collect events without request or response bodies. With body capture off, audit does not clone, read, or parse the bodies.

Use `redact: { fields: ['identityNumber'], paths: ['profile.mobile'] }` in app configuration or a route declaration. Fields match the exact name at any depth. Paths match from the root of each snapshot or structured target key. A named segment crosses array elements, as in `members.mobile`. An index such as `members.0.mobile` matches one position. Built-in credential masking and all additional rules apply before dispatch.

Audit uses `auth.advanced.ipAddress.trustedProxies` and `auth.advanced.ipAddress.ipAddressHeaders`. For a trusted socket peer, it tries the configured headers in order, defaulting to `X-Forwarded-For`, and walks each chain from right to left to its first untrusted address. Invalid proxy entries are skipped with a startup warning. An untrusted peer, an empty allowlist, or a chain with no usable client address results in the socket peer address.

### Rolling file output

The `path` sets a filename prefix. Use a `.jsonl` basename with letters, digits, underscores or hyphens before the extension. Relative paths must stay under application storage after resolving directory symlinks. Absolute paths are supported. The driver creates directories with mode `0700` and files with mode `0600` on POSIX, subject to the process umask. Use a private log directory owned exclusively by the application. Keep its parent paths out of the control of untrusted users and run the application with least privilege.

`rotating-file-stream` 4.0.0 appends JSON Lines and rolls segments by UTC date and size, independently of application logging. For `logs/audit.jsonl`, the first segment on November 26 UTC is `logs/audit.2026-11-26.000000.jsonl`. At startup the stream only considers the highest number for that date. A full segment advances the number. An incomplete tail triggers a warning and the next number, leaving the damaged segment in place until its retention period expires. Lower numbers stay archived on subsequent restarts. `maxFileSizeMB` defaults to 50 (50 × 1,048,576 bytes). A record that reaches or exceeds the limit stays whole in the current segment, and the stream then opens the next segment. Size and midnight rotation can leave an empty segment, even while the application is idle.

The library provides retention by count or total size. Audit uses the file's last modification time to keep each archive for at least `retentionDays`, which defaults to 180 days of 24 hours. Both options accept positive finite numbers. Cleanup runs in the background on startup and after rotation, including idle midnight rotation. It only removes expired, private regular files whose names match the target's prefix and segment format. It skips the current UTC day's segments, active files, links, other targets, and the legacy unsegmented file. Cleanup may occur after the retention threshold. Point readers at the new segmented names after upgrading. Configure each output path for one writer process. Destinations in that process that resolve to the same prefix share a stream and use the longest retention and smallest size limit registered while the output is open.

The library opens the path for append before audit checks that it is a regular file with one hard link and private POSIX permissions. This check is weaker than `O_NOFOLLOW`. For example, a symlink can cause the open to create an empty file outside the directory. The stream keeps its file handle open between writes. The directory and its parent paths must stay under trusted control while the handle is open.

Each shared stream takes one record at a time. A write settles after the stream callback and a byte-length check. The library hands bytes to the operating system without a disk sync. A failed or short write can leave an incomplete tail. Audit reports the failure, closes the stream, and recovers on a later write without replaying the failed record. The library can surface an idle rotation failure on the next write or during shutdown. The coordinator allows up to 64 pending writes per destination and uses a one-second delivery and shutdown deadline. Cancellation skips queued writes before submission. A submitted filesystem operation can finish after its deadline. Shutdown asks the stream to finish and waits for the handle and scheduled cleanup within the coordinator's deadline.

## Routes and transports

Audit events store the operation's declared name or its English default, with API summary and action as fallbacks. The name is independent of the request language. JSON Lines contains the event as recorded, including any `operationNameI18n` namespace and key.

The official templates contribute the lazy loader from `@nocobase/audit/locales` as a locales-only entry in their client plugin list. Custom applications can add the same entry with `defineClientPlugin({ packageName: '@nocobase/audit', locales: auditLocales })()` before client initialization. Installed business plugins provide their labels through their own locale contributions. Resolve `operationNameI18n` in the viewer's language, falling back to the stored `operationName`, then `action` for older events. The audit provider also registers the Repository labels on the server for localized exports.

Import `describeAudit` from `@nocobase/audit` and declare it alongside the route. Set an action, resource, and optional operation name for display. Use `target(context)` for identifiers available before guards and `resolveTargets(result, context)` for identifiers derived from a successful handler result. With body capture off, the resolver still receives the context and any in-process `value` the handler provides. Its `request` and `response` are then `undefined`. Even with capture on, content type or read and size bounds can make a JSON body unavailable. Use `auditRecordKey` to read optional values and return `undefined` when the target is unknown. Resolver errors leave the event with the pre-handler target, if available.

```ts
import { auditRecordKey, describeAudit } from '@nocobase/audit';

const auditCustomerCreation = describeAudit({
  action: 'customer.create',
  captureBody: true,
  redact: { fields: ['identityNumber'], paths: ['profile.mobile'] },
  resolveTargets: ({ response }) => {
    const id = auditRecordKey(response, 'data', 'id');
    return id === undefined ? undefined : { collection: 'customers', key: id };
  },
});
```

With the YAML example above, the application's `captureBody: false` keeps this route's bodies unavailable, and the resolver returns no target.

In a service provider's `register` or `boot`, resolve `auditServiceToken` and register the transport with `registerDriver({ name, createTransport })`. Configure each named destination under `audit.transports` with its driver and driver-specific options. The synchronous factory receives the options and `{ name, paths }`, with the application storage directory available as `paths.storageDir`. The transport implements `write(event, { signal })` and can implement `close()` to release resources. The application validates active destination names, drivers, and factory options at startup. The commercial audit plugin supplies the `database` driver, which can be configured alongside `file`.

The coordinator delivers independent copies of the sanitized event in parallel. It bounds pending writes, signals timeouts through `AbortSignal`, and invokes transport cleanup as part of shutdown. A transport failure leaves the HTTP response intact. Audit records the HTTP outcome after the handler runs, independently of the business transaction. A process failure can lose an event awaiting delivery.
