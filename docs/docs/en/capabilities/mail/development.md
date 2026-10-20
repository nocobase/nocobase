---
title: 'Developer Reference'
description: 'Integrate mail pages, permissions, and background jobs.'
---

# Developer Reference

Mail can be a standalone workspace or part of customer and project pages. The application owns page entries, provider configuration, and business associations. Mail provides account, sending, and synchronization capabilities.

## Integrate pages

`@nocobase/app-plugin-mail/client` exports two complete page components:

| Component           | Purpose                                                            |
| ------------------- | ------------------------------------------------------------------ |
| `MailWorkspacePage` | Message list, reading, composition, and replies.                   |
| `MailAccountsPage`  | Mailbox connection, account management, signatures, and templates. |

Mount pages in application routes and add navigation entries. For custom composition, use public components from `@nocobase/app-plugin-mail/client/components`.

A mail center page can reuse the workspace directly:

```tsx
export { MailWorkspacePage as default } from '@nocobase/app-plugin-mail/client';
```

## Connect business data

The application defines associations between messages and business records. For example, match customer correspondence by contact email, or populate a project template with project name and progress. Specify the matching fields, recipient source, and whether sending requires confirmation.

Use `useMailClient()` for client operations and `mailServiceToken` for the server service. Refer to the application's OpenAPI document for HTTP request and response contracts.

## Configure access

| Resource          | Purpose                                                                  |
| ----------------- | ------------------------------------------------------------------------ |
| `mail.workspace`  | Personal mail workspace.                                                 |
| `mail.admin`      | Administrative account overview and sending and synchronization records. |
| `mail.management` | Cross-user mail management.                                              |

Personal account and message operations enforce account ownership. Grant the relevant permissions to application roles and declare access rules for business pages separately.

## Providers and background jobs

Register Mail on the server and client and include its configuration factory in application configuration. Maintain provider settings under `mail.providers`. Sending and synchronization use background jobs. Keep the executor running and use a shared job backend for multiple instances.

OAuth also requires a public callback URL and a return page. For IMAP/SMTP limits, see [Mailbox Configuration](./configuration.md#integration-differences).

For signature, template, and business page prompts, see [More Mail Features](./usage.md).
