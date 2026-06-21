---
title: "Auth"
description: "API xác thực của NocoBase: lớp xác thực Auth, xác minh danh tính người dùng và phát hành token."
keywords: "Auth API,xác thực,đăng nhập,đăng xuất,phát hành token,NocoBase"
---

# Auth

## Tổng quan

`Auth` là lớp trừu tượng cho kiểu xác thực người dùng, định nghĩa các interface cần thiết để hoàn tất xác thực. Mở rộng kiểu xác thực người dùng mới cần kế thừa lớp `Auth` và triển khai các phương thức của nó. Triển khai cơ bản có thể tham khảo: [BaseAuth](./base-auth.md).

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
  // check: xác thực
  async check() {
    // ...
  }
}
```

## Thuộc tính của instance

### `user`

Thông tin người dùng đã xác thực.

#### Chữ ký

- `abstract user: Model`

## Phương thức của lớp

### `constructor()`

Constructor, tạo một instance `Auth`.

#### Chữ ký

- `constructor(config: AuthConfig)`

#### Kiểu

```ts
export type AuthConfig = {
  authenticator: Authenticator;
  options: {
    [key: string]: any;
  };
  ctx: Context;
};
```

#### Thông tin chi tiết

##### AuthConfig

| Thuộc tính      | Kiểu                                            | Mô tả                                                                                                 |
| --------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `authenticator` | [`Authenticator`](./auth-manager#authenticator) | Model dữ liệu của authenticator, kiểu thực tế trong ứng dụng NocoBase là [AuthModel](/auth-verification/auth/dev/api#authmodel) |
| `options`       | `Record<string, any>`                           | Cấu hình liên quan đến authenticator                                                                 |
| `ctx`           | `Context`                                       | Ngữ cảnh request                                                                                     |

### `check()`

Xác thực người dùng, trả về thông tin người dùng. Đây là phương thức trừu tượng mà mọi kiểu xác thực phải triển khai.

#### Chữ ký

- `abstract check(): Promise<Model>`

### `signIn()`

Đăng nhập người dùng.

#### Chữ ký

- `signIn(): Promise<any>`

### `signUp()`

Đăng ký người dùng.

#### Chữ ký

- `signUp(): Promise<any>`

### `signOut()`

Đăng xuất người dùng.

#### Chữ ký

- `signOut(): Promise<any>`
