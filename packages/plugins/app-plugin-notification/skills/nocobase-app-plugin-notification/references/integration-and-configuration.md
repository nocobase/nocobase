# Integration and Configuration

Register the core Server plugin before the in-app and built-in Provider plugins. Register their Client plugins for the desired logs and inbox UI. Apply plugin migrations. Register end-user notification plugins only when the product needs them.

Delivery tasks run on the application's jobs service (`JobExecutorServiceProvider` from `@nocobase/app-server/jobs`) under the `@nocobase/app-plugin-notification` scope; the plugin sets its executor up on start and shuts it down with the application. `notification.jobs` names the `jobs` configuration they run on; left out, they follow `jobs.default`, and a name that `jobs` does not define stops the application from starting. The memory adapter serves one process, so run more than one instance on a `redis` jobs configuration. Deliveries are persisted before they are submitted, so the reconciler resubmits any task a stopped process lost.

`notification.channels` is a name-to-configuration map. Keys must be non-empty trimmed names of at most 100 characters. Each entry has a `type`, optional `enabled` (default true), and flat type-specific settings. Type identifiers are globally unique. `provider` is a deprecated compatibility alias: use either field, or both with identical values; conflicting, empty or padded identifiers fail validation. `name` and `providers` are not Channel configuration fields. A disabled placeholder may omit the discriminator or refer to an unregistered type; supplied discriminators must still be valid and agree. Duplicate YAML keys are configuration errors.

Application configuration snapshots populate both aliases for channels with a valid discriminator after loading, merging defaults, environment overrides, and reloading; source layers and configuration files retain the original spelling. Existing business code may continue reading `config.provider`, which is marked `@deprecated`; new code should read `config.type`. Disabled placeholders without a discriminator stay unchanged.

Use `NotificationConfigInput` for code defaults and standalone manager input, accepting either discriminator. Use `app.config.get<NotificationConfig>('notification')` for application reads: its channel entries retain the required `provider: string` type for existing consumers. `type` remains optional in this legacy-compatible type so existing provider-only code defaults still compile. Class extensions continue receiving a `ChannelConfig` with `type`; the application-level compatibility alias is not passed to their constructors.

```yaml
notification:
  channels:
    system-email:
      type: smtp
      host: smtp.example.com
      port: 587
      auth:
        {
          user: notifications@example.com,
          pass: replace-with-the-smtp-password,
        }
      from: notifications@example.com
    marketing-email:
      type: resend
      apiKey: replace-with-the-resend-api-key
      from: marketing@example.com
    ops-feishu:
      type: feishu-webhook
      webhookUrl: https://open.feishu.cn/open-apis/bot/v2/hook/replace-with-the-token
    inbox:
      type: in-app

  retry:
    maxAttempts: 1
    intervalMs: 5000
```

`notification.retry.maxAttempts` is the maximum number of automatic attempts for one Delivery, including the first attempt; it defaults to `1`, so automatic retries are disabled by default. `notification.retry.intervalMs` is the fixed wait between automatic attempts and defaults to `5000` milliseconds. A validated Provider `Retry-After` hint takes precedence over this interval.

YAML values are literal; `${NAME}` is not interpolated. The application maps environment variables in `server/config/notification.ts`. `defineMailChannelsConfig` from `@nocobase/app-plugin-notification-providers/config` supports both discriminators without starting a notification plugin. This pure configuration entry does not load email transports or provider SDKs. Its default `SMTP_PASSWORD` mapping targets `channels.system-email.auth.pass`; add `RESEND_API_KEY: envString('channels.marketing-email.apiKey', { secret: true, required: false })` for the marketing channel above. SMTP supports `host`, `port`, `secure`, `auth`, `from`, and `replyTo`; Resend uses `apiKey`, `from`, and optional `replyTo`. Webhook Providers use `webhookUrl` and optional signing `secret`. Feishu requires HTTPS on `open.feishu.cn` or `open.larksuite.com`; DingTalk requires HTTPS on `oapi.dingtalk.com`. Redirects are rejected. Keep credentials out of public descriptors and logs.

Keep Channel names and Provider identifiers stable while deliveries remain pending or retryable. Removing, disabling, or changing a Channel's Provider prevents the old Delivery from being retried elsewhere.

## Registration without plugin discovery

Custom hosts create a registry, call `registerChannelType(ChannelClass)`, and create a manager with the host database, executor, logger, configuration and `container`. Omitting `container` creates an empty container for standalone compatibility; extensions that resolve application services need the host container. Register classes before activation, `start()` or the first send. The plugin supplies its application container automatically.

The core `manager.router` exposes `GET /logs` and `GET /logs/{logId}` without adding authentication itself. The plugin's normal route contribution mounts it at `/api/notifications` with required authentication, authorization middleware, and `page:notification.logs` `access` checks. Custom hosts must provide equivalent protection. `GET /api/notifications/logs` is cursor-paged, newest first: it takes `pageSize` (1 to 100, default 20) and `pageToken`, and answers `{ data, meta }`; pass `meta.nextPageToken` back unchanged as `pageToken` until it is absent. An unknown log id is `404` with reason `NOTIFICATION_LOG_NOT_FOUND`.

For a custom host, register the exported `NOTIFICATION_NAMESPACE` / `notificationServerLocales` and `IN_APP_NOTIFICATION_NAMESPACE` / `inAppNotificationServerLocales` pairs with the host `I18nRuntime`, initialize it, then mount its request i18n middleware before the core logs and in-app routers. Every failure is the application's standard error body, `{ error: { code, status, reason, domain, message, localizedMessage?, fieldViolations?, metadata?, requestId } }`, with domain `notifications` for this plugin and `notificationInApp` for the inbox. Clients branch on `reason` (`ApiClientError.reason` in the browser), never on `message`; `localizedMessage.message` is the text already translated into the request's locale, and `metadata` carries the translation parameters such as a field `name`. Authentication middleware retains its owning plugin's error contract.

The in-app router must derive the current user from trusted authentication state. Never accept a client-supplied user id as the current identity. Its write endpoints use a CSRF token/cookie pair.

The inbox is owned by `@nocobase/app-plugin-notification-in-app` and lives under `/api/notificationInApp`. List the current user's messages with `GET /api/notificationInApp/messages`. `pageSize` must be an integer from 1 through 100 (default 20). When `meta.nextPageToken` is present, pass that opaque value back as `pageToken`; do not parse, edit, or manufacture tokens. Writes are custom methods, `POST /api/notificationInApp/messages/{messageId}/markRead`, `.../markUnread` and `POST /api/notificationInApp/messages/markAllRead`, plus `DELETE /api/notificationInApp/messages/{messageId}`; see that plugin's Skill for the CSRF token they require.

## Delivery verification

Verify channels through the normal business flow or a server-side command resolving `notificationServiceToken` and calling `send()` with a complete message. Use the returned notification ID to inspect delivery and attempts through the protected logs API. In-app delivery requires an explicit application user ID; it does not infer a recipient from the current session. See [Sending notifications](sending-notifications.md) for input examples.

The running application documents the log routes under the `Notification` tag at `/api/swagger/docs` (JSON at `/api/swagger`, signed in). Their operation IDs are `notificationsListLogs` and `notificationsGetLog`. The plugin does not expose a generic HTTP send endpoint or test form metadata. An application-owned send endpoint must enforce its business authorization and recipient rules.

Verification creates a real delivery. Scope the channel and recipient before sending, and preserve existing logs, including historical test notifications.
