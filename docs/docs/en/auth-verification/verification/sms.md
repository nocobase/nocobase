# Verification: SMS

<PluginInfo name="verification"></PluginInfo>

## Introduction

SMS verification code is a built-in verification type used to generate a one-time password (OTP) and send it to the user via SMS.

## Add SMS Verifier

Go to the verification management page.


![](https://static-docs.nocobase.com/202502271726791.png)


Add - SMS OTP


![](https://static-docs.nocobase.com/202502271726056.png)


## Admin Configuration


![](https://static-docs.nocobase.com/202502271727711.png)


Currently supported SMS service providers are:

- <a href="https://www.aliyun.com/product/sms" target="_blank">Alibaba Cloud SMS</a>
- <a href="https://cloud.tencent.com/product/sms" target="_blank">Tencent Cloud SMS</a>

When configuring the SMS template in the service provider's admin console, you need to reserve a parameter for the SMS verification code.

- Alibaba Cloud configuration example: `Your verification code is: ${code}`

- Tencent Cloud configuration example: `Your verification code is: {1}`

Developers can also extend other SMS service providers as plugins. See: [Extend SMS Service Providers](./dev/sms-type)

## User Binding

After adding the verifier, users can bind their verification phone number in their personal verification management.


![](https://static-docs.nocobase.com/202502271737016.png)



![](https://static-docs.nocobase.com/202502271737769.png)



![](https://static-docs.nocobase.com/202502271738515.png)


After successful binding, you can perform identity verification in scenarios where this verifier is bound.


![](https://static-docs.nocobase.com/202502271739607.png)


## User Unbinding

To unbind a phone number, you need to verify your identity using an already bound verification method.


![](https://static-docs.nocobase.com/202502282103205.png)