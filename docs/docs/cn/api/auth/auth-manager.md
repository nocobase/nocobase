# AuthManager

## 概览

`AuthManager` 是 NocoBase 中的用户认证管理模块，用于注册不同的用户认证类型。

### 基本使用

```ts
const authManager = new AuthManager({
  // 用于从请求头中获取当前认证器标识
  authKey: 'X-Authenticator',
});

// 设置 AuthManager 的存储和获取认证器的方法
authManager.setStorer({
  get: async (name: string) => {
    return db.getRepository('authenticators').find({ filter: { name } });
  },
});

// 注册一种认证类型
authManager.registerTypes('basic', {
  auth: BasicAuth,
  title: 'Password',
});

// 使用鉴权中间件
app.resourceManager.use(authManager.middleware());
```

### 概念解释

- **认证类型 (`AuthType`)**: 不同的用户认证方式，比如：密码、短信、OIDC, SAML 等。
- **认证器 (`Authenticator`)**: 认证方式实体，实际存储到数据表中，对应某种认证类型 (`AuthType`) 的配置记录。一种认证方式可以有多个认证器，对应多个配置，提供不同的用户认证方法。
- **认证器标识 (`Authenticator name`)**: 认证器的唯一标识，用来确定当前请求使用的认证方式。

## 类方法

### `constructor()`

构造函数，创建一个 `AuthManager` 实例。

#### 签名

- `constructor(options: AuthManagerOptions)`

#### 类型

```ts
export interface JwtOptions {
  secret: string;
  expiresIn?: string;
}

export type AuthManagerOptions = {
  authKey: string;
  default?: string;
  jwt?: JwtOptions;
};
```

#### 详细信息

##### AuthManagerOptions

| 属性      | 类型                        | 描述                                  | 默认值            |
| --------- | --------------------------- | ------------------------------------- | ----------------- |
| `authKey` | `string`                    | 可选，请求头中保存当前认证器标识的key | `X-Authenticator` |
| `default` | `string`                    | 可选, 默认认证器标识                  | `basic`           |
| `jwt`     | [`JwtOptions`](#jwtoptions) | 可选，如果采用 JWT 做鉴权，可以配置   | -                 |

##### JwtOptions

| 属性        | 类型     | 描述               | 默认值            |
| ----------- | -------- | ------------------ | ----------------- |
| `secret`    | `string` | token 密钥         | `X-Authenticator` |
| `expiresIn` | `string` | 可选, token 有效期 | `7d`              |

### `setStorer()`

设置认证器数据的存储和获取方法。

#### 签名

- `setStorer(storer: Storer)`

#### 类型

```ts
export interface Authenticator = {
  authType: string;
  options: Record<string, any>;
  [key: string]: any;
};

export interface Storer {
  get: (name: string) => Promise<Authenticator>;
}
```

#### 详细信息

##### Authenticator

| 属性       | 类型                  | 描述           |
| ---------- | --------------------- | -------------- |
| `authType` | `string`              | 认证类型       |
| `options`  | `Record<string, any>` | 认证器相关配置 |

##### Storer

`Storer` 是认证器存储的接口，包含一个方法。

- `get(name: string): Promise<Authenticator>` - 通过认证器标识获取认证器。在 NocoBase 中实际返回的类型是 [AuthModel](/auth-verification/auth/dev/api#authmodel).

### `registerTypes()`

注册认证类型。

#### 签名

- `registerTypes(authType: string, authConfig: AuthConfig)`

#### 类型

```ts
export type AuthExtend<T extends Auth> = new (config: Config) => T;

type AuthConfig = {
  auth: AuthExtend<Auth>; // The authentication class.
  title?: string; // The display name of the authentication type.
};
```

#### 详细信息

| 属性    | 类型               | 描述                              |
| ------- | ------------------ | --------------------------------- |
| `auth`  | `AuthExtend<Auth>` | 认证类型实现, 参考 [Auth](./auth) |
| `title` | `string`           | 可选。该认证类型在前端展示的标题  |

### `listTypes()`

获取已注册的认证类型列表。

#### 签名

- `listTypes(): { name: string; title: string }[]`

#### 详细信息

| 属性    | 类型     | 描述         |
| ------- | -------- | ------------ |
| `name`  | `string` | 认证类型标识 |
| `title` | `string` | 认证类型标题 |

### `get()`

获取认证器。

#### 签名

- `get(name: string, ctx: Context)`

#### 详细信息

| 属性   | 类型      | 描述       |
| ------ | --------- | ---------- |
| `name` | `string`  | 认证器标识 |
| `ctx`  | `Context` | 请求上下文 |

### `middleware()`

鉴权中间件。获取当前认证器，进行用户认证。
