---
pkg: '@nocobase/plugin-verification-totp-authenticator'
---

# Verification: TOTP Authenticator

## Introduction

The TOTP Authenticator allows users to bind any authenticator that complies with the TOTP (Time-based One-Time Password) specification (<a href="https://www.rfc-editor.org/rfc/rfc6238" target="_blank">RFC-6238</a>), and perform identity verification using a time-based one-time password (TOTP).

## Administrator Configuration

Navigate to the Verification Management page.


![](https://static-docs.nocobase.com/202502271726791.png)


Add - TOTP Authenticator


![](https://static-docs.nocobase.com/202502271745028.png)


Apart from a unique identifier and title, no additional configuration is required for the TOTP authenticator.


![](https://static-docs.nocobase.com/202502271746034.png)


## User Binding

After adding the authenticator, users can bind the TOTP authenticator in their personal verification management area.


![](https://static-docs.nocobase.com/202502272252324.png)


:::warning
The plugin does not currently provide a recovery code mechanism. Once the TOTP authenticator is bound, users are advised to keep it secure. If the authenticator is accidentally lost, they can use an alternative verification method to verify their identity, unbind the authenticator, and then rebind it.
:::

## User Unbinding

Unbinding the authenticator requires verification using the already bound verification method.


![](https://static-docs.nocobase.com/202502282103205.png)