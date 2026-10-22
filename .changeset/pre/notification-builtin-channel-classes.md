---
'@nocobase/app-plugin-notification-providers': minor
'@nocobase/app-plugin-notification-in-app': minor
'@nocobase/app-plugin-notification-web-push': minor
---

Register SMTP, Resend, Feishu webhook, DingTalk webhook, in-app and Web Push as concrete channel classes. Share message validation and preparation with the retained compatibility factories, mark these factories as deprecated with their replacement classes, and resolve host-owned inbox and push services through the channel context container. Keep the email, IM, in-app and Web Push message handlers available to existing third-party Providers through dedicated compatibility modules. Official channel registration uses registerChannelType exclusively; deprecated registration calls are confined to compatibility modules and tests.
