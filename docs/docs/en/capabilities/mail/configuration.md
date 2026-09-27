---
title: 'Prepare Mail Access'
description: 'Learn what administrators and mailbox users need to prepare, and ask an Agent to guide the setup.'
keywords: 'NocoBase,mail,mailbox setup,OAuth,IMAP,SMTP,Agent'
---

# Prepare Mail Access

Mail setup has two parts: an administrator enables the application to connect to a provider, and each user connects a mailbox they are authorized to use. If users can already connect accounts in your app, you can build the page from [Quick Start](./quick-start.md) without repeating provider setup.

## Who prepares what

| Mailbox method         | Application administrator prepares                                             | Mailbox user does                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Gmail or Microsoft 365 | An available OAuth app, the application URL, and any provider-admin approval   | Selects an account in the app and authorizes with the provider                                        |
| IMAP/SMTP              | Incoming and outgoing server details and connection settings from the provider | Enters their email address, username, and the password or authorization code required by the provider |

### Where are the settings?

The current Mail connection flow treats provider credentials and server details as application-level settings. An administrator maintains them in the app server's `mail.providers` configuration; these are not personal settings for users to enter in a Settings page. Handle secrets securely according to the deployment environment and do not commit them to the repository. Users connect and authorize their own mailboxes from the application's Mail account page.

If the current Pro release provides a provider Settings page, follow the Mail Skill shipped with that release. Ask the Agent to inspect the installed version and application configuration before giving you the exact location. Never share secrets in chat or commit them to the repository.

<!-- Add genuine screenshots from the current version that distinguish provider setup by an administrator from mailbox connection by a user. Use separate screenshots if these are different screens. -->

## Ask the Agent to guide setup

Give this prompt to your application Agent and replace the provider and deployment details:

```text
Prepare Mail access for this NocoBase 3 application. The mailbox provider is [Gmail / Microsoft 365 / IMAP/SMTP], and the application URL is [application URL].

First check that the Mail Pro plugin is installed and enabled, read the Mail Skill shipped with the installed version, and inspect the existing configuration. Tell me:
1. Where an administrator maintains provider settings and where users connect personal mailboxes, including whether a Settings page is involved.
2. What information is missing and whether it must come from the application administrator, mailbox administrator, or mailbox user.
3. How to determine the OAuth callback URL or IMAP/SMTP server details and verify them.

Complete any application-side configuration that can be done safely, and list the steps I must perform on the provider's platform. Never ask me to paste a secret or mailbox password into chat; tell me where it can be entered securely in the local or deployment environment. Do not guess callback URLs, permission scopes, or configuration fields.

After setup, guide me through connecting a test mailbox. Confirm that authorization returns to the app, initial synchronization works, and messages can be read and sent. If the plugin or mailbox type does not support a capability, explain the limitation instead of replacing it with custom mail logic.
```

The Agent should explain the checklist and who needs to act before making changes. A person with the appropriate access must still sign in to Google, Microsoft, or the mailbox provider and approve any organization-level permissions.

## Choose a connection method

- **Gmail or Microsoft 365**: Usually connects through OAuth. An administrator prepares the provider OAuth app and registers the callback URL generated for the current application.
- **IMAP/SMTP**: Works with mailboxes that provide standard IMAP receiving and SMTP sending. An administrator supplies the server addresses, ports, and connection security; users connect with the credentials required by their provider.

Gmail and Microsoft 365 provide broader synchronization and mailbox-management capabilities. IMAP/SMTP primarily discovers new messages and sends mail; it does not fully synchronize read, deleted, and moved states from other clients, and does not support provider drafts, sending aliases, push sync, or moving messages to provider folders. Check the installed version and provider for exact capabilities.

## FAQ

### Mail or the account connection entry is missing

Confirm that the deployment provides and enables the NocoBase Pro Mail plugin. Then ask the Agent to check whether a Mail page has been added to the application; enabling the plugin does not necessarily add a mail entry to the business navigation.

### OAuth does not return to the application

Ask an administrator to compare the callback URL registered with the provider against the application's public URL, including scheme, hostname, port, and app path. Have the Agent confirm the callback URL for this deployment; do not copy an example from another environment.

### The mailbox connected, but no messages appear

Check the initial-sync date range, synchronization status, and mailbox authorization. Importing a large mailbox can take time. If background jobs or the application queue are not running, synchronization may not finish; ask the Agent to check service health and sync records.

### Changes made in another mail client do not appear

IMAP/SMTP primarily discovers new messages and does not guarantee synchronization of read, deleted, or moved states from other clients. It also cannot move messages to provider folders. If these capabilities matter, check whether Gmail or Microsoft 365 is suitable.

### A send result is uncertain

Check the application's send record and receiving mailbox before retrying. Do not create and send a new message immediately just because the page timed out; it may cause a duplicate.

To add mail to customer, project, or other business pages, continue to [Further Use](./usage.md).
