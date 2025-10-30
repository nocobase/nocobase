# Two-Factor Authentication (2FA)

<PluginInfo name="two-factor-authentication" licenseBundled="enterprise"></PluginInfo>

## Introduction

Two-Factor Authentication (2FA) is an extra authentication measure used when logging into an application. When 2FA is enabled for an application, users need to provide another form of authentication when logging in with a password, such as an OTP code, TOTP, etc.

:::info{title=Note}
Currently, the 2FA process only applies to password logins. If the application has other authentication methods enabled, such as SSO, please use the multi-factor authentication (MFA) protection provided by the corresponding IdP.
:::

## Enable Plugin


![](https://static-docs.nocobase.com/202502282108145.png)


## Administrator Configuration

After enabling the plugin, a 2FA configuration page will be added to the Authenticator Management page.

The administrator needs to check the "Enable Two-Factor Authentication (2FA) for all users" option and select an available type of authenticator to bind. If no authenticators are available, you need to go to the Verification Management page to create a new one first. Reference: [Verification](../verification/index.md)


![](https://static-docs.nocobase.com/202502282109802.png)


## User Login

After 2FA is enabled for the application, when a user logs in with a password, they will enter the 2FA verification process.

If the user has not yet bound any of the specified authenticators, they will be required to bind one. After successful binding, they can enter the application.


![](https://static-docs.nocobase.com/202502282110829.png)


If the user has already bound any of the specified authenticators, they will be required to authenticate through the bound authenticator. After successful verification, they can enter the application.


![](https://static-docs.nocobase.com/202502282110148.png)


After a successful login, users can bind other authenticators on the Verification Management page in their Personal Center.


![](https://static-docs.nocobase.com/202502282110024.png)