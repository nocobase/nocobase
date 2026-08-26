---
pkg: "@nocobase/plugin-email-manager"
title: "Email Alias"
description: "Email alias allows you to send emails using different sender identities under the same mailbox account"
keywords: "email alias,sender identity,Send As,Alias,NocoBase"
---

# Email Alias

## Overview

An email alias allows you to send emails using different sender identities under the same mailbox account.

When composing an email, you can choose either the primary email address or any synced alias from the sender selector. When replying, forwarding, or restoring drafts, the system preserves the original sender identity.

![](https://static-docs.nocobase.com/%E5%8F%91%E9%80%81%E9%82%AE%E4%BB%B6-04-02-2026_06_02_PM.png)

> Outlook does not support this feature.

## Alias Sync

After successfully authorizing a Gmail account, the system will automatically sync the available aliases under that mailbox.

If you later add or modify aliases in Gmail, you can go to Email Settings and click **"Sync aliases"** under the **"Sender Name"** configuration to refresh the list.

![](https://static-docs.nocobase.com/Email-settings-04-02-2026_06_04_PM.png)

## Selecting an Alias When Sending

In the email editor, click the sender selector to view the primary email address and all synced aliases under the account.

If the same alias address is associated with multiple accounts, the selector will display the corresponding primary mailbox to help you distinguish which account context is being used.

![](https://static-docs.nocobase.com/%E5%8F%91%E9%80%81%E9%82%AE%E4%BB%B6-04-02-2026_06_02_PM.png)