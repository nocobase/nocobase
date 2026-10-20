# @nocobase/app-plugin-notification-web-push

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
