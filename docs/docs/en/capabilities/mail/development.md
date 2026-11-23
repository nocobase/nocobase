---
title: 'Developer Reference'
description: 'Integrate mail pages, permissions, and background jobs.'
---

# Developer Reference

Mail brings its own pages and can be extended from customer and project pages. The application owns provider configuration, role grants and business associations. Mail provides the pages, accounts, sending and synchronization.

## Pages

Registering the plugin adds four pages, with no page code in the application:

| Page                                         | Path             | Purpose                                                                  |
| -------------------------------------------- | ---------------- | ------------------------------------------------------------------------ |
| Mail                                         | `/mail`          | Message list, reading, composition and replies, with the unread count.   |
| Team mail                                    | `/mail/team`     | Members' synchronized mail, read only, with optional bulk actions.       |
| Personal settings › Messages › Mail accounts | `/me/mail`       | Connect mailboxes and manage signatures, templates, labels and activity. |
| System settings › Messages › Mail            | `/settings/mail` | Providers, every account's status, sync and send logs, runtime settings. |

Each page can be replaced as a whole by its route name (`mail`, `mailTeam`, `mailAccounts`, `mailSettings`) with `routeComponentOverrides`. `MailWorkspacePage`, `MailAccountsPage` and the components in `@nocobase/app-plugin-mail/client/components` stay available for custom pages.

## Extend the pages

A client plugin resolves `mailExtensionsToken` and registers Provider titles, a panel beside the open message, composer tools, workspace buttons, template variables and a handler called after sending:

```ts
const mail = this.app.container.resolve(mailExtensionsToken);
mail.slots.messageAside.add({ name: 'customer', component: CustomerPanel });
mail.templateVariables.add({
  key: 'customer',
  label: 'Customer',
  resolve: ({ to }) => findCustomer(to),
});
```

## Connect business data

The application defines associations between messages and business records. For example, match customer correspondence by contact email, or populate a project template with project name and progress. Specify the matching fields, recipient source, and whether sending requires confirmation.

Use `useMailClient()` for client operations and `mailServiceToken` for the server service. Refer to the application's OpenAPI document for HTTP request and response contracts.

## Configure access

| Permission              | Levels        | Purpose                                                                        |
| ----------------------- | ------------- | ------------------------------------------------------------------------------ |
| Mail (`mail.workspace`) | Use           | Personal mail and Mail accounts.                                               |
| Team mail               | View, Process | Read members' mail; Process adds marking read, starring and archiving in bulk. |
| Mail settings           | View, Manage  | Account status and logs; Manage adds retrying and cancelling members' tasks.   |

Grant them on the role permission page. Process and Manage do not include View. Personal account and message operations enforce account ownership. Finished sync and send logs are kept 90 days by default (`mail.logRetentionDays`).

## Providers and background jobs

Register Mail on the server and client and include its configuration factory in application configuration. Maintain provider settings under `mail.providers`. Sending and synchronization use background jobs. Keep the executor running and use a shared job backend for multiple instances.

OAuth also requires a public callback URL and a return page. For IMAP/SMTP limits, see [Mailbox Configuration](./configuration.md#integration-differences).

For signature, template, and business page prompts, see [More Mail Features](./usage.md).
