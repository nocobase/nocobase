# BaseAuth

## 概览

`BaseAuth` 继承自 [Auth](./auth) 抽象类，是用户认证类型的基础实现，用 JWT 作为鉴权方式。大多数情况下，扩展用户认证类型可以继承 `BaseAuth` 进行扩展，没有必要直接继承 `Auth` 抽象类。

```ts
class BasicAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // 设置用户数据表
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // 用户认证逻辑，由 `auth.signIn` 调用
  // 返回用户数据
  async validate() {
    const ctx = this.ctx;
    const { values } = ctx.action.params;
    // ...
    return user;
  }
}
```

## 类方法

### `constructor()`

构造函数，创建一个 `BaseAuth` 实例。

#### 签名

- `constructor(config: AuthConfig & { userCollection: Collection })`

#### 详细信息

| 参数             | 类型         | 描述                                                                                                |
| ---------------- | ------------ | --------------------------------------------------------------------------------------------------- |
| `config`         | `AuthConfig` | 参考 [Auth - AuthConfig](./auth#authconfig)                                                         |
| `userCollection` | `Collection` | 用户数据表, 比如: `db.getCollection('users')`，参考 [DataBase - Collection](../database/collection) |

### `user()`

访问器，设置和获取用户信息，默认使用 `ctx.state.currentUser` 对象存取。

#### 签名

- `set user()`
- `get user()`

### `check()`

通过请求 token 鉴权，返回用户信息。

### `signIn()`

用户登录，生成 token.

### `signUp()`

用户注册。

### `signOut()`

用户注销登录，token 过期。

### `validate()` \*

鉴权核心逻辑，由 `signIn` 接口调用，判断用户是否能成功登录。
