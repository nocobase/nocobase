---
name: nocobase-app-plugin-notification
description: 'Use when agents need to integrate, configure, send, inspect, or diagnose NocoBase notifications based on app-plugin-notification.'
argument-hint: '[action: explain|integrate|configure|send|inspect|diagnose] [channel-or-notification-id]'
allowed-tools: Bash, Read, Write, Grep, Glob
owner: notification
version: 2.0.0
last-reviewed: 2026-10-21
risk-level: medium
metadata:
  domain-owner: '@nocobase/app-plugin-notification'
  current-scope: 'applications that install the notification runtime and the required Channel packages'
---

# Notification development

Inspect the application's registered plugins and effective notification configuration before changing integration code. Missing required input blocks an actual send; use the recipient and Channel scope already authorized in the conversation and ask only for missing information.

1. Read [Notification concepts](references/notification-concepts.md) for package ownership and delivery status semantics.
2. For plugin registration, configuration, migrations, or log APIs, read [Integration and configuration](references/integration-and-configuration.md). Configure a Channel name mapped to one flat configuration with `type` (`provider` remains a compatibility alias).
3. For sending or typed consumers, read [Sending notifications](references/sending-notifications.md). Resolve `notificationServiceToken`; construct complete messages keyed by Channel name and use native recipient addresses. Validate the intended external effect before sending.
4. For failures and retries, read [Delivery diagnostics](references/delivery-diagnostics.md). Preserve Notification, Delivery, Attempt, and retry-audit history; distinguish accepted submission from final delivery.
5. For custom transports, read [Channel type extensions](references/channel-and-provider-extensions.md). Register classes implementing `ChannelInstance` with `registerChannelType` through `notificationExtensionRegistryToken` and retain the queue/lease/retry lifecycle.
6. Verify changed packages and consumers with lint, typecheck, tests, and build. Cover atomic validation, independent delivery, recipient rules, and retries bound to original identities.

For delivery diagnostics, exercise the normal business notification flow or use a server-side script resolving `notificationServiceToken` with complete message input. Use an authorized recipient and inspect the returned notification ID in the logs. Credentials stay on the server.

## High-impact actions and rollback

For bulk sends and live configuration changes, establish the intended recipients, Channels, and external effect from the user's authorization. An unknown result may already have reached its recipient; confirm the external effect before creating a new logical send.

Rollback source/configuration through the application's normal deployment process. A submitted notification cannot be recalled by this plugin. Preserve its history and report the observed status. Keep message bodies, recipient snapshots, credentials, and Webhook URLs out of logs and reports.

### Sensitive messages

Use `notificationService.sendTransient({ channel, message })` for a message containing a one-time credential. It validates and prepares the message with the configured channel and submits it once with the provider timeout, without creating notification rows, jobs, retry state, or status events. The result is one provider outcome per recipient; raw provider diagnostics are replaced with generic errors while retaining an allowlisted category and submission status for credential-free troubleshooting. There is no durable idempotency or automatic retry, and a timeout is `submission_unknown`. The caller owns safe recovery, rate limits, and any credential-free audit. The external mail provider and recipient still receive the message.
