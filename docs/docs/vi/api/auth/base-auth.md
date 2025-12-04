:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# BaseAuth

## Tổng quan

`BaseAuth` kế thừa từ lớp trừu tượng [Auth](./auth) và là triển khai cơ bản cho các loại xác thực người dùng, sử dụng JWT làm phương thức xác thực. Trong hầu hết các trường hợp, bạn có thể mở rộng các loại xác thực người dùng bằng cách kế thừa từ `BaseAuth`, mà không cần phải kế thừa trực tiếp từ lớp trừu tượng `Auth`.

```ts
class BasicAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // Thiết lập bộ sưu tập người dùng
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // Logic xác thực người dùng, được gọi bởi `auth.signIn`
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

Hàm khởi tạo, tạo một thể hiện (instance) của `BaseAuth`.

#### Chữ ký

- `constructor(config: AuthConfig & { userCollection: Collection })`

#### Chi tiết

| Tham số          | Kiểu         | Mô tả                                                                                               |
| :--------------- | :----------- | :-------------------------------------------------------------------------------------------------- |
| `config`         | `AuthConfig` | Tham khảo [Auth - AuthConfig](./auth#authconfig)                                                    |
| `userCollection` | `Collection` | Bộ sưu tập người dùng, ví dụ: `db.getCollection('users')`. Tham khảo [DataBase - Collection](../database/collection) |

### `user()`

Trình truy cập (accessor), dùng để thiết lập và lấy thông tin người dùng. Mặc định, nó sử dụng đối tượng `ctx.state.currentUser` để truy cập.

#### Chữ ký

- `set user()`
- `get user()`

### `check()`

Xác thực thông qua token của yêu cầu và trả về thông tin người dùng.

### `signIn()`

Đăng nhập người dùng, tạo ra một token.

### `signUp()`

Đăng ký người dùng.

### `signOut()`

Đăng xuất người dùng, làm cho token hết hạn.

### `validate()` \*

Logic xác thực cốt lõi, được gọi bởi giao diện `signIn`, để xác định xem người dùng có thể đăng nhập thành công hay không.