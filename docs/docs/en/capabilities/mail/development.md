---
title: 'Advanced Customization'
description: 'Ask an Agent to customize business pages, access rules, and provider extensions based on the installed Mail plugin.'
keywords: 'NocoBase,mail,advanced customization,plugin,permissions,Agent'
---

# Advanced Customization

This page is for requirements beyond a basic mail center. In most cases, describe the business goal and access rules, then ask the Agent to read the Mail Skill shipped with the installed version and use the plugin's existing capabilities. Do not ask it to rebuild mailbox authorization, sending, receiving, or synchronization from scratch.

## Customize a business page

Use this when mail belongs on a customer, project, or order detail page, or when message content should use values from a business record. Your prompt should explain:

- How messages relate to business records, such as matching a contact's email address or letting users select a record manually.
- Which fields may be used for filtering or composing, and who can access that business data.
- Which actions the page should support, such as reading, replying, attaching files, or composing a message.
- Whether users must preview or confirm before sending, and where they can check send results.

Give the Agent a prompt like this:

```text
Customize [business page] with [mail capability] using the installed Mail plugin. First read the Mail Skill shipped with the installed version, inspect the application's data model and permissions, and tell me the linking rule and page design. Use only mailboxes connected by and accessible to the current user. Find messages using [explicit matching rule]. When composing, allow only [explicit list of business fields]. Sending requires [preview / confirmation / no extra confirmation]. Do not invent fields, broaden access, or rebuild mail features already provided by the plugin. When finished, explain the entry point, user scope, and how to verify the result.
```

When matching by email address, the same address may appear on several contacts or customer records. Ask the Agent to define how it handles duplicates, missing addresses, and multiple matches to avoid linking a message to the wrong record.

## Define access and production entry points

Mail access involves personal mailboxes and message content. State which roles may connect accounts, read messages, manage team status, or handle all-user mail. Personal mailbox operations should remain within the mailbox owner's scope; hiding a page or button is not a substitute for server-side authorization.

If production users need to connect accounts through OAuth, ask the Agent to confirm which production page users return to after authorization, that the page is accessible, and how authorization failures are handled. Adding a mail workspace to a page alone does not guarantee that production account connection is complete.

## Extend providers or credential protection

Gmail, Microsoft 365, and IMAP/SMTP are common built-in connection methods. Supporting another provider, replacing credential storage, or sending mail from a business service is plugin development—not ordinary page setup.

```text
I need to extend Mail for this application: [describe the provider protocol, credential-protection requirement, or business sending workflow]. First inspect the Mail Skill shipped with the installed version, its public interfaces, and the application architecture. Explain which parts are supported extension points and which require new code. Cover mailbox authorization, account ownership, permission checks, credential security, duplicate-send protection, and error handling. Show me the approach and risks before implementing it. Do not write directly to Mail plugin tables or bypass the Mail service to call a provider.
```

Never put credentials in frontend code, chat, or version control. If OAuth or mailbox credentials need encryption at rest, have the person responsible for application security confirm the deployment environment, key management, and data migration requirements first.

## Review the delivery

After code customization, ask the Agent to explain and verify that:

- Ordinary users can access only mailboxes, messages, and attachments they are authorized to use.
- Business-record matching handles missing addresses, duplicates, and multiple matches.
- OAuth success and failure both return users to an accessible production page.
- An uncertain send result does not trigger an automatic duplicate; users can inspect the original send record and decide what to do.
- Attachments, template variables, and message bodies use only data the current user is allowed to access.

For provider prerequisites, see [Prepare Mail Access](./configuration.md). For common business prompts, see [Further Use](./usage.md).
