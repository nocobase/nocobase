---
pkg: '@nocobase/plugin-verification'
---

# Verification: SMS

## Introduction

The SMS verification code is a built-in verification type used to generate a one-time dynamic password (OTP) and send it to the user via SMS.

## Adding an SMS Verifier

Navigate to the verification management page.


![](https://static-docs.nocobase.com/202502271726791.png)


Add - SMS OTP


![](https://static-docs.nocobase.com/202502271726056.png)


## Administrator Configuration


![](https://static-docs.nocobase.com/202502271727711.png)


Currently, the supported SMS service providers are:

- <a href="https://www.aliyun.com/product/sms" target="_blank">Aliyun SMS</a>
- <a href="https://cloud.tencent.com/product/sms" target="_blank">Tencent Cloud SMS</a>

When configuring the SMS template in the service provider's admin panel, you need to reserve a parameter for the verification code.

- Aliyun configuration example: `Your verification code is: ${code}`

- Tencent Cloud configuration example: `Your verification code is: {1}`

Developers can also extend support for other SMS service providers in the form of plugins. See: [Extending SMS Service Providers](./dev/sms-type)

## User Binding

After adding the verifier, users can bind a phone number in their personal verification management.


![](https://static-docs.nocobase.com/202502271737016.png)



![](https://static-docs.nocobase.com/202502271737769.png)



![](https://static-docs.nocobase.com/202502271738515.png)


Once the binding is successful, identity verification can be performed in any scenario that uses this verifier.


![](https://static-docs.nocobase.com/202502271739607.png)


## User Unbinding

Unbinding a phone number requires verification through an existing bound method.


![](https://static-docs.nocobase.com/202502282103205.png)