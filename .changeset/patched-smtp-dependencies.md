---
'@nocobase/mailer': patch
'@nocobase/app-plugin-mail': patch
'@nocobase/app-plugin-notification-providers': patch
---

Upgrade SMTP sending to Nodemailer 10 with its bundled declarations and security fixes. The framework's Node.js 24 requirement already satisfies Nodemailer 10's Node.js 20 minimum.

Align Notification Providers' SMTP test dependency with the shared transport so its mocks intercept the runtime version.
