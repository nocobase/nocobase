---
title: 'Quick start'
description: 'Use a sales scenario to add mail to a customer record and verify sending and replies.'
keywords: 'NocoBase,mail,quick start,Agent,CRM'
---

# Quick start

This guide uses a sales scenario to show what to prepare before connecting mail, how to describe the feature to your Agent, and how to check the result.

## Before you start

- Confirm that the NocoBase Pro Mail plugin is installed and enabled. If it is missing, ask the Agent to check whether Mail is available in your Pro environment; do not replace the plugin with a custom mail page.
- Decide which mailbox provider to connect. Gmail and Microsoft 365 usually require an administrator to prepare an OAuth app. Other providers may use IMAP/SMTP, depending on provider support.
- Make sure customer contacts have email addresses that can be used for matching, and prepare a mailbox for testing.

Provider credentials are usually maintained by an application administrator in deployment configuration; the exact location depends on the installed version. Users connect their own mailboxes from the application's Mail account page. Do not paste passwords, authorization codes, or OAuth secrets into a chat. See [Prepare mail access](./configuration.md) for details.

## Example: handle mail from a customer record

Give the following prompt to your application Agent, and adjust the contact field names and target page to match your app:

```text
Add a mail section to the customer detail page in this NocoBase 3 application so sales reps can view and handle messages related to that customer.

First check whether the Mail Pro plugin is installed and enabled, and read the Mail Skill shipped with the installed version. If the plugin is unavailable, explain what must be installed or enabled. Do not build mail sending and receiving from scratch.

Business rules:
- Show only messages whose sender or recipient address matches an email address on the current customer's contact records.
- Use only mailboxes connected by and accessible to the current user. Do not expose another user's mailboxes or messages to ordinary sales reps.
- Let users read messages, view attachments, and reply from the customer detail page.
- When composing a message, let users select a contact from this customer and use the customer and contact names in the subject or body template.
- If a contact has no email address, addresses are duplicated, or a message matches multiple customers, make the ambiguity clear and avoid linking it incorrectly.

Inspect the existing customer fields and permissions before implementing the page. Tell me where an administrator configures the mail provider and where users connect their own mailboxes. Do not assume these settings are on a Settings page. If OAuth or server details are required, say who should provide them and where they can be entered securely. Never ask me to paste a secret into chat.

When finished, report the page entry point, access rules, and verification results. Confirm that matching messages appear, unrelated messages do not, ordinary users cannot access someone else's mailbox, recipients and customer details are correct when composing, and a test message can be sent and replied to.
```

## Expected result

On a customer detail page, sales reps can see messages matching the customer's contact email addresses, read them, view attachments, and reply without leaving the page. When composing, they can select a contact and use customer details in the message. Each rep continues to see only mailboxes and messages they are authorized to access.

<!-- Add a genuine screenshot of the Mail section on a customer detail page, showing customer details, matching messages, and where to read or reply. -->

## Verify the result

- Connect a test mailbox and confirm that messages to or from the customer's contacts appear on the customer page.
- Confirm that unrelated messages are not shown and contacts without an email address are not matched incorrectly.
- Sign in as another ordinary user and confirm they cannot view the first user's mailbox or messages.
- Send a test message and reply to an incoming message; verify the content and attachments in the receiving mailbox.

If provider access is not configured yet, start with [Prepare mail access](./configuration.md). For signatures, templates, and other business pages, continue to [Further use](./usage.md).
