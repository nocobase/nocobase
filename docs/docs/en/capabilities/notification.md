---
title: 'Notifications'
description: 'Learn what NocoBase 3 notifications can do, and ask an Agent to connect in-app messages, email, or group messages to business workflows.'
keywords: 'NocoBase,notifications,in-app,email,instant messaging,Agent'
---

# Notifications

Notifications send approval results, task updates, and business reminders to app users or external channels. To have an application Agent connect notifications to your app, describe when to send a message, who should receive it, what it should say, and where it should lead when clicked.

Notification email is sent by the application for business reminders. If employees need to connect their personal mailboxes, read correspondence, or reply to customers, use [Mail](./mail/index.md).

## What notifications can do

- Send in-app messages to application users.
- Send business email to customers or applicants.
- Send reminders to team chats through Feishu or DingTalk bots.
- Extend a custom Provider to connect SMS or another notification service that is not built in.

Notifications do not determine trigger conditions, recipients, or business-data access rules automatically. They also do not switch to another channel automatically when a delivery fails. Describe these rules in your request.

## What to prepare

The default application template registers the notification capability and configures an in-app channel. For a custom application, ask the Agent to check which plugins and channels are installed.

In-app messages can be sent to application users directly. Email and group messages require an administrator to prepare a sending service or bot Webhook and configure its credentials securely in the server-side `config.yml`. Do not give credentials to the Agent. Use the notification Settings page to send test messages and inspect delivery logs. Test emails and group messages are sent to real destinations.

## Example: notify an applicant after approval

Give the following prompt to your application Agent and replace the page and field names with those used in your app:

```text
When an order's approval result changes to approved or rejected, send an in-app notification to the applicant. Include the result and order number in the message. Clicking the message should open the corresponding order detail page.

First check the order fields, applicant, approval workflow, notification channels, and user permissions in the current app. Do not guess field names or expose orders to users who cannot access them. Repeated processing of the same approval result must send only one notification. A notification failure must not undo a completed approval.

When finished, tell me where to view notifications. Use two applicant accounts to verify the recipient scope, order link, and duplicate handling.
```

### Expected result

The applicant receives an in-app message with the approval result and order number. Clicking it opens the corresponding order, and other applicants cannot see it. Administrators can inspect the delivery result in the notification logs.

<!-- Add a genuine screenshot showing an applicant's order approval message on the notifications page and its link to the corresponding order detail page. -->

## Extend the example

To add email, tell the Agent which business field contains the recipient's email address, what the subject and message should say, and whether an employee must review it before sending. To send Feishu or DingTalk messages, specify the target group, trigger conditions, and message content. An administrator is responsible for securely configuring the corresponding bot Webhook.

### Add a messaging service

NocoBase includes in-app, SMTP, Resend, Feishu, and DingTalk Providers. A Provider submits a message to a specific service. A Channel is a named route that the application configures and selects. To use an SMS provider or another service that is not supported yet, the Agent must extend a Provider in an application plugin; a Settings page alone cannot add a new service.

Provide the service's official API documentation and describe the message type, recipient format, and sending requirements. An administrator must configure credentials securely on the server; do not include them in the prompt. Give the following request to an application Agent that can read the current project's Skills:

```text
Add notification support for [provider name] to this NocoBase application so it can send [SMS or another message type].

First read the notification Skill available in this application and the provider's official API documentation. Inspect the existing notification plugin and Providers. Tell me what information is still needed, then integrate the service with the existing notification capability. Credentials must remain in secure server-side configuration; never put them in the frontend, repository, or logs.

When finished, verify that a business workflow can send through the new channel, delivery results appear in notification logs, and test sends do not expose credentials. Handle explicit acceptance, explicit rejection, and uncertain results appropriately. Explain how an administrator configures and tests the new channel, and how a business Agent can select it later.
```

If the Agent needs to confirm which channels the current application supports or how it handles delivery results, ask it to read the notification Skill shipped with the installed version. For a complete example, see [Send notifications](../tutorials/notifications.md).

## Related links

- [Send notifications](../tutorials/notifications.md) — Connect and verify notifications with an order approval example.
- [Mail](./mail/index.md) — Connect a personal mailbox to a business page and handle correspondence.
