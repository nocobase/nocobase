# Auth: SMS

## Introduction

The SMS authentication plugin supports users to register through SMS and log in to NocoBase.

> It needs to be used in conjunction with the SMS verification code function provided by the [`@nocobase/plugin-verification` plugin](../verification/index.md)

## Add SMS Authentication

Enter the user authentication plugin management page.

![](https://static-docs.nocobase.com/202411130004459.png)

Add - SMS

![](https://static-docs.nocobase.com/29c8916492fd5e1564a872b31ad3ac0d.png)

## Configuration

![](https://static-docs.nocobase.com/a4d35ec63ba22ae2ea9e3e8e1cbb783d.png)

For the configuration of the SMS verification code function, see the [Verification Plugin (@nocobase/plugin-verification) Documentation](../verification/index.md), the SMS login authentication function will use the configured and set default SMS verification code Provider to send SMS.

Sign up automatically when the user does not exist: When this option is checked, when the user's mobile phone number does not exist, a new user will be registered using the mobile phone number as the nickname.

## Log In

Visit the login page to use.

![](https://static-docs.nocobase.com/8d630739201bc27d8b0de076ab4f75e2.png)
