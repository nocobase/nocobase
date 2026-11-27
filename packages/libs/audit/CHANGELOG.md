# @nocobase/audit

## 0.1.0-beta.0

### Minor Changes

- 52d0b0d: Configure audit capture for application operations and send events to multiple named destinations, including JSON Lines files. Configuring a destination enables explicitly declared audit operations by default. Audit uses the application authentication settings for its trusted proxies and forwarded IP headers.

  The official templates assemble auditing with `AuditProvider` and ship the file driver. Custom application composition roots can add the provider and the audit configuration factory when they use audit routes or transports. Applications using only `@nocobase/app-server` can start without the audit package.

  Built-in audit operations store English default names and translation keys. The official templates load Repository labels in the viewer's language, and JSON Lines keeps the original event names. Separate labels identify assigning and removing permission sets and enabling and disabling users and keys.

### Patch Changes

- Updated dependencies [cc0bf33]
- Updated dependencies [4561d5f]
- Updated dependencies [52d0b0d]
  - @nocobase/app-server@5.0.0-beta.12
  - @nocobase/secrets@0.1.0-beta.2

## 0.0.1

### Minor Changes

- Collect declared audit events, redact sensitive fields, and route events to configured destinations, including built-in JSON Lines files.
