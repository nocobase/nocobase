---
'@nocobase/app-plugin-notification': minor
'@nocobase/app-plugin-users': minor
'@nocobase/app-plugin-notification-example': minor
'@nocobase/app-template-default': minor
'@nocobase/app-template-examples': minor
'@nocobase/app-skills': patch
---

Make the notification template page readable for administrators. Template details open in a drawer with an address of their own (`/settings/notifications/templates/:templateId`; older `?template=` links redirect), the filters form a compact toolbar showing display names, cards are grouped by category and open on click, and the copy avoids technical wording. Template registrations accept translation keys (`{ ns, key, defaultValue }`) for every administrator-facing field, translatable channel, channel type and source names, and a `localeMode` field; `combined` marks a message that carries every language, so the preview offers no language choice. Otherwise the preview starts in the interface language and lists language names. `NotificationTemplateView` text fields are now `string | { ns, key, defaultValue }`. The Users invitation and the notification example registrations are translated and the invitation declares `localeMode: 'combined'`.
