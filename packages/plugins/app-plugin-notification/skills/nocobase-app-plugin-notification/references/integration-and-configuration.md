# Integration and Configuration

Register the core Server plugin before the in-app and built-in Provider plugins. Register their Client plugins for the desired logs and inbox UI. Apply plugin migrations. Hub does not register end-user notification plugins by default; add them explicitly only when the product needs them.

Delivery tasks run on the application's jobs service (`JobExecutorServiceProvider` from `@nocobase/app-server/jobs`) under the `@nocobase/app-plugin-notification` scope; the plugin sets its executor up on start and shuts it down with the application. `notification.jobs` names the `jobs` configuration they run on; left out, they follow `jobs.default`, and a name that `jobs` does not define stops the application from starting. The memory adapter serves one process, so run more than one instance on a `redis` jobs configuration. Deliveries are persisted before they are submitted, so the reconciler resubmits any task a stopped process lost.

`notification.channels` is a name-to-configuration map. Keys must be non-empty trimmed names of at most 100 characters. Each entry has a `provider`, optional `enabled` (default true), and flat Provider-specific settings. Duplicate YAML keys are configuration errors. Provider identifiers are globally unique; the Provider definition supplies the message type. `name`, `type`, and `providers` are not Channel configuration fields.

```yaml
notification:
  channels:
    system-email:
      provider: smtp
      host: smtp.example.com
      port: 587
      auth: { user: '${SMTP_USER}', pass: '${SMTP_PASSWORD}' }
      from: notifications@example.com
    marketing-email:
      provider: resend
      apiKey: '${RESEND_API_KEY}'
      from: marketing@example.com
    ops-feishu:
      provider: feishu-webhook
      webhookUrl: '${FEISHU_WEBHOOK_URL}'
    inbox:
      provider: in-app

  retry:
    maxAttempts: 1
    intervalMs: 5000
```

`notification.retry.maxAttempts` is the maximum number of automatic attempts for one Delivery, including the first attempt; it defaults to `1`, so automatic retries are disabled by default. `notification.retry.intervalMs` is the fixed wait between automatic attempts and defaults to `5000` milliseconds. A validated Provider `Retry-After` hint takes precedence over this interval.

The application owns secret interpolation. SMTP supports `host`, `port`, `secure`, `auth`, `from`, and `replyTo`; Resend uses `apiKey`, `from`, and optional `replyTo`. Webhook Providers use `webhookUrl` and optional signing `secret`. Feishu requires HTTPS on `open.feishu.cn` or `open.larksuite.com`; DingTalk requires HTTPS on `oapi.dingtalk.com`. Redirects are rejected. Keep credentials out of public descriptors and logs.

Keep Channel names and Provider identifiers stable while deliveries remain pending or retryable. Removing, disabling, or changing a Channel's Provider prevents the old Delivery from being retried elsewhere.

## Registration without plugin discovery

Custom hosts can create a registry, register Channel and Provider definitions, create one manager with the host database/queue/logger, then mount routes and own lifecycle. Register definitions before `start()` or the first `send()` for that Channel.

The core `manager.router` exposes `GET /logs` and `GET /logs/{logId}` without adding authentication itself. The plugin's normal route contribution mounts it at `/api/notifications` with required authentication, authorization middleware, and `page:notification.logs` `access` checks. Custom hosts must provide equivalent protection. `GET /api/notifications/logs` is cursor-paged, newest first: it takes `pageSize` (1 to 100, default 20) and `pageToken`, and answers `{ data, meta }`; pass `meta.nextPageToken` back unchanged as `pageToken` until it is absent. An unknown log id is `404` with reason `NOTIFICATION_LOG_NOT_FOUND`.

For a custom host, register the exported `NOTIFICATION_NAMESPACE` / `notificationServerLocales` and `IN_APP_NOTIFICATION_NAMESPACE` / `inAppNotificationServerLocales` pairs with the host `I18nRuntime`, initialize it, then mount its request i18n middleware before the core logs and in-app routers. Every failure is the application's standard error body, `{ error: { code, status, reason, domain, message, localizedMessage?, fieldViolations?, metadata?, requestId } }`, with domain `notifications` for this plugin and `notificationInApp` for the inbox. Clients branch on `reason` (`ApiClientError.reason` in the browser), never on `message`; `localizedMessage.message` is the text already translated into the request's locale, and `metadata` carries the translation parameters such as a field `name`. Authentication middleware retains its owning plugin's error contract.

The in-app router must derive the current user from trusted authentication state. Never accept a client-supplied user id as the current identity. Its write endpoints use a CSRF token/cookie pair.

The inbox is owned by `@nocobase/app-plugin-notification-in-app` and lives under `/api/notificationInApp`. List the current user's messages with `GET /api/notificationInApp/messages`. `pageSize` must be an integer from 1 through 100 (default 20). When `meta.nextPageToken` is present, pass that opaque value back as `pageToken`; do not parse, edit, or manufacture tokens. Writes are custom methods, `POST /api/notificationInApp/messages/{messageId}/markRead`, `.../markUnread` and `POST /api/notificationInApp/messages/markAllRead`, plus `DELETE /api/notificationInApp/messages/{messageId}`; see that plugin's Skill for the CSRF token they require.

## Notification test surface

The core package exposes `GET /api/notifications/testTargets`, `POST /api/notifications/testSends`, and `GET /api/notifications/testSends/{notificationId}`. All three require authentication and `x-nocobase-notification-test: 1`; only `POST /testSends` requires the `notification:test` `send` permission. `GET /testTargets` answers `{ data: [...], meta: { total } }` without paging. `POST /testSends` takes exactly `{ channel, values }` and answers `202 { data: { notificationId, ... } }`; read its progress from `GET /testSends/{notificationId}`. A channel that is not a test target, or a missing, unknown, or too long field, is `400 INVALID_ARGUMENT` with a `fieldViolations` entry naming `channel` or `values.<name>`. A Channel whose transport cannot be reached (not enabled, Provider missing or changed, runtime creation failed) is `503 UNAVAILABLE` with reason `NOTIFICATION_TEST_FAILED`; any other failure is not reported as a test failure. Logs remain separately protected by `page:notification.logs` `access`.

The running application documents the log and test routes under the `Notification` tag at `/api/swagger/docs` (JSON at `/api/swagger`, signed in), including the required test header, the response schemas and every error status; their operationIds are `notificationsListLogs`, `notificationsGetLog`, `notificationsListTestTargets`, `notificationsCreateTestSend` and `notificationsGetTestSend`.

Targets are the intersection of registered definitions and enabled configured instances. Their public descriptors contain only Channel names, Provider identifiers, labels, and safe form-field metadata. Configuration, Webhook URLs, API keys, and secrets stay on the server. Channel definitions convert test fields into the same normal `send()` inputs; each test creates persistent logs, and status is visible only to its creating user.

A production test is a real external send and requires explicit scope, the recipient or recipientless mode, Channel, permission, and follow-up verification.
