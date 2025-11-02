---
pkg: '@nocobase/plugin-verification'
---

# Verification

:::info{title=Note}
Starting with `1.6.0-alpha.30`, the original "verification code" feature has been upgraded to "Verification Management", which supports managing and integrating various methods of user verification. Once users bind the corresponding verification method, they can perform identity verification when needed. This feature is planned to be stably supported beginning with version `1.7.0`.
:::



## Introduction

**The Verification Management Center supports managing and integrating various methods of user verification.** For example:

- SMS Verification Code – Provided by the verification plugin by default. Refer to: [Verification: SMS](./sms)
- TOTP Authenticator – Refer to: [Verification: TOTP Authenticator](../verification-totp/)

Developers can also extend other types of verification via plugins. Refer to: [Extending Verification Types](./dev/type)

**Users can perform identity verification when needed after binding the corresponding verification method.** For example:

- SMS Verification Login – Refer to: [Authentication: SMS](../auth-sms/index.md)
- Two-Factor Authentication (2FA) – Refer to: [Two-Factor Authentication (2FA)](../2fa/)
- Secondary Verification for Risk Operations – Future support

Developers can also integrate identity verification into other necessary scenarios by extending plugins. Refer to: [Extending Verification Scenarios](./dev/scene)

**Differences and Relationships Between the Verification Module and the User Authentication Module:** The User Authentication Module is primarily responsible for identity authentication during user login, with processes such as SMS login and two-factor authentication relying on verifiers provided by the Verification Module; meanwhile, the Verification Module handles identity verification for various high-risk operations, with user login being one of those scenarios.


![](https://static-docs.nocobase.com/202502262315404.png)



![](https://static-docs.nocobase.com/202502262315966.png)