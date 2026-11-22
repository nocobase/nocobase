# Notification App Plugin

The notification runtime sends complete messages through configured Channels. A Channel is a named configuration, such as `system-email`; its `type` selects a registered class, such as `EmailChannel`. Email (application mailers), legacy SMTP/Resend, in-app, Feishu webhook, DingTalk webhook and Web Push are peer channel types supplied by their respective plugins.

```yaml
mailers:
  default: system
  system:
    provider: smtp
    host: smtp.example.com
    port: 587
    from: notifications@example.com
notification:
  channels:
    system-email:
      type: email
      # mailer: system
    ops-feishu:
      type: feishu-webhook
      webhookUrl: https://open.feishu.cn/open-apis/bot/v2/hook/replace-with-the-token
    inbox:
      type: in-app
```

```ts
const notification = app.container.resolve(notificationServiceToken);
await notification.send({
  idempotencyKey: 'approval-123',
  source: { type: 'approval', referenceId: '123' },
  messages: {
    'system-email': {
      to: ['customer@example.com', 'reviewer@example.com'],
      subject: 'Approval result',
      html: '<p>Approved</p>',
    },
    'ops-feishu': {
      text: 'Approved',
      target: { type: 'url', url: 'https://example.com/main/approvals/123' },
    },
    inbox: {
      to: '123',
      title: 'Approval result',
      body: 'Approved',
      target: { type: 'route', path: '/approvals/123' },
    },
  },
});
```

## Notifying people: kinds and `notify()`

Business code that tells a person something registers a **notification kind** and calls `notify()`; it does not pick channels or look up addresses. A kind is registered with `notificationTemplateRegistryToken` in a server provider's `boot()`: its id, contributor, category, name, trigger, recipients, locales, variables, `content({ locale, data })` returning `{ title, body, html? }`, a synthetic `sample`, and `channels`, the policy per channel type: `required` (always sent, the person cannot turn it off), `on` (sent unless they turn it off) or `off` (sent only when they turn it on).

```ts
const release = kinds.register({
  id: 'approval.requested',
  contributor: '@acme/app-plugin-approvals',
  category: 'Approvals',
  name: 'Approval requested',
  trigger: 'Someone submits a request for your approval',
  recipients: 'The approvers of the request',
  businessRule: 'Every submitted request',
  locales: ['en-US'],
  languagePolicy: 'English',
  variables: [{ name: 'title', description: 'The request title' }],
  channels: { 'in-app': 'required', 'web-push': 'on', email: 'off' },
  content: ({ data }) => ({
    title: `Approve ${String(data.title)}`,
    body: 'A request waits for you.',
  }),
  sample: { title: 'Purchase of 3 laptops' },
});

await notification.notify('approval.requested', {
  to: [approverId],
  data: { title: request.title },
  target: { type: 'route', path: `/approvals/${request.id}` },
  source: { type: 'approvals.request', referenceId: request.id },
  idempotencyKey: `approval-requested:${request.id}`,
});
```

`notify()` reads every recipient's choices for the kind in one query, asks each enabled channel type how to reach the people left (`resolveUsers(userIds)`: in-app by user id, email by the account address, web-push by the person's enabled devices), and renders the kind once per language: each person's own language when the kind offers it (the users plugin provides it through `notificationUserLocalesToken`), otherwise the application's default. It then makes one send with a message per channel and language, so delivery, idempotency, retries and the delivery log are the same as for a direct send. A repeat under the same `idempotencyKey` returns the first send when it is the same request (kind, people, data, target and source), even if preferences changed since; any other request under that key, including a direct `send()`, fails with `IDEMPOTENCY_KEY_CONFLICT`. Its result is `{ send, skipped }`, where `skipped` lists each person and channel type left out with the reason (`preference` or `no_recipient`). For each channel type it uses the first enabled channel of that type in `notification.channels`. Keep `send()` and `sendTransient()` for recipients that are not users, such as an operations group, an external mailbox or a one-time code.

A channel type reaches users by implementing `resolveUsers(userIds)` and `compose(content, recipients)` beside `validateMessage`; a type without them is never chosen by `notify()`. An optional `recipientKey(recipient)` names what the delivery log files a recipient under and administrators filter by, such as web-push's device id. Its static `summarize(config)` returns the safe `{ label, value }` pairs the settings page shows (mask every secret), and `contributor` names its package.

## Personal preferences

`GET /api/notifications/preferences` answers, for the signed-in person, every kind with its channel types, policy, whether they may change it and the effective choice; a kind they never changed uses its defaults. `PUT /api/notifications/preferences` with `{ items: [{ kind, channelType, enabled }] }` saves choices in the `notificationPreferences` table; turning off a `required` channel is refused with 400 `NOTIFICATION_PREFERENCE_REQUIRED`, and an unknown kind or channel type with 400 as well. Both need only a signed-in user.

## Settings pages and permissions

The client plugin registers System settings › Messages › Notifications (route `notificationSettings`, `/settings/notifications`) with three tabs, and Personal settings › Messages › Notifications (route `notificationPreferences`, `/me/notifications`):

- **Channels**: every channel in `notification.channels` with its type, masked configuration summary, contributing package and last-24-hour outcomes, the retry and jobs settings, and a Test button. A test goes to the administrator only (their inbox, account email or enabled devices; a group channel gets one test text) and appears in the delivery log.
- **Kinds**: the registered kinds by category, with their channel policies, which channels people may change, the sends of the last 7 days and a drawer with the trigger, recipients, language policy and a synthetic preview per channel.
- **Deliveries**: one row per delivery, filtered by outcome (failed, retrying, unknown, pending, accepted), channel, kind, recipient or source id and time, paged by an opaque `pageToken`; the drawer shows every attempt and the retry audit, and a failed delivery can be retried with a required reason.

The settings item `notification` is declared in the authorization catalog with two actions: `read` opens the three tabs and their `GET` routes, `manage` adds the test send and the retry. Every route checks the same item:

| Operation         | Route                                                                                                         | Action   |
| ----------------- | ------------------------------------------------------------------------------------------------------------- | -------- |
| List channels     | `GET /api/notifications/channels`                                                                             | `read`   |
| Test a channel    | `POST /api/notifications/channels/{name}/test`                                                                | `manage` |
| List kinds        | `GET /api/notifications/kinds` (`search`, `category`, `channel`)                                              | `read`   |
| One kind          | `GET /api/notifications/kinds/{kindId}`                                                                       | `read`   |
| Preview a kind    | `POST /api/notifications/kinds/{kindId}/preview` (`{ locale }`)                                               | `read`   |
| List deliveries   | `GET /api/notifications/deliveries` (`status`, `channel`, `kind`, `q`, `from`, `to`, `pageSize`, `pageToken`) | `read`   |
| One delivery      | `GET /api/notifications/deliveries/{deliveryId}`                                                              | `read`   |
| Retry a delivery  | `POST /api/notifications/deliveries/{deliveryId}/retry` (`{ reason }`)                                        | `manage` |
| Notification logs | `GET /api/notifications/logs`, `GET /api/notifications/logs/{logId}`                                          | `read`   |

The running application documents them under the `Notifications` tag at `/api/swagger/docs`. No response carries a secret, a recipient snapshot or message content beyond the preview of synthetic data.

## Customizing

1. **Register the plugins.** `notification()` and `notificationInApp()` in `client/plugins.ts`, their server plugins, and `notificationWebPush()` for browser push. Nothing else is needed for the inbox, the header button and both settings pages.
2. **Plugin options.** `notification({ settingsPage: false })` or `{ preferencesPage: false }` leaves a page out; `notificationInApp({ headerButton: false, inboxPath })` see its README.
3. **Extension points.** On the server: notification kinds (`notificationTemplateRegistryToken`) and a channel type's `resolveUsers`/`compose`/`summarize`. On the client: channel type displays (`notificationChannelTypesToken`: a type's title, icon, summary component and test hint) and personal sections (`notificationPreferenceSectionsToken`: a block under the personal table, such as web-push's devices); the in-app plugin adds entry renderers and pending sources. Register client entries from a client service provider's `boot()`.
4. **Replace a page.** `routeComponentOverrides` with the route id from `NOTIFICATION_ROUTE_IDS` (`@nocobase/app-plugin-notification:notificationSettings`, `:notificationPreferences`) replaces a whole page; the exported `NotificationSettingsPage`, `NotificationPreferencesPage` and `NotificationKinds` can be reused inside it.

All messages are validated before persistence. Email and in-app arrays produce one Delivery per native recipient; Webhooks forbid `to`. Delivery failures remain independent. Queues, timeouts, leases, idempotency, status queries, retry audits, and realtime inbox events remain part of the runtime. Retries stay bound to the original Channel and Provider.

`type` is the preferred discriminator. Existing `provider` configuration remains supported as a deprecated alias; when both are present they must match. Application configuration reads expose both `type` and `provider` with the same value after loading, merging defaults, and reloading, so existing business code reading `config.provider` continues to work. New code should read `type`. The host mailer accepts the same aliases.

Values in YAML are literal: map secrets from environment variables in `server/config/notification.ts` using `defineMailChannelsConfig` from `@nocobase/app-plugin-notification-providers/config` and `envString` from `@nocobase/app-server/config`. Its default `SMTP_PASSWORD` mapping targets `channels.system-email.auth.pass`; map a marketing Resend key explicitly to `channels.marketing-email.apiKey`.

Extend notifications with a class implementing `ChannelInstance`, then call `registry.registerChannelType(MyChannel)`. Its context contains only `channelName` and `container`. Official plugins and examples use `registerChannelType()` exclusively for channel extensions. Deprecated `registerChannel()` / `registerProvider()` APIs and factory exports remain supported for existing third-party extensions. Built-in server plugins install their legacy message handlers through dedicated compatibility modules; new extensions need no separate message-handler registration. This extension change preserves `send()`, `sendTransient()`, `messages`, result DTOs and stored delivery identities; it adds no `submit()` API or database migration.

See the [integration guide](skills/nocobase-app-plugin-notification/references/integration-and-configuration.md), [sending contract](skills/nocobase-app-plugin-notification/references/sending-notifications.md), and [extension guide](skills/nocobase-app-plugin-notification/references/channel-and-provider-extensions.md). Verify delivery through a normal business flow or server-side `send()` call and inspect the returned notification ID in the protected logs API.

### Sensitive messages

Use `notificationService.sendTransient({ channel, message })` for a message containing a one-time credential. It validates and prepares the message with the configured channel and submits it once with the provider timeout, without creating notification rows, jobs, retry state, or status events. The result is one provider outcome per recipient; raw provider diagnostics are replaced with generic errors while retaining an allowlisted category and submission status for credential-free troubleshooting. There is no durable idempotency or automatic retry, and a timeout is `submission_unknown`. The caller owns safe recovery, rate limits, and any credential-free audit. The external mail provider and recipient still receive the message.

Prefer `type: email` with application mailers. Declare `defineMailersConfig` and explicit `mailerEnvironment` mappings from `@nocobase/app-server/mailers/config`. Restart to apply sender changes. Every email Channel, including legacy inline SMTP/Resend Channels and their mappings, creates an exclusive sender through the application's `MailSenderFactory` and closes it with itself.
