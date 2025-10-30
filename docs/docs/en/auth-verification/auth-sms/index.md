# SMS Authentication

## Introduction

The SMS authentication plugin allows users to register and log in to NocoBase via SMS.

> Requires the SMS verification code feature provided by the [`@nocobase/plugin-verification` plugin](/auth-verification/verification/).

## Add SMS Authentication

Go to the User Authentication plugin management page.


![](https://static-docs.nocobase.com/202502282112517.png)


Add - SMS


![](https://static-docs.nocobase.com/202502282113553.png)


## New Version Configuration

:::info{title=Info}
The new configuration was introduced in `1.6.0-alpha.30` and is planned for stable support starting from `1.7.0`.
:::


![](https://static-docs.nocobase.com/202502282114821.png)


**Verificator:** Bind an SMS verificator to send SMS verification codes. If no verificator is available, you need to go to the Verification management page to create an SMS verificator first.  
References:

- [Verification](../verification/index.md)
- [Verification: SMS](../verification/sms/index.md)

Sign up automatically when the user does not exist: When this option is checked, if the phone number used by the user does not exist, a new user will be registered with the phone number as the nickname.

## Old Version Configuration


![](https://static-docs.nocobase.com/a4d35ec63ba22ae2ea9e3e8e1cbb783d.png)


The SMS login authentication feature will use the configured and default SMS verification code Provider to send SMS messages.

Sign up automatically when the user does not exist: When this option is checked, if the phone number used by the user does not exist, a new user will be registered with the phone number as the nickname.

## Login

Visit the login page to use it.


![](https://static-docs.nocobase.com/8d630739201bc27d8b0de076ab4f75e2.png)