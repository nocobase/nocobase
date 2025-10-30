# Auth

## 概览

`Auth` 是用户认证类型的抽象类，定义了完成用户认证需要的接口，扩展新的用户认证类型需要继承 `Auth` 类，并实现其中的方法。基础实现可以参考: [BaseAuth](./base-auth.md).

```ts
interface IAuth {
  user: Model;
  // Check the authenticaiton status and return the current user.
  check(): Promise<Model>;
  signIn(): Promise<any>;
  signUp(): Promise<any>;
  signOut(): Promise<any>;
}

export abstract class Auth implements IAuth {
  abstract user: Model;
  abstract check(): Promise<Model>;
  // ...
}

class CustomAuth extends Auth {
  // check: 鉴权
  async check() {
    // ...
  }
}
```

## 实例属性

### `user`

认证用户信息。

#### 签名

- `abstract user: Model`

## 类方法

### `constructor()`

构造函数，创建一个 `Auth` 实例。

#### 签名

- `constructor(config: AuthConfig)`

#### 类型

```ts
export type AuthConfig = {
  authenticator: Authenticator;
  options: {
    [key: string]: any;
  };
  ctx: Context;
};
```

#### 详细信息

##### AuthConfig

| 属性            | 类型                                            | 描述                                                                                                  |
| --------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `authenticator` | [`Authenticator`](./auth-manager#authenticator) | 认证器数据模型，在 NocoBase 应用中的实际类型是 [AuthModel](/auth-verification/auth/dev/api#authmodel) |
| `options`       | `Record<string, any>`                           | 认证器相关配置                                                                                        |
| `ctx`           | `Context`                                       | 请求上下文                                                                                            |

### `check()`

用户鉴权，返回用户信息，所有认证类型都必须实现的抽象方法。

#### 签名

- `abstract check(): Promise<Model>`

### `signIn()`

用户登录。

#### 签名

- `signIn(): Promise<any>`

### `signUp()`

用户注册。

#### 签名

- `signUp(): Promise<any>`

### `signOut()`

用户注销登录。

#### 签名

- `signOut(): Promise<any>`
