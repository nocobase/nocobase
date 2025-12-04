:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Auth

## Tổng quan

`Auth` là một lớp trừu tượng dành cho các loại xác thực người dùng. Lớp này định nghĩa các giao diện cần thiết để hoàn tất quá trình xác thực người dùng. Để mở rộng một loại xác thực người dùng mới, bạn cần kế thừa lớp `Auth` và triển khai các phương thức của nó. Để tham khảo cách triển khai cơ bản, hãy xem: [BaseAuth](./base-auth.md).

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
  // check: authentication
  async check() {
    // ...
  }
}
```

## Thuộc tính của thể hiện

### `user`

Thông tin người dùng đã được xác thực.

#### Chữ ký

- `abstract user: Model`

## Phương thức của lớp

### `constructor()`

Hàm khởi tạo, dùng để tạo một thể hiện (instance) của `Auth`.

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

#### Chi tiết

##### AuthConfig

| Thuộc tính      | Kiểu                                            | Mô tả                                                                                                 |
| --------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `authenticator` | [`Authenticator`](./auth-manager#authenticator) | Mô hình dữ liệu của bộ xác thực (authenticator). Kiểu thực tế trong ứng dụng NocoBase là [AuthModel](/auth-verification/auth/dev/api#authmodel). |
| `options`       | `Record<string, any>`                           | Cấu hình liên quan đến bộ xác thực (authenticator).                                                   |
| `ctx`           | `Context`                                       | Ngữ cảnh yêu cầu.                                                                                     |

### `check()`

Xác thực người dùng. Phương thức này trả về thông tin người dùng và là một phương thức trừu tượng mà tất cả các loại xác thực đều phải triển khai.

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