# Verification: TOTP Authenticator

<PluginInfo name="verification-totp-authenticator" licenseBundled="enterprise"></PluginInfo>

## Introduction

TOTP authenticator verification supports users binding any authenticator that complies with the TOTP (Time-based One-Time Password) specification (<a href="https://www.rfc-editor.org/rfc/rfc6238" target="_blank">RFC-6238</a>) for authentication via a Time-based One-Time Password (TOTP).

## Admin Configuration

Go to the verification management page.


![](https://static-docs.nocobase.com/202502271726791.png)


Add - TOTP Authenticator


![](https://static-docs.nocobase.com/202502271745028.png)


Besides the unique identifier and title, the TOTP authenticator requires no other configuration.


![](https://static-docs.nocobase.com/202502271746034.png)


## User Binding

After adding the authenticator, users can bind a TOTP authenticator in the verification management section of their personal center.


![](https://static-docs.nocobase.com/202502272252324.png)


:::warning
The plugin does not currently provide a recovery code mechanism. After binding a TOTP authenticator, please ask users to keep it safe. If the authenticator is accidentally lost, other verification methods can be used to verify identity, and it can also be unbound and re-bound through other verification methods.
:::

## User Unbinding

Unbinding an authenticator requires verification through a previously bound verification method.


![](https://static-docs.nocobase.com/202502282103205.png)