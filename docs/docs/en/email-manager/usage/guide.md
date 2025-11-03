---
pkg: "@nocobase/plugin-email-manager"
---

# Email Center

## Introduction
After enabling the email plugin, the Email Center will be available by default for account connection, email management, feature configuration, etc.

Click the email message icon in the upper right corner to enter the email management page.


![](https://static-docs.nocobase.com/mail-1733816161753.png)

## Account Linking

### Link Account

Click the "Account setting" button, and in the opened pop-up, click the "Link account" button to select the type of email account you want to link.


![](https://static-docs.nocobase.com/mail-1733816162279.png)


The browser will automatically open the corresponding email login page. Log in to your account and grant the necessary permissions.


![](https://static-docs.nocobase.com/mail-1733816162534.png)


After authorization is complete, you will be redirected back to the NocoBase page for account linking and data synchronization (the first sync may take some time, please wait a moment).


![](https://static-docs.nocobase.com/mail-1733816162794.png)


Once the data synchronization is complete, the current page will automatically close and return to the original email message page, where you can see that the account has been linked.


![](https://static-docs.nocobase.com/mail-1733816163177.png)


Click the overlay area to close the pop-up, and you will see the email list.


![](https://static-docs.nocobase.com/mail-1733816163503.png)


### Delete Account
You can click "Delete" to remove the account and its associated emails.


![](https://static-docs.nocobase.com/mail-1733816163758.png)



## Email Management

### Email Filtering

On the email management page, the left side is the filter area, and the right side is the email list area. By default, it opens to the inbox.


![](https://static-docs.nocobase.com/mail-1733816165536.png)


Emails with the same subject will be grouped, and the subject field will indicate the total number of emails in the conversation.
When some emails within the same conversation match the filter criteria, the root email of the conversation will be displayed, and the type of the current root email will be indicated next to the subject field.


![](https://static-docs.nocobase.com/mail-1733816165797.png)


Unread email subjects will be displayed in bold, and the email icon at the top will show a badge with the number of unread emails.


![](https://static-docs.nocobase.com/mail-1733816166067.png)


### Manually Sync Emails

The current email synchronization interval is 5 minutes. If you want to force a sync, you can click the "Refresh" button.


![](https://static-docs.nocobase.com/mail-1733816166364.png)


### Change Read Status

The "Mark as read" and "Mark as unread" buttons can be used to bulk change the read status of emails.


![](https://static-docs.nocobase.com/mail-1733816166621.png)


### Send Email

Click the "Write email" button at the top to open the compose panel.


![](https://static-docs.nocobase.com/mail-1733816166970.png)


After filling in the relevant information, you can send the email. Currently, attachments are limited to 3MB.


![](https://static-docs.nocobase.com/mail-1733816167214.png)


### View Email

Click the "View" button on a row to see the email details. There are currently two formats: one for a single email, where you can directly see the detailed information.


![](https://static-docs.nocobase.com/mail-1733816167456.png)


The other is for multiple emails with the same subject, which will be displayed as a list by default. You can click to expand or collapse them.


![](https://static-docs.nocobase.com/mail-1733816167750.png)


After clicking to view an email's details, its status will be set to read by default. You can click the "..." button on the right and select "Mark as unread" to change it back to unread.

### Reply to Email

After entering the email details, there is a "Reply" button at the bottom. You can use it to reply. If multiple people are involved, you can click "Reply all" to reply to everyone.


![](https://static-docs.nocobase.com/mail-1733816167998.png)


### Forward Email

You can click the "Forward" button at the bottom to forward the email to others.


![](https://static-docs.nocobase.com/mail-1733816168241.png)