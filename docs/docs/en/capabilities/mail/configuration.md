---
title: 'Prepare mail access'
description: 'Learn what administrators and mailbox users need to prepare, and ask an Agent to guide the setup.'
keywords: 'NocoBase,mail,mailbox setup,OAuth,IMAP,SMTP,Agent'
---

# Prepare mail access

Mail setup has two parts: an administrator enables the application to connect to a mail provider, and each user connects a mailbox they are authorized to use. If users can already connect their accounts in your app, go straight to [Quick start](./quick-start.md) without setting up the provider again.

## Who prepares what

| Mailbox method         | Application administrator prepares                                                            | Mailbox user does                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Gmail or Microsoft 365 | An available OAuth app, the application URL, and any approval required by the provider        | Selects an account in the app and authorizes access with the provider                              |
| IMAP/SMTP              | The incoming and outgoing server details and connection settings provided by the mail service | Enters an email address, username, and the password or authorization code required by the provider |

### Where to configure it

Provider credentials and server details are application-level settings maintained by an administrator in the app server's `mail.providers` configuration. They are not personal settings for users to enter in a Settings page. Manage secrets securely for your deployment, and do not commit them to the repository. Users connect and authorize their own mailboxes from the application's Mail account page.

<!-- Add genuine screenshots showing where an administrator maintains provider settings and where a user connects a personal mailbox. If provider settings are maintained only in deployment configuration, show a redacted example of that configuration instead of a Settings page. -->

## Ask the Agent to guide setup

Give this prompt to your application Agent and replace the provider and deployment details:

```text
Prepare Mail access for this NocoBase 3 application. The mail provider is [Gmail / Microsoft 365 / IMAP/SMTP], and the application URL is [application URL].

First check whether the Mail Pro plugin is installed and enabled, read the Mail Skill shipped with the installed version, and inspect the existing configuration. Tell me:
1. Where an administrator maintains provider settings and where users connect their personal mailboxes, and whether a Settings page is involved.
2. What information is still needed and whether it must come from the application administrator, mail administrator, or mailbox user.
3. How to confirm the OAuth callback URL or IMAP/SMTP server details and verify that they are correct.

Complete any application-side configuration that can be done safely, and list the steps I must perform on the provider's platform. Never ask me to paste a secret or mailbox password into chat. Tell me where it can be entered securely in the local or deployment environment. Do not guess callback URLs, permission scopes, or configuration fields.

After setup, guide me through connecting a test mailbox. Confirm that authorization returns to the app, initial synchronization works, and messages can be read and sent. If the plugin or mailbox type does not support a capability, explain the limitation instead of replacing it with custom mail logic.
```

The Agent should first explain what needs to be prepared and who needs to act. A person with the right access must still sign in to Google, Microsoft, or the mail provider and approve any organization-level permissions.

## Choose a connection method

- **Gmail or Microsoft 365**: Usually connects through OAuth. An administrator prepares the provider's OAuth app and registers the callback URL generated for the current application.
- **IMAP/SMTP**: Works with mailboxes that provide standard IMAP receiving and SMTP sending. An administrator supplies the server addresses, ports, and connection security; users connect with the credentials required by their provider.

Gmail and Microsoft 365 provide broader synchronization and mailbox-management capabilities. IMAP/SMTP primarily syncs new messages and sends mail. It does not fully sync read, deleted, or moved states from other clients, and it does not support provider drafts, sending aliases, push sync, or moving messages to provider folders. Check the installed version and mail provider for exact capabilities.

## Common questions

### Mail or the account connection entry is missing

Confirm that the deployment provides and enables the NocoBase Pro Mail plugin. Then ask the Agent to check whether a Mail page has been added to the application. Enabling the plugin does not necessarily add a Mail entry to the business navigation.

### OAuth does not return to the application

Ask an administrator to compare the callback URL registered with the provider against the application's public URL, including the scheme, hostname, port, and application path. Have the Agent confirm the callback URL for this deployment; do not copy an example from another environment.

### The mailbox is connected, but no messages appear

Check the initial sync date range, synchronization status, and mailbox authorization. Importing a large mailbox can take time. Synchronization may also stall if application background jobs or the queue are not running; ask the Agent to check service status and sync records.

### Changes made in another mail client do not appear

IMAP/SMTP primarily discovers new messages. It does not guarantee that read, deleted, or moved states from other clients are synchronized, and it cannot move messages to provider folders. If you need these capabilities, check whether Gmail or Microsoft 365 is suitable.

### A send result is uncertain

Check the application's send record and the receiving mailbox before retrying. Do not immediately create and send a new message just because the page timed out; that may send a duplicate.

To add mail to customer, project, or other business pages, continue to [Further use](./usage.md).
