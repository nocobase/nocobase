---
pkg: '@nocobase/plugin-verification-totp-authenticator'
---

# 验证：TOTP 认证器

## 介绍

TOTP 认证器验证支持用户绑定任意符合 TOTP (Time-based One-Time Password) 规范 (<a href="https://www.rfc-editor.org/rfc/rfc6238" target="_blank">RFC-6238</a>)的认证器，通过基于时间的一次性密码 (TOTP) 进行身份验证。

## 管理员配置

进入验证管理页面。

![](https://static-docs.nocobase.com/202502271726791.png)

添加 - TOTP 验证器

![](https://static-docs.nocobase.com/202502271745028.png)

除了唯一标识和标题以外，TOTP 验证器不需要其他配置。

![](https://static-docs.nocobase.com/202502271746034.png)

## 用户绑定

添加验证器后，用户可以在个人中心的验证管理中绑定 TOTP 认证器。

![](https://static-docs.nocobase.com/202502272252324.png)

:::warning
插件暂时未提供恢复码机制，绑定 TOTP 认证器后请用户妥善保管。如不小心丢失了认证器，可以使用其他验证方式验证身份，也通过其他验证方式解绑后重新绑定。
:::

## 用户解绑

解绑认证器需要通过已绑定的验证方式，进行验证。

![](https://static-docs.nocobase.com/202502282103205.png)
