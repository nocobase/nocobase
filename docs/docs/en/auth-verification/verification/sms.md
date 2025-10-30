# Auth: SMS

<PluginInfo name="verification"></PluginInfo>

## Introduction

The SMS verification code is a built-in verification type used to generate a one-time dynamic password (OTP) and send it to the user via SMS.

## Adding an SMS Verifier

Navigate to the verification management page.

![](https://static-docs.nocobase.com/202502271726791.png)

Click **Add - SMS OTP**

![](https://static-docs.nocobase.com/202502271726056.png)

## Administrator Configuration

![](https://static-docs.nocobase.com/202502271727711.png)

Currently, the supported SMS service providers are:

- <a href="https://www.aliyun.com/product/sms" target="_blank">Aliyun Cloud SMS</a>
- <a href="https://cloud.tencent.com/product/sms" target="_blank">Tencent Cloud SMS</a>

Developers can also extend support for other SMS service providers in the form of plugins. See: [Extending SMS Service Providers](../../../handbook/verification/sms/dev)

## User Binding

After adding the verifier, users can bind a phone number in their personal verification management.

![](https://static-docs.nocobase.com/202502271737016.png)

![](https://static-docs.nocobase.com/202502271737769.png)

![](https://static-docs.nocobase.com/202502271738515.png)

Once the binding is successful, the user can proceed with identity verification in scenarios that have bound the verifier.

![](https://static-docs.nocobase.com/202502271739607.png)

## User Unbinding

To unbind a phone number, verification must be completed using the already bound verification method.

![](https://static-docs.nocobase.com/202502282103205.png)
