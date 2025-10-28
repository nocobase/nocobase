# 验证

:::info{title=提示}
`1.6.0-alpha.30` 开始，原**验证码**功能升级为**验证管理**，支持管理和接入不同的用户身份验证方式，用户绑定对应的验证方式后，可以在必要的场景下进行身份验证。该功能计划在 `1.7.0` 起开始稳定支持。
:::

<PluginInfo name="verification"></PluginInfo>

## 介绍

**验证管理中心支持管理和接入不同的用户身份验证方式。** 比如：

- 短信验证码 - 由验证插件默认提供。参考：[验证：短信](../../handbook/verification/sms)
- TOTP 认证器 - 参考：[验证：TOTP 认证器](../verification-totp-authenticator/index.md)

开发者也可以以插件的形式扩展其他验证类型。参考：[扩展验证类型](../../handbook/verification/dev/type)

**用户绑定对应的验证方式，可以在必要的场景下进行身份验证。** 比如：

- 短信验证码登录 - 参考：[认证：短信](../auth-sms/index.md)
- 双因素身份认证 (2FA) - 参考：[双因素身份认证 (2FA)](../two-factor-authentication/index.md)
- 风险操作二次验证 - 未来支持

开发者也可以以扩展插件的形式，将身份验证对接到其他必要的场景中。参考：[扩展验证场景](../../handbook/verification/dev/scene)

**验证模块和用户认证模块的区别和联系：** 用户认证模块主要负责用户登录场景下的身份认证，其中短信登录、双因素身份认证等流程依赖验证模块提供的验证器；验证模块负责的是各种风险操作下的身份验证，用户登录是风险操作的场景之一。

![](https://static-docs.nocobase.com/202502262315404.png)

![](https://static-docs.nocobase.com/202502262315966.png)
