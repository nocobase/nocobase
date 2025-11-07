---
pkg: '@nocobase/plugin-auth-sms'
---

# Auth: SMS

## Introduction

The SMS authentication plugin supports users to register through SMS and log in to NocoBase.

> It needs to be used in conjunction with the SMS verification code function provided by the [`@nocobase/plugin-verification` plugin](../verification/index.md)

## Add SMS Authentication

Enter the user authentication plugin management page.


![](https://static-docs.nocobase.com/202502282112517.png)


Add - SMS


![](https://static-docs.nocobase.com/202502282113553.png)


## New Version Configuration

:::info{title=Note}
The new configuration was introduced in `1.6.0-alpha.30` and is planned for stable support starting from `1.7.0`.
:::


![](https://static-docs.nocobase.com/202502282114821.png)


**Verificator:** Bind an SMS verificator to send SMS verification codes. If no verificator is available, you need to go to the Verification management page to create an SMS verificator first.
See also:

- [Verification](../verification/index.md)
- [Verification: SMS](../verification/sms/index.md)

**Sign up automatically when the user does not exist:** When this option is checked, if the user's phone number does not exist, a new user will be registered using the phone number as the nickname.

## Old Version Configuration


![](https://static-docs.nocobase.com/a4d35ec63ba22ae2ea9e3e8e1cbb783d.png)


The SMS login authentication feature will use the configured and default SMS verification code Provider to send text messages.

**Sign up automatically when the user does not exist:** When this option is checked, if the user's phone number does not exist, a new user will be registered using the phone number as the nickname.

## Log In

Visit the login page to use.


![](https://static-docs.nocobase.com/8d630739201bc27d8b0de076ab4f75e2.png)