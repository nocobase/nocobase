---
title: '5. Send notifications'
description: 'Use an order approval scenario to have an Agent send an in-app message to the applicant and verify its entry point, recipient, and delivery result.'
keywords: 'NocoBase,notifications,approval,in-app,Agent,workflow'
---

# 5. Send notifications

After an order is approved or rejected, the applicant needs to know the result and return to the order to see its details. This chapter uses an in-app message to show how to describe the business rules to an application Agent, confirm where the notification appears, and check the delivery result.

## Before you start

- The previous chapters have set up orders and an approval workflow that distinguishes approved and rejected states.
- The application template registers the notification and in-app notification plugins.
- Prepare an applicant account and a supervisor account to verify that recipients cannot see one another's notifications.

This example uses in-app messages, so you do not need to configure email or a group bot. See [Notifications](../capabilities/notification.md) for notification channels, administrator test sends, and delivery logs.

## Ask the Agent to connect the approval result

Give the following request to your application Agent, replacing the page name with the one used in the previous chapters:

```text
Notify the applicant when the current order approval workflow finishes.

When the approval result changes to approved or rejected, send an in-app message to the applicant for that order. Include the result and order number. Clicking the message should open the order detail page. Do not send notifications for pending approvals, drafts, or orders whose approval result has not changed.

First check the order and applicant fields, approval workflow, notification plugins, and user permissions. Reuse the notification channel already available in the app. If applicants do not have an entry point for their in-app messages, add a clear "My notifications" entry and make sure a signed-in user can read only messages addressed to them.

Repeated processing of the same approval result for an order must send only one notification. A notification failure must not undo a completed approval. Tell me where to check the failure reason and when it is safe to retry.

When finished, use an applicant account and a supervisor account to verify that the notification goes only to the applicant, opens the correct order, and is not sent more than once when triggered repeatedly.
```

## Expected result

After an applicant submits an order and a supervisor approves or rejects it, the applicant sees the result in **My notifications**. Clicking the message opens the order. Another applicant does not see the first applicant's notification.

![An applicant sees an order approval result in My notifications (Chinese interface)](https://static-docs.nocobase.com/nb3-docs-20260916-tutorial-inbox.png)

<!-- Add a genuine screenshot showing the administrator viewing this order notification's delivery result in Settings → Notifications → Notification logs. -->

## Check the delivery result

1. Sign in as the applicant, create a new order, and submit it.
2. Sign in as the supervisor and approve or reject the order.
3. Sign back in as the applicant and open **My notifications**.
4. Check the message and order link, then refresh the page to confirm the message is still available.
5. Sign in as another applicant and confirm they cannot read the first applicant's notification.

Administrators can inspect notifications and delivery records in **Settings → Notifications → Notification logs**. A successful workflow run only confirms that the business process completed. Administrators still need to confirm that the in-app message was saved for the right recipient. If an email or group bot reports an uncertain result, check the destination before retrying to avoid duplicate messages.

## Extend the example to email or group bots

To add email or instant messaging, have an administrator prepare a sending service or bot and configure its credentials on the server. Then tell the Agent who should receive the message, what it should say, how often it should be sent, and where to test it. See [Notifications](../capabilities/notification.md) for configuration details and precautions.

Next: [Deploy](./deploy.md).
