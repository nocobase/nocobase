---
title: 'Further use'
description: 'Use concrete prompts to connect mail with business records, templates, and team workflows.'
keywords: 'NocoBase,mail,business scenarios,templates,permissions,Agent'
---

# Further use

After completing [Quick start](./quick-start.md), tell the Agent how mail should work with your business. Describe who handles which messages on which page, how messages relate to business records, and who may access them. Let the Agent choose an implementation that matches the installed Mail plugin.

## Send mail from an order page

This is useful when employees need to contact customers about an order but should review a message before sending it. Replace the field names with those in your app:

```text
Add a "Contact customer" mail action to the order detail page. Let the user choose a recipient from the contacts linked to the current order. The subject and body can use the order number, customer name, and order status. Show a complete preview and require the employee to confirm the recipient, subject, and body before sending. Do not email customers automatically when an order status changes. Record the send result, and make sure employees can only use mailboxes they are authorized to access. Check the current Mail Skill and order fields before implementing. Tell me first if the installed version has any limitations with template variables or send records.
```

**Expected result:** The employee starts a message from the order page with the recipient and order details filled in, reviews it before sending, and can check the result afterward.

## Set up team signatures and templates

Use this for consistent company introductions, customer support details, or common replies. Tell the Agent which content an administrator maintains and which details employees may personalize. Avoid hard-coding template text into a page.

```text
Set up reusable email signatures and templates for the sales team. Sales reps can use templates maintained by the company while keeping their own name, title, and contact details. Let them review the final message before sending. Use the management options supported by the installed Mail plugin, and tell me who maintains the templates and where employees select them. Do not put secrets or private customer data in a template.
```

**Expected result:** Selecting a template fills in its subject and body. Personal details and fields from the current business record appear correctly, and employees can still edit and review the message before sending.

<!-- Add genuine screenshots showing the mail action on a business record, template selection, and the pre-send preview. Two screenshots may be clearer. -->

## Define team visibility

Use this when managers need to track team activity. First decide whether "view progress" also means reading message content; these should not be treated as the same permission by default.

```text
Set up mail access for the sales team: each sales rep can access only messages in their own connected mailboxes. Managers can view team processing status and send results, but must not read message bodies or attachments unless I explicitly approve that. Check whether the installed Mail plugin and application permissions can separate these scopes. Show me the proposed access rules for confirmation before implementing them. Do not rely on hiding a page or button as access control.
```

**Expected result:** Sales reps handle only their own mailboxes, and managers receive only the approved management scope. If the current version cannot safely separate processing status from message content, the Agent should explain the limitation instead of broadening manager access.

## Everyday considerations

- Choose an appropriate date range when connecting a mailbox for the first time. Importing more history usually takes longer.
- Refreshing a page only displays content already synchronized to the application. Use the available sync action to fetch new messages.
- IMAP/SMTP has limited synchronization. See [Choose a connection method](./configuration.md#choose-a-connection-method) for details.
- If a send result is uncertain, check the receiving mailbox and original send record before retrying to avoid duplicates.
- For approval results, verification codes, or system alerts—not correspondence through a user's personal mailbox—use [Notifications](../notification.md).

For custom Mail pages, permissions, or provider extensions, see [Advanced customization](./development.md).
