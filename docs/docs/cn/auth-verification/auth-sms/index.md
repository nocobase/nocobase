---
pkg: '@nocobase/plugin-auth-sms'
---

# 短信认证

## 介绍

短信认证插件支持用户通过短信注册用户，登录 NocoBase.

> 需要配合 [`@nocobase/plugin-verification` 插件](/auth-verification/verification/)提供的短信验证码功能使用

## 添加短信认证

进入用户认证插件管理页面。

![](https://static-docs.nocobase.com/202502282112517.png)

添加 - 短信 (SMS)

![](https://static-docs.nocobase.com/202502282113553.png)

## 新版本配置

:::info{title=提示}
新版配置在 `1.6.0-alpha.30` 开始引入，并计划在 `1.7.0` 起稳定支持。
:::

![](https://static-docs.nocobase.com/202502282114821.png)

**验证器 (Verificator)：** 绑定一个短信验证器，用于发送短信验证码。如果没有可用的验证器，需要先前往验证管理页面，创建短信验证器。  
参考：

- [验证](../verification/index.md)
- [验证：短信](../verification/sms/index.md)

用户不存在时自动注册 (Sign up automatically when the user does not exist): 该选项勾选后，当用户使用的手机号不存在时，将使用手机号作为昵称注册新用户。

## 旧版本配置

![](https://static-docs.nocobase.com/a4d35ec63ba22ae2ea9e3e8e1cbb783d.png)

短信登录认证功能将使用已配置并设置为默认的短信验证码 Provider 来发送短信。

用户不存在时自动注册 (Sign up automatically when the user does not exist): 该选项勾选后，当用户使用的手机号不存在时，将使用手机号作为昵称注册新用户。

## 登录

访问登录页面使用。

![](https://static-docs.nocobase.com/8d630739201bc27d8b0de076ab4f75e2.png)
