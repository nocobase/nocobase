---
title: "AuthManager"
description: "Trình quản lý xác thực của NocoBase: AuthManager quản lý nhiều phương thức xác thực, đăng ký authenticator."
keywords: "AuthManager,trình quản lý xác thực,đăng ký authenticator,nhiều phương thức xác thực,NocoBase"
---

# AuthManager

## Tổng quan

`AuthManager` là module quản lý xác thực người dùng trong NocoBase, dùng để đăng ký các kiểu xác thực người dùng khác nhau.

### Cách dùng cơ bản

```ts
const authManager = new AuthManager({
  // Dùng để lấy định danh authenticator hiện tại từ request header
  authKey: 'X-Authenticator',
});

// Đặt phương thức lưu trữ và lấy authenticator của AuthManager
authManager.setStorer({
  get: async (name: string) => {
    return db.getRepository('authenticators').find({ filter: { name } });
  },
});

// Đăng ký một kiểu xác thực
authManager.registerTypes('basic', {
  auth: BasicAuth,
  title: 'Password',
});

// Sử dụng middleware xác thực
app.resourceManager.use(authManager.middleware());
```

### Giải thích khái niệm

- **Kiểu xác thực (`AuthType`)**: Các phương thức xác thực người dùng khác nhau, ví dụ: mật khẩu, SMS, OIDC, SAML, v.v.
- **Authenticator (`Authenticator`)**: Thực thể của phương thức xác thực, được lưu trong bảng dữ liệu, tương ứng với một bản ghi cấu hình của một kiểu xác thực (`AuthType`). Một phương thức xác thực có thể có nhiều authenticator, tương ứng với nhiều cấu hình, cung cấp các phương thức xác thực người dùng khác nhau.
- **Định danh authenticator (`Authenticator name`)**: Định danh duy nhất của authenticator, dùng để xác định phương thức xác thực được sử dụng cho request hiện tại.

## Phương thức của lớp

### `constructor()`

Constructor, tạo một instance `AuthManager`.

#### Chữ ký

- `constructor(options: AuthManagerOptions)`

#### Kiểu

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

#### Thông tin chi tiết

##### AuthManagerOptions

| Thuộc tính | Kiểu                        | Mô tả                                                       | Giá trị mặc định  |
| ---------- | --------------------------- | ----------------------------------------------------------- | ----------------- |
| `authKey`  | `string`                    | Tùy chọn, key trong request header lưu định danh authenticator hiện tại | `X-Authenticator` |
| `default`  | `string`                    | Tùy chọn, định danh authenticator mặc định                   | `basic`           |
| `jwt`      | [`JwtOptions`](#jwtoptions) | Tùy chọn, có thể cấu hình nếu dùng JWT để xác thực           | -                 |

##### JwtOptions

| Thuộc tính  | Kiểu     | Mô tả                       | Giá trị mặc định  |
| ----------- | -------- | --------------------------- | ----------------- |
| `secret`    | `string` | Khóa bí mật của token       | `X-Authenticator` |
| `expiresIn` | `string` | Tùy chọn, thời hạn của token | `7d`              |

### `setStorer()`

Đặt phương thức lưu trữ và lấy dữ liệu authenticator.

#### Chữ ký

- `setStorer(storer: Storer)`

#### Kiểu

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

#### Thông tin chi tiết

##### Authenticator

| Thuộc tính | Kiểu                  | Mô tả                              |
| ---------- | --------------------- | ---------------------------------- |
| `authType` | `string`              | Kiểu xác thực                      |
| `options`  | `Record<string, any>` | Cấu hình liên quan đến authenticator |

##### Storer

`Storer` là interface lưu trữ authenticator, gồm một phương thức.

- `get(name: string): Promise<Authenticator>` - Lấy authenticator theo định danh. Trong NocoBase kiểu thực tế trả về là [AuthModel](/auth-verification/auth/dev/api#authmodel).

### `registerTypes()`

Đăng ký kiểu xác thực.

#### Chữ ký

- `registerTypes(authType: string, authConfig: AuthConfig)`

#### Kiểu

```ts
export type AuthExtend<T extends Auth> = new (config: Config) => T;

type AuthConfig = {
  auth: AuthExtend<Auth>; // The authentication class.
  title?: string; // The display name of the authentication type.
};
```

#### Thông tin chi tiết

| Thuộc tính | Kiểu               | Mô tả                                  |
| ---------- | ------------------ | -------------------------------------- |
| `auth`     | `AuthExtend<Auth>` | Triển khai kiểu xác thực, tham khảo [Auth](./auth) |
| `title`    | `string`           | Tùy chọn. Tiêu đề kiểu xác thực hiển thị ở frontend |

### `listTypes()`

Lấy danh sách các kiểu xác thực đã đăng ký.

#### Chữ ký

- `listTypes(): { name: string; title: string }[]`

#### Thông tin chi tiết

| Thuộc tính | Kiểu     | Mô tả              |
| ---------- | -------- | ------------------ |
| `name`     | `string` | Định danh kiểu xác thực |
| `title`    | `string` | Tiêu đề kiểu xác thực |

### `get()`

Lấy authenticator.

#### Chữ ký

- `get(name: string, ctx: Context)`

#### Thông tin chi tiết

| Thuộc tính | Kiểu      | Mô tả               |
| ---------- | --------- | ------------------- |
| `name`     | `string`  | Định danh authenticator |
| `ctx`      | `Context` | Ngữ cảnh request    |

### `middleware()`

Middleware xác thực. Lấy authenticator hiện tại và thực hiện xác thực người dùng.
