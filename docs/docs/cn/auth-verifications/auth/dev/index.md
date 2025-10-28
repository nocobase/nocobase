# 扩展认证类型

## 概述

NocoBase 支持按需要扩展用户认证类型。用户认证一般有两种类型，一种是在 NocoBase 应用 内完成用户身份判断，如密码登录，短信登录等；另一种是由第三方服务判断用户身份，并将结果通过回调通知 NocoBase 应用，如 OIDC, SAML 等认证方式。两种不同类型的认证方式在 NocoBase 中的认证流程基本如下：

### 不依赖第三方回调

1. 客户端使用 NocoBase SDK 调用登录接口 `api.auth.signIn()`，请求登录接口 `auth:signIn`，同时将当前使用的认证器标识通过请求头 `X-Authenticator` 携带给后端。
2. `auth:signIn` 接口根据请求头中的认证器标识，转发到认证器对应的认证类型，由该认证类型注册的认证类中的 `validate` 方法进行相应的逻辑处理。
3. 客户端从 `auth:signIn` 接口响应中拿到用户信息和认证 `token`, 将 `token` 保存到 Local Storage, 完成登录。这一步由 SDK 内部自动完成处理。

<img src="https://static-docs.nocobase.com/202404211852848.png"/>

### 依赖第三方回调

1. 客户端通过自己注册的接口（比如 `auth:getAuthUrl`) 获取第三方登录 URL, 并按协议携带应用名称、认证器标识等信息。
2. 跳转到第三方 URL 完成登录，第三方服务调用 NocoBase 应用的回调接口 (需要自己注册，比如 `auth:redirect`), 返回认证结果，同时返回应用名称、认证器标识等信息。
3. 回调接口方法，解析参数获得认证器标识，通过 `AuthManager` 获取对应的认证类，主动调用 `auth.signIn()` 方法。`auth.signIn()` 方法会调用 `validate()` 方法处理鉴权逻辑。
4. 回调方法拿到认证 `token`, 再 302 跳转回前端页面，并在 URL 参数带上 `token` 和认证器标识，`?authenticator=xxx&token=yyy`.

<img src="https://static-docs.nocobase.com/202404211852377.png"/>

下面介绍如何注册服务端接口和客户端用户界面。

## 服务端

### 认证接口

NocoBase 内核提供了扩展认证类型的注册和管理。扩展登录插件的核心逻辑处理，需要继承内核的 `Auth` 抽象类，并对相应的标准接口进行实现。  
完整 API 参考 [Auth](../../../api/auth/auth.md).

```typescript
import { Auth } from '@nocobase/auth';

class CustomAuth extends Auth {
  set user(user) {}
  get user() {}

  async check() {}
  async signIn() {}
}
```

内核也注册了用户认证相关的基本资源操作。

| API            | 说明             |
| -------------- | ---------------- |
| `auth:check`   | 判断用户是否登录 |
| `auth:signIn`  | 登录             |
| `auth:signUp`  | 注册             |
| `auth:signOut` | 注销登录         |

多数情况下，扩展的用户认证类型也可以沿用现有的 JWT 鉴权逻辑来生成用户访问 API 的凭证。内核的 `BaseAuth` 类对 `Auth` 抽象类做了基础实现，参考 [BaseAuth](../../../api/auth/base-auth.md). 插件可以直接继承 `BaseAuth` 类以便复用部分逻辑代码，降低开发成本。

```javascript
import { BaseAuth } from '@nocobase/auth';

class CustomAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // 设置用户数据表
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // 实现用户认证逻辑
  async validate() {}
}
```

### 用户数据

在实现用户认证逻辑时，通常涉及用户数据处理。在 NocoBase 应用中，默认情况下相关的表定义为：

| 数据表                | 作用                                               | 插件                                                        |
| --------------------- | -------------------------------------------------- | ----------------------------------------------------------- |
| `users`               | 存储用户信息，邮箱、昵称和密码等                   | [用户插件 (`@nocobase/plugin-users`)](../../users/index.md) |
| `authenticators`      | 存储认证器（认证类型实体）信息，对应认证类型和配置 | 用户认证插件 (`@nocobase/plugin-auth`)                      |
| `usersAuthenticators` | 关联用户和认证器，保存用户在对应认证器下的信息     | 用户认证插件 (`@nocobase/plugin-auth`)                      |

通常情况下，扩展登录方式用 `users` 和 `usersAuthenticators` 来存储相应的用户数据即可，特殊情况下才需要自己新增 Collection.

`usersAuthenticators` 的主要字段为

| 字段            | 说明                                                 |
| --------------- | ---------------------------------------------------- |
| `uuid`          | 该种认证方式的用户唯一标识，如手机号、微信 openid 等 |
| `meta`          | JSON 字段，其他需要保存的信息                        |
| `userId`        | 用户 ID                                              |
| `authenticator` | 认证器名字（唯一标识）                               |

对于用户查询和创建操作，`authenticators` 的数据模型 `AuthModel` 也封装了几个方法，可以在 `CustomAuth` 类中通过 `this.authenticator[方法名]` 使用。完整 API 参考 [AuthModel](../dev/api.md#authmodel).

```ts
import { AuthModel } from '@nocobase/plugin-auth';

class CustomAuth extends BaseAuth {
  async validate() {
    // ...
    const authenticator = this.authenticator as AuthModel;
    this.authenticator.findUser(); // 查询用户
    this.authenticator.newUser(); // 创建新用户
    this.authenticator.findOrCreateUser(); // 查询或创建新用户
    // ...
  }
}
```

### 认证类型注册

扩展的认证方式需要向认证管理模块注册。

```javascript
class CustomAuthPlugin extends Plugin {
  async load() {
    this.app.authManager.registerTypes('custom-auth-type', {
      auth: CustomAuth,
    });
  }
}
```

## 客户端

客户端用户界面通过用户认证插件客户端提供的接口 `registerType` 进行注册：

```ts
import AuthPlugin from '@nocobase/plugin-auth/client';

class CustomAuthPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType('custom-auth-type', {
      components: {
        SignInForm, // 登录表单
        SignInButton, // 登录（第三方）按钮，可以和登录表单二选一
        SignUpForm, // 注册表单
        AdminSettingsForm, // 后台管理表单
      },
    });
  }
}
```

### 登录表单

![](https://static-docs.nocobase.com/33afe18f229c3db45c7a1921c2c050b7.png)

如果有多个认证器对应的认证类型都注册了登录表单，会以 Tab 的形式展示。Tab 标题为后台配置的认证器标题。

![](https://static-docs.nocobase.com/ada6d7add744be0c812359c23bf4c7fc.png)

### 登录按钮

![](https://static-docs.nocobase.com/e706f7785782adc77b0f4ee4faadfab8.png)

通常为第三方登录按钮，实际上可以是任意组件。

### 注册表单

![](https://static-docs.nocobase.com/f95c53431bf21ec312fcfd51923f0b42.png)

如果需要从登录页跳转到注册页，需要在登录组件中自己处理。

### 后台管理表单

![](https://static-docs.nocobase.com/f4b544b5b0f5afee5621ad4abf66b24f.png)

上方为通用的认证器配置，下方为可注册的自定义配置表单部分。

### 请求接口

在客户端发起用户认证相关的接口请求，可以使用 NocoBase 提供的 SDK.

```ts
import { useAPIClient } from '@nocobase/client';

// use in component
const api = useAPIClient();
api.auth.signIn(data, authenticator);
```

详细 API 参考 [@nocobase/sdk - Auth](../../../api/sdk/auth.md).
