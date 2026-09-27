---
title: 'Overview'
description: 'Learn what the Mail plugin does, where it fits, and how to ask an Agent to add mail to your application.'
keywords: 'NocoBase,mail,email,Gmail,Microsoft 365,IMAP,SMTP,Agent'
---

# Mail

The NocoBase Mail plugin lets each user connect their own mailbox to read, organize, reply to, and send messages from a business application. You can build a mail center or ask an Agent to add mail to customer and project pages so that communication and business records stay together.

Mail is a NocoBase Pro plugin. Before using it, confirm that Mail is installed and enabled in your application. If it is missing, ask the Agent to check whether it is available in your Pro environment before continuing.

For approval results, verification codes, and system alerts, use the email channel in [Notifications](../notification.md). Mail is for user-connected mailboxes; Notifications sends messages from the application. They have separate configuration and records.

## What you can do

- Connect multiple personal mailboxes and switch between accounts and folders in one workspace.
- Read conversations and attachments, search messages, and use read status, stars, labels, private notes, and to-do markers.
- Compose, reply to, and forward messages with attachments, signatures, templates, drafts, and scheduled sending.
- Ask an Agent to connect messages to customer, contact, or project pages according to rules you define.

## Where it fits

Mail works well for sales, support, and project teams handling real mailbox conversations inside NocoBase. For example, sales reps can review a contact's correspondence from a customer page and reply without switching applications.

The relationship between mail and business records depends on your workflow. Mail does not guess which customer a message belongs to; tell the Agent whether to match contact email addresses or let users select a record manually.

## Mailbox options and limitations

| Connection method      | Suitable when                                                                           | Keep in mind                                                                                                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gmail or Microsoft 365 | The provider supports OAuth and you want provider drafts, sending aliases, or push sync | An administrator may need to create or configure an OAuth app                                                                                                               |
| IMAP/SMTP              | Your provider offers standard IMAP and SMTP access                                      | Primarily syncs new mail; changes made in other clients are not fully synchronized, and provider drafts, aliases, push sync, and moving messages to folders are unavailable |

An application administrator configures provider access; each user then connects their own mailbox in the app. You do not need to learn the plugin API to get started. Follow [Quick Start](./quick-start.md) and ask the Agent to inspect the installed version and guide any required setup.

## Next steps

| I want to…                                            | Read                                       |
| ----------------------------------------------------- | ------------------------------------------ |
| Add mail to a mail center or customer page            | [Quick Start](./quick-start.md)            |
| Prepare a provider, OAuth app, or mailbox connection  | [Prepare Mail Access](./configuration.md)  |
| Extend templates, access rules, or business workflows | [Further Use](./usage.md)                  |
| Customize or extend the Mail integration              | [Advanced Customization](./development.md) |
