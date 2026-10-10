---
name: nocobase-app-plugin-notification
description: 'Use when agents need to integrate, configure, send, inspect, or diagnose NocoBase notifications based on app-plugin-notification.'
argument-hint: '[action: explain|integrate|configure|send|inspect|diagnose] [channel-or-notification-id]'
allowed-tools: Bash, Read, Write, Grep, Glob
owner: notification
version: 1.0.1
last-reviewed: 2026-09-21
risk-level: medium
metadata:
  domain-owner: '@nocobase/app-plugin-notification'
  current-scope: 'applications that install the notification runtime and the required Channel packages'
---

# Notification development

Inspect the application's registered plugins and effective notification configuration before changing integration code. Missing required input blocks an actual send; use the recipient and Channel scope already authorized in the conversation and ask only for missing information.

1. Read [Notification concepts](references/notification-concepts.md) for package ownership and delivery status semantics.
2. For plugin registration, configuration, migrations, or test APIs, read [Integration and configuration](references/integration-and-configuration.md). Configure a Channel name mapped to one flat Provider configuration.
3. For sending or typed consumers, read [Sending notifications](references/sending-notifications.md). Resolve `notificationServiceToken`; construct complete messages keyed by Channel name and use native recipient addresses. Validate the intended external effect before sending.
4. For failures and retries, read [Delivery diagnostics](references/delivery-diagnostics.md). Preserve Notification, Delivery, Attempt, and retry-audit history; distinguish accepted submission from final delivery.
5. For custom transports, read [Channel and Provider extensions](references/channel-and-provider-extensions.md). Register globally unique Provider definitions through `notificationExtensionRegistryToken` and retain the queue/lease/retry lifecycle.
6. Verify changed packages and consumers with lint, typecheck, tests, and build. Cover atomic validation, independent delivery, recipient rules, and retries bound to original identities.

The test API requires authentication and its test header; submission additionally requires `notification:test` `send`. A test notification is a real send. Select only the Channel and provide the fields required by its message type. Credentials stay on the server.

## High-impact actions and rollback

For bulk sends and live configuration changes, establish the intended recipients, Channels, and external effect from the user's authorization. An unknown result may already have reached its recipient; confirm the external effect before creating a new logical send.

Rollback source/configuration through the application's normal deployment process. A submitted notification cannot be recalled by this plugin. Preserve its history and report the observed status. Keep message bodies, recipient snapshots, credentials, and Webhook URLs out of logs and reports.

### Sensitive messages

Use `notificationService.sendTransient({ channel, message })` for a message containing a one-time credential. It validates and prepares the message with the configured channel and submits it once with the provider timeout, without creating notification rows, jobs, retry state, or status events. The result is one provider outcome per recipient; raw provider diagnostics are replaced with generic errors while retaining an allowlisted category and submission status for credential-free troubleshooting. There is no durable idempotency or automatic retry, and a timeout is `submission_unknown`. The caller owns safe recovery, rate limits, and any credential-free audit. The external mail provider and recipient still receive the message.
