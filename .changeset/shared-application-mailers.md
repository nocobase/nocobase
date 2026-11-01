---
"@nocobase/mailer": patch
"@nocobase/app-server": minor
"@nocobase/app-plugin-authentication": minor
"@nocobase/app-plugin-users": minor
"@nocobase/app-plugin-notification": patch
"@nocobase/app-plugin-notification-providers": minor
"@nocobase/app-template-default": patch
"@nocobase/app-template-examples": patch
---

Share named application mailers across password reset, user invitations and email notifications. Add explicit environment mappings, private startup configuration snapshots and application-owned sending lifecycles, while preserving legacy inline senders and channel selection. New applications can send reset and invitation emails without installing Notification. Restart after changing email configuration; configuration reload does not hot-switch active senders. Legacy standalone Auth, Provider factories and hand-composed hosts retain their calling conventions through centrally managed compatibility scopes.
