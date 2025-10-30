### Authentication - WeCom

<PluginInfo commercial="true" name="wecom"></PluginInfo>

## Overview

The **WeCom** plugin allows users to log in to NocoBase using their WeCom accounts.

## Activating the Plugin

![](https://static-docs.nocobase.com/202406272056962.png)

## Creating and Configuring a WeCom Custom App

Log in to the WeCom admin console and create a custom WeCom application.

![](https://static-docs.nocobase.com/202406272101321.png)

![](https://static-docs.nocobase.com/202406272102087.png)

Click the app to enter its details page. Scroll down and click **"WeCom Authorized Login"**.

![](https://static-docs.nocobase.com/202406272104655.png)

Set the authorized callback domain to the domain of the NocoBase application.

![](https://static-docs.nocobase.com/202406272105662.png)

Return to the app's details page and click **"Web Authorization and JS-SDK"**.

![](https://static-docs.nocobase.com/202406272107063.png)

Configure and verify the callback domain name for the app's OAuth 2.0 web authorization feature.

![](https://static-docs.nocobase.com/202406272107899.png)

On the app's details page, click **"Trusted Enterprise IPs"**.

![](https://static-docs.nocobase.com/202406272108834.png)

Set the IP addresses of the NocoBase application.

![](https://static-docs.nocobase.com/202406272109805.png)

## Retrieving Keys from the WeCom Admin Console

In the WeCom admin console, go to **My Enterprise** and copy the **"Enterprise ID"**.

![](https://static-docs.nocobase.com/202406272111637.png)

In the admin console, navigate to **App Management**. Access the details of the app created earlier and copy the AgentId and Secret.

![](https://static-docs.nocobase.com/202406272122322.png)

## Adding WeCom Authentication in NocoBase

Navigate to the user authentication plugin management page.

![](https://static-docs.nocobase.com/202406272115044.png)

Add new - WeCom

![](https://static-docs.nocobase.com/202406272115805.png)

### Configuration

![](https://static-docs.nocobase.com/202412041459250.png)

| Configuration Item                                                                                   | Description                                                                                          | Version Requirement |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------- |
| When a phone number does not match an existing user, <br />should a new user be created automatically | Automatically create a new user if the phone number doesn't match an existing user.                 | -                   |
| Company ID                                                                                            | Enterprise ID, obtained from the WeCom admin console.                                               | -                   |
| AgentId                                                                                               | Obtained from the custom app configuration in the WeCom admin console.                              | -                   |
| Secret                                                                                                | Obtained from the custom app configuration in the WeCom admin console.                              | -                   |
| Origin                                                                                                | The domain name of the current application.                                                         | -                   |
| Workbench application redirect link                                                                   | The application path to redirect to after successful login.                                          | `v1.4.0`            |
| Automatic login                                                                                       | Automatically log in when opening the app link in the WeCom browser. Only one authenticator can enable this. | `v1.4.0`            |
| Workbench application homepage link                                                                   | The homepage link of the workbench app.                                                              | -                   |

## Configuring the WeCom Application Homepage

:::info
For versions `v1.4.0` and later, when enabling the "Automatic Login" option, the app homepage link can be simplified to: `https://<url>/<path>`. For example: `https://example.nocobase.com/admin`.

Separate configurations can be set for mobile and desktop, such as `https://example.nocobase.com/m` for mobile and `https://example.nocobase.com/admin` for desktop.
:::

Access the WeCom admin console and paste the copied workbench application homepage link into the corresponding application's homepage field.

![](https://static-docs.nocobase.com/202406272123631.png)

![](https://static-docs.nocobase.com/202406272123048.png)

## Logging In

Visit the login page and click the button below the login form to initiate third-party login.

![](https://static-docs.nocobase.com/202406272124608.png)

:::warning
Due to restrictions on sensitive information like phone numbers in WeCom, authorization can only be completed within the WeCom client. For first-time logins, follow the steps below to complete the initial authorization within the WeCom client.
:::

## First-Time Login

Open the WeCom client, navigate to the workbench, scroll to the bottom, and click the app to access the previously entered application homepage. This completes the first-time authorization and enables WeCom login within the NocoBase application.

<img src="https://static-docs.nocobase.com/202406272131113.png" width="400" />
