# 单点登录 (SSO) 集成

NocoBase 提供了完整的单点登录 (Single Sign-On, SSO) 解决方案,支持多种主流认证协议,可以与企业现有的身份认证系统无缝集成。

## 概述

单点登录允许用户使用一组凭据登录多个相关但独立的系统。用户只需登录一次,即可访问所有授权的应用程序,无需重复输入用户名和密码。这不仅提升了用户体验,还增强了系统安全性和管理效率。

## 支持的认证协议

NocoBase 通过插件方式支持以下认证协议和方式:

### 企业级 SSO 协议

- **[SAML 2.0](/auth-verification/auth-saml/)**: 基于 XML 的开放标准,广泛应用于企业级身份认证。适用于需要与企业身份提供商(IdP)集成的场景。

- **[OIDC (OpenID Connect)](/auth-verification/auth-oidc/)**: 基于 OAuth 2.0 的身份认证层,提供现代化的认证和授权机制。支持与主流身份提供商(如 Google、Azure AD 等)集成。

- **[CAS (Central Authentication Service)](/auth-verification/auth-cas/)**: 由耶鲁大学开发的单点登录协议,广泛应用于高校和教育机构。

- **[LDAP](/auth-verification/auth-ldap/)**: 轻量级目录访问协议,用于访问和维护分布式目录信息服务。适用于需要与 Active Directory 或其他 LDAP 服务器集成的场景。

### 第三方平台认证

- **[企业微信](/auth-verification/auth-wecom/)**: 支持企业微信扫码登录和企业微信内免登。

- **[钉钉](/auth-verification/auth-dingtalk/)**: 支持钉钉扫码登录和钉钉内免登。

### 其他认证方式

- **[短信验证码](/auth-verification/auth-sms/)**: 基于手机短信的验证码登录方式。

- **[用户名密码](/auth-verification/auth/)**: NocoBase 内置的基础认证方式。

## 集成步骤

### 1. 安装认证插件

根据您的需求,在插件管理器中找到并安装相应的认证插件。大部分 SSO 认证插件需要单独购买或订阅。

![auth_sso-2025-11-24-08-26-46](https://static-docs.nocobase.com/auth_sso-2025-11-24-08-26-46.png)

例如,安装 SAML 2.0 认证插件:

![](https://static-docs.nocobase.com/6a12f3d8073c47532a4f8aac900e4296.png)

或安装 OIDC 认证插件:

![](https://static-docs.nocobase.com/202411122358790.png)

### 2. 配置认证方式

1. 进入**系统设置 > 用户认证**页面

![](https://static-docs.nocobase.com/202411130004459.png)

2. 点击**添加认证方式**
3. 选择已安装的认证类型(例如 SAML)

![](https://static-docs.nocobase.com/5076fe56086b7799be308bbaf7c4425d.png)

或选择 OIDC:

![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)

4. 根据提示配置相关参数

### 3. 配置身份提供商

每种认证协议都需要配置相应的身份提供商信息:

- **SAML**: 配置 IdP 元数据、证书等

![](https://static-docs.nocobase.com/976b66e589973c322d81dcddd22c6146.png)

- **OIDC**: 配置 Client ID、Client Secret、发现端点等

![](https://static-docs.nocobase.com/202411130006341.png)

- **CAS**: 配置 CAS 服务器地址
- **LDAP**: 配置 LDAP 服务器地址、绑定 DN 等
- **企业微信/钉钉**: 配置应用凭证、Corp ID 等

### 4. 测试登录

配置完成后,建议先进行测试:

1. 退出当前登录
2. 在登录页面选择配置的 SSO 方式

![](https://static-docs.nocobase.com/74963865c9d36a294948e6adeb5b24bc.png)

3. 完成身份提供商的认证流程
4. 验证是否能成功登录 NocoBase

## 用户映射和角色分配

SSO 认证成功后,NocoBase 会自动处理用户账号:

- **首次登录**: 自动创建新用户账号,并从身份提供商同步基本信息(昵称、邮箱等)
- **再次登录**: 使用现有账号登录,可选择是否同步更新用户信息
- **角色分配**: 可配置默认角色,或通过用户信息中的角色字段自动分配角色

## 安全建议

1. **使用 HTTPS**: 确保 NocoBase 部署在 HTTPS 环境下,保护认证数据传输安全
2. **定期更新证书**: 及时更新和轮换 SAML 证书等安全凭据
3. **配置回调地址白名单**: 在身份提供商处正确配置 NocoBase 的回调地址
4. **最小权限原则**: 为 SSO 用户分配合适的角色和权限
5. **启用日志审计**: 记录和监控 SSO 登录行为

## 常见问题

### SSO 登录失败?

1. 检查身份提供商配置是否正确
2. 验证回调地址是否正确配置
3. 查看 NocoBase 日志获取详细错误信息
4. 确认证书和密钥是否有效

### 用户信息没有同步?

1. 检查身份提供商返回的用户属性
2. 验证字段映射配置是否正确
3. 确认是否开启了用户信息同步选项

### 如何同时支持多种认证方式?

NocoBase 支持同时配置多种认证方式,用户可以在登录页面选择合适的方式登录。

## 相关资源

- [用户认证文档](/auth-verification/auth/)
- [API 密钥认证](/integration/api-keys/)
- [用户和权限管理](/plugins/@nocobase/plugin-users/)
