---
title: "Tham chiếu API mở rộng xác thực"
description: "API mở rộng xác thực NocoBase: Auth, BaseAuth, AuthModel (findUser, newUser, findOrCreateUser), interface registerType phía client, cấu hình route."
keywords: "API mở rộng xác thực,Auth,BaseAuth,AuthModel,registerType,findUser,NocoBase"
---

# Tham chiếu API

## Server

### Auth

API core, tham khảo: [Auth](/api/auth/auth)

### BaseAuth

API core, tham khảo: [BaseAuth](/api/auth/base-auth)

### AuthModel

#### Tổng quan

`AuthModel` là model dữ liệu của Authenticator (`Authenticator`, tham khảo: [AuthManager - setStorer](/api/auth/auth-manager#setstorer) và [Auth - constructor](/api/auth/auth#constructor)) được sử dụng trong ứng dụng NocoBase, cung cấp một số phương thức tương tác với collection users. Ngoài ra, bạn cũng có thể sử dụng các phương thức do Sequelize Model cung cấp.

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

#### Phương thức class

- `findUser(uuid: string): UserModel` - Query người dùng qua `uuid`.
  - `uuid` - Định danh duy nhất của người dùng từ loại xác thực hiện tại

- `newUser(uuid: string, userValues?: any): UserModel` - Tạo người dùng mới, gắn người dùng với authenticator hiện tại qua `uuid`.
  - `uuid` - Định danh duy nhất của người dùng từ loại xác thực hiện tại
  - `userValues` - Tùy chọn. Thông tin khác của người dùng. Nếu không truyền, `uuid` sẽ được dùng làm nickname.

- `findOrCreateUser(uuid: string, userValues?: any): UserModel` - Tìm hoặc tạo người dùng mới, quy tắc tạo giống trên.
  - `uuid` - Định danh duy nhất của người dùng từ loại xác thực hiện tại
  - `userValues` - Tùy chọn. Thông tin khác của người dùng.

## Client

### `plugin.registerType()`

Đăng ký client cho loại xác thực.

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

#### Signature

- `registerType(authType: string, options: AuthOptions)`

#### Type

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

#### Chi tiết

- `SignInForm` - Form đăng nhập
- `SignInButton` - Nút đăng nhập (bên thứ ba), có thể chọn một trong hai với SignInForm
- `SignUpForm` - Form đăng ký
- `AdminSettingsForm` - Form cấu hình backend

### Route

Plugin auth đăng ký các route frontend như sau:

- Auth Layout
  - name: `auth`
  - path: `-`
  - component: `AuthLayout`

- Trang đăng nhập
  - name: `auth.signin`
  - path: `/signin`
  - component: `SignInPage`

- Trang đăng ký
  - name: `auth.signup`
  - path: `/signup`
  - component: `SignUpPage`
