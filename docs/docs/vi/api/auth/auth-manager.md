:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# AuthManager

## Tổng quan

`AuthManager` là một module quản lý xác thực người dùng trong NocoBase, dùng để đăng ký các loại xác thực người dùng khác nhau.

### Cách sử dụng cơ bản

```ts
const authManager = new AuthManager({
  // Dùng để lấy định danh bộ xác thực hiện tại từ tiêu đề yêu cầu
  authKey: 'X-Authenticator',
});

// Thiết lập các phương thức để AuthManager lưu trữ và truy xuất bộ xác thực
authManager.setStorer({
  get: async (name: string) => {
    return db.getRepository('authenticators').find({ filter: { name } });
  },
});

// Đăng ký một loại xác thực
authManager.registerTypes('basic', {
  auth: BasicAuth,
  title: 'Password',
});

// Sử dụng middleware xác thực
app.resourceManager.use(authManager.middleware());
```

### Giải thích khái niệm

- **Loại xác thực (`AuthType`)**: Các phương thức xác thực người dùng khác nhau, ví dụ: mật khẩu, SMS, OIDC, SAML, v.v.
- **Bộ xác thực (`Authenticator`)**: Một thực thể của phương thức xác thực, được lưu trữ thực tế trong một `bộ sưu tập`, tương ứng với một bản ghi cấu hình của một `AuthType` nhất định. Một phương thức xác thực có thể có nhiều bộ xác thực, tương ứng với nhiều cấu hình, cung cấp các phương pháp xác thực người dùng khác nhau.
- **Định danh bộ xác thực (`Authenticator name`)**: Định danh duy nhất cho một bộ xác thực, được dùng để xác định phương thức xác thực mà yêu cầu hiện tại đang sử dụng.

## Phương thức lớp

### `constructor()`

Hàm khởi tạo, tạo một thể hiện (`instance`) của `AuthManager`.

#### Chữ ký

- `constructor(options: AuthManagerOptions)`

#### Kiểu dữ liệu

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

#### Chi tiết

##### AuthManagerOptions

| Thuộc tính | Kiểu | Mô tả | Giá trị mặc định |
| --------- | --------------------------- | ------------------------------------- | ----------------- |
| `authKey` | `string` | Tùy chọn, khóa trong tiêu đề yêu cầu chứa định danh bộ xác thực hiện tại. | `X-Authenticator` |
| `default` | `string` | Tùy chọn, định danh bộ xác thực mặc định. | `basic` |
| `jwt` | [`JwtOptions`](#jwtoptions) | Tùy chọn, có thể cấu hình nếu sử dụng JWT để xác thực. | - |

##### JwtOptions

| Thuộc tính | Kiểu | Mô tả | Giá trị mặc định |
| ----------- | -------- | ------------------ | ----------------- |
| `secret` | `string` | Khóa bí mật của token | `X-Authenticator` |
| `expiresIn` | `string` | Tùy chọn, thời gian hết hạn của token. | `7d` |

### `setStorer()`

Thiết lập các phương thức để lưu trữ và truy xuất dữ liệu bộ xác thực.

#### Chữ ký

- `setStorer(storer: Storer)`

#### Kiểu dữ liệu

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

#### Chi tiết

##### Authenticator

| Thuộc tính | Kiểu | Mô tả |
| ---------- | --------------------- | -------------- |
| `authType` | `string` | Loại xác thực |
| `options` | `Record<string, any>` | Cấu hình liên quan đến bộ xác thực |

##### Storer

`Storer` là một giao diện để lưu trữ bộ xác thực, bao gồm một phương thức.

- `get(name: string): Promise<Authenticator>` - Lấy một bộ xác thực bằng định danh của nó. Trong NocoBase, kiểu dữ liệu thực tế được trả về là [AuthModel](/auth-verification/auth/dev/api#authmodel).

### `registerTypes()`

Đăng ký một loại xác thực.

#### Chữ ký

- `registerTypes(authType: string, authConfig: AuthConfig)`

#### Kiểu dữ liệu

```ts
export type AuthExtend<T extends Auth> = new (config: Config) => T;

type AuthConfig = {
  auth: AuthExtend<Auth>; // Lớp xác thực.
  title?: string; // Tên hiển thị của loại xác thực.
};
```

#### Chi tiết

| Thuộc tính | Kiểu | Mô tả |
| ------- | ------------------ | --------------------------------- |
| `auth` | `AuthExtend<Auth>` | Triển khai loại xác thực, xem [Auth](./auth) |
| `title` | `string` | Tùy chọn. Tiêu đề của loại xác thực này được hiển thị ở giao diện người dùng. |

### `listTypes()`

Lấy danh sách các loại xác thực đã đăng ký.

#### Chữ ký

- `listTypes(): { name: string; title: string }[]`

#### Chi tiết

| Thuộc tính | Kiểu | Mô tả |
| ------- | -------- | ------------ |
| `name` | `string` | Định danh loại xác thực |
| `title` | `string` | Tiêu đề loại xác thực |

### `get()`

Lấy một bộ xác thực.

#### Chữ ký

- `get(name: string, ctx: Context)`

#### Chi tiết

| Thuộc tính | Kiểu | Mô tả |
| ------ | --------- | ---------- |
| `name` | `string` | Định danh bộ xác thực |
| `ctx` | `Context` | Ngữ cảnh yêu cầu |

### `middleware()`

Middleware xác thực. Lấy bộ xác thực hiện tại và thực hiện xác thực người dùng.