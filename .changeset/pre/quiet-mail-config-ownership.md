---
'@nocobase/app-plugin-notification-providers': minor
'@nocobase/mailer': minor
'@nocobase/app-server': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-skills': patch
'@nocobase/app-plugin-notification': patch
'@nocobase/app-plugin-notification-web-push': patch
---

Expose notification email configuration helpers from `@nocobase/app-plugin-notification-providers/config` and mailer contracts and validation from `@nocobase/mailer/config`, without loading sending runtimes. Preserve notification validation, optional private environment mappings and application overrides. Migrate application templates and configuration examples to the new import. Freeze and deprecate the published `@nocobase/app-server/mailer` API while retaining existing behavior for applications that still depend on it.
