---
pkg: '@nocobase/plugin-two-factor-authentication'
---

# Two-Factor Authentication (2FA)

## Introduction

Two-Factor Authentication (2FA) is an additional security measure used during application login. When 2FA is enabled, users are required to provide an extra form of authentication—such as an OTP code, TOTP, etc.—in addition to their password.

:::info{title=Note}
Currently, the 2FA process applies only to password-based logins. If your application has enabled SSO or other authentication methods, please use the multi-factor authentication (MFA) provided by the respective IdP.
:::

## Enable Plugin


![](https://static-docs.nocobase.com/202502282108145.png)


## Administrator Configuration

After enabling the plugin, a 2FA configuration sub-page will be added to the Authenticator management page.

Administrators must check the "Enforce two-Factor authentication (2FA) for all users" option and select an available type of authenticator to bind. If no authenticators are available, please first create a new authenticator on the verification management page. See [Verification](../verification/index.md) for details.


![](https://static-docs.nocobase.com/202502282109802.png)


## User Login

Once 2FA is enabled, when users log in using a password, they will enter the 2FA verification process.

If a user has not yet bound any of the specified authenticators, they will be prompted to bind one. Once the binding is successful, they can access the application.


![](https://static-docs.nocobase.com/202502282110829.png)


If a user has already bound one of the specified authenticators, they will be required to verify their identity using the bound authenticator. Upon successful verification, they can access the application.


![](https://static-docs.nocobase.com/202502282110148.png)


After logging in, users can bind additional authenticators on the verification management page in their personal center.


![](https://static-docs.nocobase.com/202502282110024.png)