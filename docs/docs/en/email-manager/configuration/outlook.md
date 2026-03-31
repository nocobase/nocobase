---
pkg: "@nocobase/plugin-email-manager"
---

# Microsoft Configuration

### Prerequisites

For users to be able to integrate Outlook email into NocoBase, the system must be deployed on a server that supports access to Microsoft services. The backend will call Microsoft API.

### Register Account

1. Open https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account

2. Log in to your Microsoft account

![](https://static-docs.nocobase.com/mail-1733818625779.png)

### Create Tenant

1. Open https://azure.microsoft.com/zh-cn/pricing/purchase-options/azure-account?icid=azurefreeaccount and log in to your account

2. Fill in basic information and obtain verification code

![](https://static-docs.nocobase.com/mail-1733818625984.png)

3. Fill in other information and continue

![](https://static-docs.nocobase.com/mail-1733818626352.png)

4. Fill in credit card information (can be created later)

![](https://static-docs.nocobase.com/mail-1733818626622.png)

### Get Client ID

1. Click the top menu and select **Microsoft Entra ID**

![](https://static-docs.nocobase.com/mail-1733818626871.png)

2. Select **App registrations** on the left

![](https://static-docs.nocobase.com/mail-1733818627097.png)

3. Click **New registration** at the top

![](https://static-docs.nocobase.com/mail-1733818627309.png)

4. Fill in the information and submit

The name can be anything, select account types as shown in the figure, and Redirect URI can be left blank for now

![](https://static-docs.nocobase.com/mail-1733818627555.png)

5. Obtain the Client ID

![](https://static-docs.nocobase.com/mail-1733818627797.png)

### API Permissions

1. Open the **API permissions** menu on the right

![](https://static-docs.nocobase.com/mail-1733818628178.png)

2. Click the **Add a permission** button

![](https://static-docs.nocobase.com/mail-1733818628448.png)

3. Click **Microsoft Graph**

![](https://static-docs.nocobase.com/mail-1733818628725.png)

![](https://static-docs.nocobase.com/mail-1733818628927.png)

4. Search and add the following permissions, with the final result shown in the image below

    1. `"email"`
    2. `"offline_access"`
    3. `"IMAP.AccessAsUser.All"`
    4. `"SMTP.Send"`
    5. `"offline_access"`
    6. `"User.Read"` (By default)

![](https://static-docs.nocobase.com/mail-1733818629130.png)

### Get Client Secret

1. Click **Certificates & secrets** on the left

![](https://static-docs.nocobase.com/mail-1733818629369.png)

2. Click the **New client secret** button

![](https://static-docs.nocobase.com/mail-1733818629554.png)

3. Fill in the description and expiration time, and add it

![](https://static-docs.nocobase.com/mail-1733818630292.png)

4. Obtain the Client Secret

![](https://static-docs.nocobase.com/mail-1733818630535.png)

5. Copy the Client ID and Client Secret information respectively and fill them into the email configuration page

![](https://static-docs.nocobase.com/mail-1733818630710.png)