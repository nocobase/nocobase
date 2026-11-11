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

Configure named application mailers once for password reset, user invitations and email notifications. App-server validates `mailers`, adds explicit environment mappings and a private startup snapshot, and registers a `MailSenderFactory` from which Authentication, Users and each email notification channel create their own exclusive sender and close it after stopping their own work, so closing one never affects another. Legacy inline senders, channel selection and standalone Auth, Provider factories and hand-composed hosts keep working without new arguments. New applications can send reset and invitation emails without installing Notification. Restart after changing email configuration; configuration reload does not hot-switch active senders.
