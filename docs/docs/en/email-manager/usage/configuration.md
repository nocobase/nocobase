---
pkg: "@nocobase/plugin-email-manager"
---

# Block Configuration

## Email Messages Block

### Add Block

On the configuration page, click the **Create block** button, and select the **Email messages (All)** or **Email messages (Personal)** block to add an email messages block.


![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_03_58_PM.png)


### Field Configuration

Click the **Fields** button of the block to select the fields to be displayed. For detailed operations, refer to the field configuration method for tables.


![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_37_PM.png)


### Data Filter Configuration

Click the configuration icon on the right side of the table and select **Data scope** to set the data range for filtering emails.


![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_39_PM.png)


You can filter emails with the same suffix through variables:

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_41_PM.png)


## Email Details Block

First, enable the **Enable click to open** feature on a field in the email messages block:

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_45_PM.png)


Add the **Email details** block in the pop-up window:

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_46_PM.png)


You can view the detailed content of the email:

![](https://static-docs.nocobase.com/email-manager/Loading--10-31-2025_04_49_PM.png)


You can configure the required buttons at the bottom.

## Send Email Block

There are two ways to create a send email form:

1. Add a **Send email** button at the top of the table:
   
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_52_PM.png)


2. Add a **Send email** block:
   
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_53_PM.png)


Both methods can create a complete send email form:

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_53_PM%20(1)
.png)

Each field in the email form is consistent with a regular form and can be configured with **Default value** or **Linkage rules**, etc.

> The reply and forward forms at the bottom of the email details carry some default data processing, which can be modified through the **FlowEngine**.