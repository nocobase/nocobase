---
title: "BaseAuth"
description: "Lớp cơ sở xác thực của NocoBase: BaseAuth là lớp cơ sở để mở rộng các kiểu xác thực."
keywords: "BaseAuth,xác thực,mở rộng xác thực,NocoBase"
---

# BaseAuth

## Tổng quan

`BaseAuth` kế thừa từ lớp trừu tượng [Auth](./auth), là triển khai cơ bản của kiểu xác thực người dùng, dùng JWT làm phương thức xác thực. Trong hầu hết trường hợp, mở rộng kiểu xác thực người dùng có thể kế thừa `BaseAuth`, không cần thiết phải kế thừa trực tiếp lớp trừu tượng `Auth`.

```ts
class BasicAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // Đặt bảng dữ liệu người dùng
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // Logic xác thực người dùng, được `auth.signIn` gọi
  // Trả về dữ liệu người dùng
  async validate() {
    const ctx = this.ctx;
    const { values } = ctx.action.params;
    // ...
    return user;
  }
}
```

## Phương thức của lớp

### `constructor()`

Constructor, tạo một instance `BaseAuth`.

#### Chữ ký

- `constructor(config: AuthConfig & { userCollection: Collection })`

#### Thông tin chi tiết

| Tham số          | Kiểu         | Mô tả                                                                                               |
| ---------------- | ------------ | --------------------------------------------------------------------------------------------------- |
| `config`         | `AuthConfig` | Tham khảo [Auth - AuthConfig](./auth#authconfig)                                                    |
| `userCollection` | `Collection` | Bảng dữ liệu người dùng, ví dụ: `db.getCollection('users')`, tham khảo [DataBase - Collection](../database/collection) |

### `user()`

Accessor, đặt và lấy thông tin người dùng, mặc định dùng đối tượng `ctx.state.currentUser` để lưu trữ.

#### Chữ ký

- `set user()`
- `get user()`

### `check()`

Xác thực qua token trong request, trả về thông tin người dùng.

### `signIn()`

Đăng nhập người dùng, sinh token.

### `signUp()`

Đăng ký người dùng.

### `signOut()`

Đăng xuất người dùng, token hết hạn.

### `validate()` \*

Logic xác thực cốt lõi, được API `signIn` gọi, quyết định người dùng có đăng nhập thành công hay không.
