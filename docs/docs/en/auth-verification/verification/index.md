# Verification

:::info{title=Note}
Starting from `1.6.0-alpha.30`, the original **Verification Code** feature has been upgraded to **Verification Management**, which supports managing and integrating different user identity verification methods. After a user binds a corresponding verification method, they can perform identity verification in necessary scenarios. This feature is planned to be stably supported starting from `1.7.0`.
:::

<PluginInfo name="verification"></PluginInfo>

## Introduction

**The Verification Management Center supports managing and integrating different user identity verification methods.** For example:

- SMS verification code - provided by the verification plugin by default. Reference: [Verification: SMS](./sms)
- TOTP authenticator - Reference: [Verification: TOTP Authenticator](../verification-totp/)

Developers can also extend other verification types in the form of plugins. Reference: [Extend Verification Types](./dev/type)

**Users can bind corresponding verification methods to perform identity verification in necessary scenarios.** For example:

- SMS verification code login - Reference: [Authentication: SMS](./sms)
- Two-Factor Authentication (2FA) - Reference: [Two-Factor Authentication (2FA)](../2fa)
- Secondary verification for risky operations - To be supported in the future

Developers can also integrate identity verification into other necessary scenarios in the form of extension plugins. Reference: [Extend Verification Scenarios](./dev/scene)

**Difference and connection between the Verification module and the User Authentication module:** The User Authentication module is mainly responsible for identity authentication in user login scenarios, where processes like SMS login and Two-Factor Authentication rely on the verifiers provided by the Verification module; the Verification module is responsible for identity verification under various risky operations, and user login is one of the scenarios of risky operations.


![](https://static-docs.nocobase.com/202502262315404.png)



![](https://static-docs.nocobase.com/202502262315966.png)