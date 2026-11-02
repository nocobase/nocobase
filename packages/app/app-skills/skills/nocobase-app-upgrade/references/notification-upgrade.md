# Notification upgrades

## Decide which changes apply

Use this reference when BASE → TARGET changes notification contracts consumed by the application or its plugins. The `@nocobase/app-plugin-notification` 2.0.0 prerelease line introduces class-based channel registration and removes the TestAdapter protocol. Check the actual resolved BASE and TARGET packages, declarations and release notes; a merged framework PR does not establish which version an application has installed. Apply only changes the application still needs.

Use the compatible package set from the target template and the application's transport plugins, including `@nocobase/app-plugin-notification-in-app`, `@nocobase/app-plugin-notification-providers` and `@nocobase/app-plugin-notification-web-push` when installed. Packages need not share a version number. Inspect `skills/nocobase-app-plugin-notification/SKILL.md` and its configuration, extension and diagnostics references in the exact target notification tarball before installation. After installation and `pnpm nocobase skills sync`, use the synchronized notification Skills; an installed Skill may still describe BASE. Do not edit generated `.agents/skills/` copies to make an older runtime appear upgraded.

Browser toasts are a separate capability. The older removal of `@nocobase/app-plugin-notification-provider` is covered by [Notifications and the application toaster](edge-cases.md#notifications-and-the-application-toaster); it is not the removal of notification transports or the inbox.

## Inventory application-owned consumers

Search application code, custom plugins, test helpers, E2E fixtures and documentation. Start with the old public names and follow their aliases and wrappers:

```bash
rg -n '(NotificationTest|testTargets|testSends|listTestTargets|sendTest|getTestStatus|notification:test|x-nocobase-notification-test|registerChannel(Type)?|registerProvider|notificationExtensionRegistryToken)' . --glob '*.{ts,tsx,js,jsx,mts,cts,mjs,cjs,md}' --glob '!node_modules/**' --glob '!dist/**'
```

Inspect `test` hooks on identified channel and Provider definitions, including class statics. Review configuration defaults, environment mappings and `config.provider` consumers separately without printing live configuration or credentials. Search application-owned permissions and seeds for the old test-send grant; review existing migration files as history, without rewriting them. Include owned plugin repositories outside the application, and record unavailable third-party implementations as an unverified dependency.

Log pages can depend on `listTestTargets()` only to obtain channel labels or Provider identities even when they have no test-send button. Inspect those consumers as well as visible forms; removing the button alone leaves the log page broken.

## Remove the retired testing surface

When the target no longer exports the TestAdapter protocol, remove `NotificationTestAdapter`, related `NotificationTest*` types/errors, built-in form descriptors and extension `test` hooks. Remove application calls to the retired registry/runtime test methods and the client methods `listTestTargets()`, `sendTest()` and `getTestStatus()`.

The retired routes are `GET /api/notifications/testTargets`, `POST /api/notifications/testSends` and `GET /api/notifications/testSends/{notificationId}`. They return 404 in the new core; the `x-nocobase-notification-test` header does not restore them. Remove test-send buttons/dialogs, their fields and validation, test-only translations, and active `notification:test` / `send` permission declarations and grants from application-owned seed definitions. Preserve unrelated page permissions and never edit merged migrations to remove an old permission. Do not restore the protocol with a generic HTTP send endpoint merely to keep old forms or E2E fixtures running.

Keep notification management and log pages that the product uses. Read historical channel/Provider identities from recorded deliveries (`channelName`, `channelType`, `providerType`), rather than fetching test metadata or requiring a currently configured channel. Keep log access protected by `page:notification.logs` / `access`. The supported core log routes remain `GET /api/notifications/logs` and `GET /api/notifications/logs/{logId}`; inspect the target declarations for their response shape and pagination.

Replace test-send API setup in E2E with an existing business action that produces a notification, or a server-side fixture resolving `notificationServiceToken` and calling `send()` with complete input. Keep assertions for delivery, permissions, logs and inbox behavior. Only coverage specific to the removed form/protocol goes away; do not drop the notification E2E suite wholesale.

## Preserve configuration and extension compatibility

The following APIs are deprecated, not removed:

- Prefer `type` in new channel configuration. `provider` remains an alias: either is accepted, both must match, and conflicts fail validation. Preserve configured channel names, enabled state, transport settings, credentials and environment mappings. A disabled placeholder can omit the discriminator; do not enable or populate it merely to migrate the spelling.
- Application configuration snapshots normalize valid discriminators into both aliases, including defaults, environment overlays and reloads. Existing business `config.provider` reads remain supported and deprecated. Use `NotificationConfigInput` for unnormalized configuration accepting either key; the legacy-compatible `NotificationConfig` read type retains required `provider`. A class constructor receives normalized `ChannelConfig` with `type` and no `provider` alias. Do not assume every raw configuration object has been normalized.
- `registerChannel()` and `registerProvider()` and legacy factories remain available for compatibility. New extensions use `registerChannelType(ChannelClass)` with a class implementing `ChannelInstance`; official implementations use the class API, with old calls confined to compatibility code and its tests. Existing third-party registrations are not an automatic upgrade failure. Remove retired test hooks even from a retained legacy extension.

For a custom extension being migrated, follow the target notification Skill's channel extension reference for exact types and a complete class example. Register the class before runtime activation; its static `type` is globally unique, and each configured name gets an independent instance. The constructor receives `(context, config)`; `ChannelContext` contains `channelName` and `container`. Resolve application services through `context.container.resolve(...)`. Implement `validateMessage`, `prepare` and `send`, with optional `initialize` and `close`; preserve cancellation, result classification and cleanup of resources owned by the instance. A standalone manager must receive the host container if the extension depends on host services.

Preserve delivery identities during this change. Built-in classes retain historical `channelType` values such as `email` for SMTP/Resend and `im` for the webhook transports, alongside `providerType`; those stored fields are not extra registrations to remove. A custom legacy extension with a different message-family identity can keep its compatible factories. Moving it to a class requires draining pending/retryable work or an explicit history migration plan before changing that identity. Do not rename or replace a configured channel while its old deliveries still need retries.

`send()` and `sendTransient()` inputs and outputs are unchanged. `send()` still takes `messages` keyed by configured channel name; this upgrade introduces neither an array input nor a `submit()` API. TestAdapter removal itself requires no database migration or deletion of notifications, deliveries, attempts, retry audits or inbox records, including historical test notifications. Review separate package migrations through the [database upgrade workflow](database-upgrades.md).

## Verify the migrated application

After the upgrade Skill's package checks, exercise the affected application behavior. Select checks for the actual consumers and configured transports, and record unavailable scenarios explicitly:

- **Configuration and extensions:** Existing provider-only configuration still loads; type-based configuration selects the intended transport. When changing aliases, check defaults/environment overlays and reload behavior, including conflicts. For a migrated custom class, verify validation, separate named instances, service resolution, initialization failure and cleanup. Do not mistake retained compatibility calls or stored identity fields for unfinished removal work.
- **Business delivery:** Trigger an authorized business notification or server-side fixture and inspect its notification ID, final delivery results and attempts. A returned ID only proves submission, not final delivery. Verification creates a real delivery; use the recipient/channel scope already authorized and do not send to external recipients merely because credentials exist.
- **Logs and permissions:** The log page loads without test target metadata, historical records remain readable even when a channel is no longer configured, and unauthorized users cannot read protected logs. Application controls no longer call the retired test endpoints; no general-purpose test-send permission or replacement endpoint has been added.
- **In-app, when used:** The intended user receives the business notification, unread state updates, read/unread state survives reload, and the business link opens at the application's deployment base path. Another user cannot read or modify that recipient's messages. Preserve the existing inbox navigation and access policy.
- **Retries and history, when affected:** Pending/retryable deliveries remain tied to their original channel and Provider identity, without rerouting or duplicate submission. Retain existing retry/idempotency coverage; do not resend an outcome that is unknown merely to obtain a green check.

Report the resolved notification versions, removed consumers, retained compatibility paths and observed delivery results alongside the template version range. Passing type checks alone, or removing the test button, does not establish notification upgrade success.
