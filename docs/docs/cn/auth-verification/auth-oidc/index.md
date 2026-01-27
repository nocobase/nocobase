---
pkg: '@nocobase/plugin-auth-oidc'
---

# 认证：OIDC

## 介绍

认证：OIDC 插件遵循 OIDC (Open ConnectID) 协议标准，使用授权码模式 (Authorization Code Flow), 实现用户使用第三方身份认证服务商 (IdP) 提供的账号登录 NocoBase.

## 激活插件

![](https://static-docs.nocobase.com/202411122358790.png)

## 添加 OIDC 认证

进入用户认证插件管理页面。

![](https://static-docs.nocobase.com/202411130004459.png)

添加 - OIDC

![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)

## 配置

### 基础配置

![](https://static-docs.nocobase.com/202411130006341.png)

| 配置                                               | 说明                                                                                                                            | 版本           |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| Sign up automatically when the user does not exist | 当找不到可匹配绑定的已有用户时，是否自动创建新用户。                                                                            | -              |
| Issuer                                             | issuer 由 IdP 提供，通常以 `/.well-known/openid-configuration` 结尾。                                                           | -              |
| Client ID                                          | 客户端ID                                                                                                                        | -              |
| Client Secret                                      | 客户端密钥                                                                                                                      | -              |
| scope                                              | 选填，默认为 `openid email profile`。                                                                                           | -              |
| id_token signed response algorithm                 | id_token 的签名方法，默认为 `RS256`。                                                                                           | -              |
| Enable RP-initiated logout                         | 启用 RP-initiated logout, 当用户注销登录时注销 IdP 登录状态，IdP 注销的回调填写[使用](#使用)中提供的 Post logout redirect URL。 | `v1.3.44-beta` |

### 字段映射

![](https://static-docs.nocobase.com/92d63c8f6f4082b50d9f475674cb5650.png)

| 配置                            | 说明                                                                                                                 |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Field Map                       | 字段映射。Nocobase 端目前可供映射的字段有昵称、邮箱和手机号。默认昵称使用 `openid`。                                 |
| Use this field to bind the user | 用于和已有用户匹配绑定的字段，可选择邮箱或用户名，默认为邮箱。需要IdP携带的用户信息包含 `email` 或 `username` 字段。 |

### 高级配置

![](https://static-docs.nocobase.com/202411130013306.png)

| 配置                                                              | 说明                                                                                                                                                                                     | 版本           |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| HTTP                                                              | NocoBase 回调地址是否为 http 协议，默认 `https`。                                                                                                                                        | -              |
| Port                                                              | NocoBase 回调地址端口，默认为 `443/80`。                                                                                                                                                 | -              |
| State token                                                       | 用于校验请求来源，防止 CSRF 攻击。可以填写一个固定值，**强烈建议留空，会默认生成随机值。如果要使用固定值，请自行评估你的使用环境和安全风险。**                                           | -              |
| Pass parameters in the authorization code grant exchange          | 在使用 code 交换 token 的时候，部分 IdP 可能会要求传递 Client ID 或者 Client Secret 作为参数，可以勾选并填写对应的参数名。                                                               | -              |
| Method to call the user info endpoint                             | 请求获取用户信息的 API 时的 HTTP 方法。                                                                                                                                                  | -              |
| Where to put the access token when calling the user info endpoint | 请求获取用户信息的 API 时 access token 的传递方式。<br/>- Header - 请求头，默认。<br />- Body - 请求体, 配合 `POST` 方法使用。<br />- Query parameters - 请求参数，配合 `GET` 方法使用。 | -              |
| Skip SSL verification                                             | 在请求 IdP API 时跳过 SSL 验证。**这个选项将使你的系统暴露在中间人攻击的风险之下，请在明确知道这个选项的用途的时候才勾选。强烈不推荐在生产环境下使用这个设置。**                         | `v1.3.40-beta` |

### 使用

![](https://static-docs.nocobase.com/202411130019570.png)

| 配置                     | 说明                                                                           |
| ------------------------ | ------------------------------------------------------------------------------ |
| Redirect URL             | 用于填写 IdP 的回调 URL 配置。                                                 |
| Post logout redirect URL | 在启用 RP-initiated logout 时，用于填写 IdP 的 Post logout redirect URL 配置。 |

:::info
本地测试时，URL请使用 `127.0.0.1` 而不是 `localhost`，因为 OIDC 登录方式需要向客户端 cookie 写入 state 用于安全校验。如果登录时出现窗口一闪而过，但是没有登录成功，请检查服务端是否有 state 不匹配的日志以及请求 cookie 中是否包含了 state 参数，这种情况通常是由于客户端 cookie 中的 state 和请求中携带的 state 不匹配。
:::

## 登录

访问登录页面，点击登录表单下方按钮发起第三方登录。

![](https://static-docs.nocobase.com/e493d156254c2ac0b6f6e1002e6a2e6b.png)
