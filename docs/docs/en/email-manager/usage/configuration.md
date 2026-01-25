---
pkg: "@nocobase/plugin-email-manager"
---

# Block Configuration

## Email Message Block

### Add Block

On the configuration page, click the **Create block** button and select the **Email table** block to add an email message block.

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_09_56_PM.png)

### Field Configuration

Click the **Fields** button of the block to select the fields you need to display. For detailed operations, refer to the table's field configuration.

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_09_58_PM.png)


### Set Data Scope

The block's right-side configuration can select the data scope: all emails or the current logged-in user's emails.

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_09_58_PM%20(1).png)

### Filter Data by Email Address

Click the configuration button on the right side of the email message block and select **Data scope** to set the data range for filtering emails.

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_32_PM.png)

Configure the filter conditions, select the email address field you need to filter, and click **OK** to save.

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_26_PM.png)

The email message block will display emails that meet the filter conditions.

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_29_PM.png)

> Email address filtering is case-insensitive

### Filter Data by Email Domain

Create a field in the business table to store email domain information (type as JSON) for filtering email messages in subsequent operations.

![](https://static-docs.nocobase.com/email-manager/data-source-manager-main-NocoBase-12-02-2025_04_36_PM.png)

Maintain email domain information.

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_38_PM.png)

Click the configuration button on the right side of the email message block and select **Data scope** to set the data range for filtering emails.

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_32_PM.png)

Configure the filter conditions, select the email domain field you need to filter, and click **OK** to save.

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_41_PM.png)

The email message table will display emails that meet the filter conditions.

![](https://static-docs.nocobase.com/email-manager/Emails-12-02-2025_04_48_PM.png)

## Email Detail Block

First, enable the **Enable click to open** feature in the fields of the email message block.

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_10_01_PM.png)

Add an **Email details** block in the pop-up window.

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_10_02_PM.png)

You can view the detailed content of the email.

![](https://static-docs.nocobase.com/email-manager/Email-12-31-2025_10_03_PM.png)

You can customize the buttons you need at the bottom.

> If the current email is in draft status, the draft editing form is displayed by default.

## Email Send Block

There are two ways to create an email sending form:

1. Add a **Send email** button at the top of the table:  
   ![](https://static-docs.nocobase.com/email-manager/User-12-31-2025_10_04_PM.png)

2. Add an **Email send** block:  
   ![](https://static-docs.nocobase.com/email-manager/User-12-31-2025_10_05_PM.png)

Both methods can create a complete email sending form.

![](https://static-docs.nocobase.com/email-manager/User-12-31-2025_10_05_PM%20(1).png)

Each field in the email form is consistent with ordinary forms and can be configured with **default values** or **linkage rules**, etc.


![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_03_58_PM.png)