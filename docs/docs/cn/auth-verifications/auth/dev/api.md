# API 参考

## 服务端

### Auth

内核 API，参考: [Auth](/api/auth/auth)

### BaseAuth

内核 API, 参考: [BaseAuth](/api/auth/base-auth)

### AuthModel

#### 概览

`AuthModel` 是 NocoBase 应用中使用的认证器 (`Authenticator`, 参考: [AuthManager - setStorer](/api/auth/auth-manager#setstorer) 和 [Auth - constructor](/api/auth/auth#constructor)) 数据模型，提供了一些和用户数据表交互的方法。除此之外，也可以使用 Sequelize Model 提供的方法。

```ts
import { AuthModel } from '@nocobase/plugin-auth';

class CustomAuth extends BaseAuth {
  async validate() {
    // ...
    const authenticator = this.authenticator as AuthModel;
    this.authenticator.findUser();
    this.authenticator.newUser();
    this.authenticator.findOrCreateUser();
    // ...
  }
}
```

#### 类方法

- `findUser(uuid: string): UserModel` - 通过 `uuid` 查询用户。
  - `uuid` - 来自当前认证类型的用户唯一标识

- `newUser(uuid: string, userValues?: any): UserModel` - 创建新用户，通过 `uuid` 将用户和当前认证器绑定。
  - `uuid` - 来自当前认证类型的用户唯一标识
  - `userValues` - 可选。用户其他信息。不传递时将 `uuid` 作为用户昵称。

- `findOrCreateUser(uuid: string, userValues?: any): UserModel` - 查找或创建新用户，创建规则同上。
  - `uuid` - 来自当前认证类型的用户唯一标识
  - `userValues` - 可选。用户其他信息。

## 客户端

### `plugin.registerType()`

注册认证类型的客户端。

```ts
import AuthPlugin from '@nocobase/plugin-auth/client';

class CustomAuthPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType('custom-auth-type', {
      components: {
        SignInForm,
        // SignInButton
        SignUpForm,
        AdminSettingsForm,
      },
    });
  }
}
```

#### 签名

- `registerType(authType: string, options: AuthOptions)`

#### 类型

```ts
export type AuthOptions = {
  components: Partial<{
    SignInForm: ComponentType<{ authenticator: AuthenticatorType }>;
    SignInButton: ComponentType<{ authenticator: AuthenticatorType }>;
    SignUpForm: ComponentType<{ authenticatorName: string }>;
    AdminSettingsForm: ComponentType;
  }>;
};
```

#### 详细信息

- `SignInForm` - 登录表单
- `SignInButton` - 登录（第三方）按钮，可以和登录表单二选一
- `SignUpForm` - 注册表单
- `AdminSettingsForm` - 后台配置表单

### Route

auth 插件注册前端路由如下：

- Auth 布局
  - name: `auth`
  - path: `-`
  - component: `AuthLayout`

- 登录页
  - name: `auth.signin`
  - path: `/signin`
  - component: `SignInPage`

- 注册页
  - name: `auth.signup`
  - path: `/signup`
  - component: `SignUpPage`
