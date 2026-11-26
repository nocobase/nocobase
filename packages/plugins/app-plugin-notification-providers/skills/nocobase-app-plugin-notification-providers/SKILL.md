---
name: nocobase-app-plugin-notification-providers
description: 'Configure and use the built-in notification channel types of a NocoBase 3 application: the sms channel (Alibaba Cloud and Tencent Cloud, private credentials, templates, readable error codes, test send, notification rules, one-time code sends, registering another SMS service), and where the email, Feishu and DingTalk channels are configured.'
metadata:
  short-description: Configure SMS and the other built-in notification channels
  domain-owner: '@nocobase/app-plugin-notification-providers'
---

# Notification providers

Use this Skill when an application built on `@nocobase/app-plugin-notification-providers` needs a built-in channel type: `email`, `smtp`, `resend`, `feishu-webhook`, `dingtalk-webhook` or `sms`. How notifications are sent, retried and logged belongs to `nocobase-app-plugin-notification`; read it for `send()`, `notify()` and delivery diagnostics. Do not edit the plugin's source or `dist/`; everything below is done in the application.

Declare the application's `notification` section with `defineMailChannelsConfig` from `@nocobase/app-plugin-notification-providers/config`. It validates the built-in channels at startup and maps the private environment variables (`SMTP_PASSWORD`, `RESEND_API_KEY` and the `SMS_*` variables below) onto the conventional channels `system-email` and `system-sms`.

Register the server plugin after the core notification plugin. This package only supplies and configures channels. A verification code lifecycle, verified phone binding and step-up confirmation belong to the `nocobase-app-plugin-verification` Skill, which uses the `system-sms` channel configured here; it is available only when `@nocobase/app-plugin-verification` is installed. Installing this package does not add sign-in by SMS or any page.

## SMS

Read [SMS channel](references/sms.md) to configure the channel, send a message, send a one-time code, read an SMS error, or register another SMS service. In short:

- A channel is `type: sms` with a `service` (`aliyun`, `tencent` or one you register), a `signName`, the service's own settings under its name, and `templates` by purpose.
- Credentials are private: map them from the environment (`SMS_ALIYUN_ACCESS_KEY_ID`, `SMS_ALIYUN_ACCESS_KEY_SECRET`, `SMS_TENCENT_SECRET_ID`, `SMS_TENCENT_SECRET_KEY`) and never put them in a committed file, a log, a message or a report.
- Send an ordinary SMS with `notification.send()`. Never send a one-time code with `send()`. Prefer the verification service, which generates, delivers and checks the code; call `sendTransient()` directly only for a message verification does not cover, because it keeps the message out of the notification history, the queue and the logs.
- A kind reaches users by SMS when its policies include `type: 'sms'`, the channel has a `notification` template, and the application provides `userPhoneDirectoryToken` with the users' verified numbers. Without the directory nobody is reached.
- A failed send carries a stable code such as `SMS_SIGNATURE_INVALID` or `SMS_RATE_LIMITED`. Tell the administrator the code and its remedy from the reference, not the provider's text.

Verify a configuration with the channel's test send in System settings (`POST /api/notification/channels/<name>/test`, which needs the `notification` manage permission). It sends to the signed-in administrator's verified phone. A real send needs the provider account; never claim a delivery you did not receive.
