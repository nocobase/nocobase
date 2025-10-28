# 认证器管理

## 用户认证管理

用户认证插件安装时，会初始化一个 `密码` 的认证方式，基于用户的用户名和邮箱。

![](https://static-docs.nocobase.com/66eaa9d5421c9cb713b117366bd8a5d5.png)

## 激活认证类型

![](https://static-docs.nocobase.com/7f1fb8f8ca5de67ffc68eff0a65848f5.png)

只有激活的认证类型才会显示在登录页面

![](https://static-docs.nocobase.com/8375a36ef98417af0f0977f1e07345dd.png)

## 用户认证类型

![](https://static-docs.nocobase.com/da4250c0cea343ebe470cbf7be4b12e4.png)

NocoBase 目前支持的用户认证类型有：

- 密码 (Password)，用户认证插件内置
- 短信 (SMS)，[sms-auth 插件](../../auth-sms/index.md) 扩展
- CAS，[cas-auth 插件](../../auth-cas/index.md) 扩展
- SAML，[saml-auth 插件](../../auth-saml/index.md) 扩展
- OIDC，[oidc-auth 插件](../../auth-oidc/index.md) 扩展

除此之外，也可以自己扩展用户认证，参考[开发指南](../dev/guide.md)。
