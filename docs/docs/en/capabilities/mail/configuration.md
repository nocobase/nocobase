---
title: 'Mailbox Configuration'
description: 'Configure a provider and connect user mailboxes.'
---

# Mailbox Configuration

Administrators configure how the application connects to a mail provider. Users then connect their own mailboxes. If a provider is already available, users can connect from the mailbox accounts page.

## Administrator preparation

| Integration   | Information required                                                                         |
| ------------- | -------------------------------------------------------------------------------------------- |
| IMAP/SMTP     | Incoming and outgoing server addresses, ports, and secure connection settings.               |
| Gmail         | A Google OAuth application, client information, and the application callback URL.            |
| Microsoft 365 | A Microsoft OAuth application, client information, and any required organizational approval. |

The application developer or deployment administrator maintains these settings under `mail.providers` in the server configuration. Users connect personal mailboxes from the application's mailbox accounts page.

For example, give these mailbox.org server settings to your Agent:

```text
Configure mailbox.org integration for the application:
- IMAP server: imap.mailbox.org, port 993, using SSL/TLS.
- SMTP server: smtp.mailbox.org, port 465, using SSL/TLS.
Add a mailbox accounts page where users enter their email address, username, and password and choose a starting date for initial synchronization.
```

For OAuth, administrators register the application's callback URL with the provider and complete any required permission approval.

## Connect your mailbox

Open the mailbox accounts page and click **Connect account**:

- **IMAP/SMTP**: select the provider and enter the address, username, and password or app password required by the provider.
- **Gmail or Microsoft 365**: select the provider, sign in, and authorize access on the provider's page.
- Choose the starting date for importing existing messages.

Enter mailbox passwords in the connection form. Administrators store OAuth secrets in deployment configuration.

## Integration differences

Gmail and Microsoft 365 offer more complete synchronization and organization. IMAP/SMTP primarily imports new messages and sends email. It does not fully synchronize read, delete, or move changes from other clients, and does not support provider drafts, sender aliases, push synchronization, or moves to provider folders. Local application drafts can still save unsent content.

## Common questions

### The application has no mailbox entry

Ask your Agent to integrate Mail and add the mail center and mailbox accounts page to application navigation.

### OAuth does not return to the application

Ask an administrator to check the registered callback URL against the application configuration and ensure the return page is accessible.

### No messages appear after connection

Check that the synchronization starting date includes the messages and that synchronization has completed. Importing a large history takes time. If background jobs are not running, an administrator can inspect synchronization records and application services.
