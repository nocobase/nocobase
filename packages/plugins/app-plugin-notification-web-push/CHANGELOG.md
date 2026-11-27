# @nocobase/app-plugin-notification-web-push

## 0.1.0-beta.11

### Patch Changes

- cc0bf33: Run outstanding sample data when enabled on existing databases. Write seed history only after a successful run and omit disabled sample seeds from dry-run plans. Apply the preview environment's sample data setting on every deployment and document the guidance for adding sample seeds to business changes.
- Updated dependencies [cc0bf33]
- Updated dependencies [4561d5f]
- Updated dependencies [87e3dac]
- Updated dependencies [52d0b0d]
- Updated dependencies [c12d990]
- Updated dependencies [1b92cdb]
- Updated dependencies [1b92cdb]
- Updated dependencies [1b92cdb]
- Updated dependencies [78bdca8]
- Updated dependencies [91a8ff2]
- Updated dependencies [87e3dac]
- Updated dependencies [9acf418]
  - @nocobase/app-server@5.0.0-beta.12
  - @nocobase/db@1.0.0-beta.31
  - @nocobase/app-plugin-notification@2.0.0-beta.11
  - @nocobase/app-plugin-authentication@2.0.0-beta.26
  - @nocobase/app-client@4.0.0-beta.14

## 0.1.0-beta.10

### Minor Changes

- a6b9b74: Notify people instead of channels. Notification templates become notification kinds that declare a policy per channel type (`required`, `on` or `off`), and the notification service gains `notify(kind, { to: userIds, data, target, source, idempotencyKey })`, which applies each person's choices, reaches them through every channel type that can (in-app by user, email by account address, web-push by enabled device) and makes one ordinary `send()`; `send()` and `sendTransient()` are unchanged. Each person chooses channels per kind in the new `notificationPreferences` table through `GET`/`PUT /api/notifications/preferences`; required channels cannot be turned off. In-app items record their kind, category and source, and the inbox list filters by `category`. The plugins now own every notification page: the in-app client plugin registers the `/inbox` page and the header's inbox button with a pending-or-unread badge and exports inbox entry renderers and pending sources as extension points, replacing `NotificationInAppInbox` and `NotificationInAppProvider`; the notification client plugin registers System settings › Messages › Notifications (channels with a test send to yourself, kinds, and a filterable delivery log with retry) and Personal settings › Messages › Notifications, with channel type displays and personal sections as extension points, and web-push adds its devices section. The settings pages and their API check the new `notification` settings item (`read`, `manage`) instead of `page:notification.templates` and `page:notification.logs`, and `/api/notifications/templates` is replaced by `/api/notifications/kinds`. Projects and the notification example send with `notify()`; Projects drops its `inboxChannel` option. Both templates drop their copied inbox and notification template pages and only register the plugins, and Examples registers web-push with a sample channel.

### Patch Changes

- a6b9b74: `notify()` writes to each person in the language they chose, as one send: the users plugin tells the notification plugin each person's language through the new `notificationUserLocalesToken`, and the user preferences service gains `getForUsers(userIds, key)`. A repeated `notify()` call returns the first send only when it is the same request (kind, people, data, target and source, with dates compared by their instant; data `notify()` cannot compare, such as a `Map`, is refused); another request under the same idempotency key, including a direct `send()`, fails with `IDEMPOTENCY_KEY_CONFLICT`. Channels can name the key the delivery log files a recipient under with `recipientKey()`, and web-push files each push under its device, so the delivery log finds every device's push. Saving the same personal notification choice from two places at once no longer fails.
- a6b9b74: Declare the plugin's title and one-line description in English and Chinese under `nocobase` in `package.json`, which the App Foundation plugins page lists it by.
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [a6b9b74]
- Updated dependencies [1048669]
  - @nocobase/app-client@4.0.0-beta.12
  - @nocobase/app-plugin-authentication@2.0.0-beta.24
  - @nocobase/app-server@5.0.0-beta.9
  - @nocobase/app-plugin-notification@2.0.0-beta.10
  - @nocobase/app-plugin-i18n@1.0.0-beta.24
  - @nocobase/db@1.0.0-beta.30
  - @nocobase/i18n@2.0.0-beta.2
  - @nocobase/service-provider@0.0.2-beta.2

## 0.1.0-beta.9

### Patch Changes

- 761fb01: Preserve API request IDs when reporting failed account, push and demo operations through the application toaster.
- Updated dependencies [761fb01]
  - @nocobase/app-client@4.0.0-beta.11
  - @nocobase/app-plugin-authentication@2.0.0-beta.23

## 0.1.0-beta.8

### Patch Changes

- 1952789: Update authentication, editor, and validation dependencies to patched releases.
- Updated dependencies [44bf26a]
- Updated dependencies [1952789]
  - @nocobase/app-server@5.0.0-beta.5
  - @nocobase/app-plugin-authentication@2.0.0-beta.21
  - @nocobase/app-plugin-i18n@1.0.0-beta.23
  - @nocobase/app-plugin-notification@2.0.0-beta.9

## 0.1.0-beta.7

### Minor Changes

- a2a6385: Add Russian (ru-RU) and Korean (ko-KR) to the plugins Studio uses, and correct terminology in their existing translations: an issue is a task (it was translated as a magazine issue or a problem in several languages), a runtime is an execution environment, Agent and My Agent stay consistent, and an issue's executor and the backlog status read correctly. The remaining English strings in the agents plugin's translations are translated. Calendars follow Russian and Korean, and a browser asking for Traditional Chinese (zh-HK, zh-Hant-TW) now lands on zh-TW instead of zh-CN.

### Patch Changes

- Updated dependencies [7508a76]
- Updated dependencies [fb4659d]
- Updated dependencies [1cda4c3]
- Updated dependencies [7d970d6]
- Updated dependencies [bb1dff2]
- Updated dependencies [a2a6385]
  - @nocobase/app-plugin-authentication@2.0.0-beta.20
  - @nocobase/app-server@5.0.0-beta.2
  - @nocobase/db@1.0.0-beta.26
  - @nocobase/app-plugin-notification@2.0.0-beta.6
  - @nocobase/app-plugin-i18n@1.0.0-beta.22
  - @nocobase/i18n@2.0.0-beta.2
  - @nocobase/app-client@4.0.0-beta.9

## 0.1.0-beta.6

### Patch Changes

- cf23bfe: **Breaking:** Remove the deprecated `@nocobase/app-server/mailer` entry and its `Mailer`, `mailerToken`, `createMailer`, `MailerProvider`, and notification configuration exports. Replace `MailExecutions.close(waitMs)` and `drain()` with `stop()` and `wait()`; transport `close()` now cancels supported network work and waits for its original completion without a nested timeout. Application owners must apply the outer shutdown budget. Create exclusive senders with `@nocobase/app-server/mailers` and declare notification config with `@nocobase/app-plugin-notification-providers/config`. Existing inline SMTP/Resend YAML, environment mappings, and provider/channel APIs remain supported.

  Default and Examples now show `mailers.default: system` and explicitly map `MAILERS_SYSTEM_*`; the example configuration remains empty at runtime. The previous `MAILERS_TRANSACTIONAL_*` sample prefix was not published. Applications may still choose any valid mailer name and custom environment prefix.

- Updated dependencies [6cc8acf]
- Updated dependencies [9933a9a]
- Updated dependencies [1e018f1]
- Updated dependencies [cf23bfe]
- Updated dependencies [4411984]
  - @nocobase/app-client@4.0.0-beta.7
  - @nocobase/app-plugin-authentication@2.0.0-beta.18
  - @nocobase/db@1.0.0-beta.25
  - @nocobase/app-server@5.0.0-beta.0
  - @nocobase/app-plugin-i18n@1.0.0-beta.20
  - @nocobase/app-plugin-notification@2.0.0-beta.4

## 0.1.0-beta.5

### Patch Changes

- cf23bfe: Move Redis realtime broadcasting to the commercial Realtime Redis plugin. Register its Server plugin before selecting Redis in an application, or import the standalone broker from its `/broker` entry. Preserve the Memory default, service identity, authorization and recovery protocol, and republish runtime consumers against the new host and realtime major versions. Install the compatible commercial cohort before deploying the final removal.
- Updated dependencies [88d35b8]
- Updated dependencies [88d35b8]
- Updated dependencies [83f28b1]
- Updated dependencies [cf23bfe]
  - @nocobase/app-client@4.0.0-beta.6
  - @nocobase/app-plugin-authentication@2.0.0-beta.17
  - @nocobase/app-server@4.0.0-beta.0
  - @nocobase/app-plugin-i18n@1.0.0-beta.19
  - @nocobase/app-plugin-notification@2.0.0-beta.3

## 0.1.0-beta.4

### Patch Changes

- b6934ad: Expose notification email configuration helpers from `@nocobase/app-plugin-notification-providers/config` and mailer contracts and validation from `@nocobase/mailer/config`, without loading sending runtimes. Preserve notification validation, optional private environment mappings and application overrides. Migrate application templates and configuration examples to the new import. Freeze and deprecate the published `@nocobase/app-server/mailer` API while retaining existing behavior for applications that still depend on it.
- Updated dependencies [b6934ad]
- Updated dependencies [d3f0c92]
- Updated dependencies [a0b4568]
- Updated dependencies [12b1f64]
- Updated dependencies [b6934ad]
- Updated dependencies [5ce4a7c]
- Updated dependencies [b6934ad]
- Updated dependencies [171f7fb]
  - @nocobase/app-plugin-authentication@2.0.0-beta.16
  - @nocobase/app-client@4.0.0-beta.5
  - @nocobase/app-server@3.0.0-beta.5
  - @nocobase/app-plugin-notification@2.0.0-beta.2
  - @nocobase/db@1.0.0-beta.24

## 0.1.0-beta.3

### Patch Changes

- 05f800a: Publish editable file upload/preview and notification delivery-log UI through the UI Library. Install `@nocobase/file-component-ui` or `@nocobase/notification-logs-ui` with shadcn, and merge their bundled locale resources into the consuming application. Existing application-owned copies remain usable; reconcile upstream changes while preserving customizations. The default template keeps its File UI installation path and now tracks the UI Library source.

  Remove plugin-owned Registry recipes, their build/materialize commands, the Registry example plugin, and the `registry` capability from the plugin scaffold. Plugins can continue to install UI Library items into their own client source. Update plugin development guidance to use this single source distribution channel.

  Preserve custom file download callbacks for images opened from FileList, including preview toolbar and fallback downloads.

- Updated dependencies [05f800a]
  - @nocobase/app-plugin-notification@2.0.0-beta.1

## 0.1.0-beta.2

### Minor Changes

- f8f64ad: Register SMTP, Resend, Feishu webhook, DingTalk webhook, in-app and Web Push as concrete channel classes. Share message validation and preparation with the retained compatibility factories, mark these factories as deprecated with their replacement classes, and resolve host-owned inbox and push services through the channel context container. Keep the email, IM, in-app and Web Push message handlers available to existing third-party Providers through dedicated compatibility modules. Official channel registration uses registerChannelType exclusively; deprecated registration calls are confined to compatibility modules and tests.

### Patch Changes

- f8f64ad: Remove the Notification TestAdapter protocol, built-in form descriptors, generic test-send routes and permission, and test client methods. Channel classes now implement only their delivery lifecycle. Existing send/sendTransient contracts, retries, logs, and inbox records remain unchanged.

  Applications should remove test buttons and test API clients, then verify delivery through their business flows or a server-side send() call. Log pages must read provider identities from recorded deliveries rather than test target metadata. Update the notification Skill and example guidance to match, and republish consumers against the new notification package line.

  Explicitly include Node.js types in both application templates' client typechecks, whose shared contracts reference server package sources in the workspace, so compilation no longer depends on the removed notification test imports to load those types.

- Updated dependencies [f8f64ad]
- Updated dependencies [f8f64ad]
  - @nocobase/app-plugin-notification@2.0.0-beta.0
  - @nocobase/app-server@3.0.0-beta.2
  - @nocobase/app-plugin-authentication@2.0.0-beta.12

## 0.1.0-beta.1

### Patch Changes

- 1952789: Complete all ten supported languages in plugin and example plugin catalogues, including model suggestions and test Web Push notifications. Align calendars and invitation emails, support locale-specific plural forms, and validate resource loading and formatting.

  Correct joined translation text and distinguish configuration save actions, refund stages, and domain-specific operation labels.

- Updated dependencies [1952789]
  - @nocobase/app-plugin-authentication@2.0.0-beta.12
  - @nocobase/app-plugin-i18n@1.0.0-beta.18
  - @nocobase/app-plugin-notification@1.0.0-beta.29
  - @nocobase/i18n@2.0.0-beta.1
  - @nocobase/app-client@4.0.0-beta.0

## 0.1.0-beta.0

### Minor Changes

- 1de333f: Add a reusable Web Push notification channel with encrypted owner-bound device subscriptions, persistent VAPID configuration, scoped notification worker, device preferences and test notifications. Reuse notification queue retries and remove expired devices. The plugin uses fixed `/api/webPush` endpoints and framework browser conventions, with branding options and named service hooks for authorization, foreground takeover and subscription initialization.

  Accept application language identifiers with English fallback, retain device enablement on renewed subscriptions, and return standard device API responses. Validate scoped click URLs and reject serialized payloads above 3993 UTF-8 bytes before queueing, reserving encryption overhead within 4096 bytes.

### Patch Changes

- @nocobase/app-server@3.0.0-beta.0

## 0.0.1

### Patch Changes

- Add encrypted Web Push subscriptions, the notification channel and reusable device preferences.
