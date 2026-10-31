# @nocobase/app-plugin-notification-web-push

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
