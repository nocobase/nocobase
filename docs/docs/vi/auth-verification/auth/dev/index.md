---
title: "Mở rộng loại xác thực"
description: "Hướng dẫn phát triển mở rộng loại xác thực người dùng NocoBase: quy trình xác thực không phụ thuộc và phụ thuộc callback bên thứ ba, lớp Auth/BaseAuth, AuthModel, đăng ký registerType phía client."
keywords: "mở rộng loại xác thực,Auth,BaseAuth,AuthModel,xác thực tùy chỉnh,registerType,NocoBase"
---

# Mở rộng loại xác thực

## Tổng quan

NocoBase hỗ trợ mở rộng loại xác thực người dùng theo nhu cầu. Xác thực người dùng thường có hai loại: một là xác định danh tính người dùng trong ứng dụng NocoBase, ví dụ đăng nhập bằng mật khẩu, đăng nhập bằng SMS; hai là dịch vụ bên thứ ba xác định danh tính người dùng và thông báo kết quả về ứng dụng NocoBase qua callback, ví dụ OIDC, SAML. Quy trình xác thực của hai loại trong NocoBase cơ bản như sau:

### Không phụ thuộc callback bên thứ ba

1. Client sử dụng NocoBase SDK gọi API đăng nhập `api.auth.signIn()`, request đến endpoint đăng nhập `auth:signIn`, đồng thời truyền định danh authenticator hiện tại qua header `X-Authenticator` cho backend.
2. Endpoint `auth:signIn` chuyển tiếp dựa trên định danh authenticator trong header đến loại xác thực tương ứng, phương thức `validate` của lớp xác thực được đăng ký bởi loại xác thực đó sẽ xử lý logic tương ứng.
3. Client lấy thông tin người dùng và `token` xác thực từ response của `auth:signIn`, lưu `token` vào Local Storage để hoàn tất đăng nhập. Bước này được SDK xử lý tự động bên trong.

<img src="https://static-docs.nocobase.com/202404211852848.png"/>

### Phụ thuộc callback bên thứ ba

1. Client lấy URL đăng nhập bên thứ ba thông qua endpoint mà bạn đăng ký (ví dụ `auth:getAuthUrl`), mang theo tên ứng dụng, định danh authenticator, v.v. theo giao thức.
2. Chuyển hướng đến URL bên thứ ba để đăng nhập, dịch vụ bên thứ ba gọi endpoint callback của ứng dụng NocoBase (cần tự đăng ký, ví dụ `auth:redirect`), trả về kết quả xác thực, đồng thời trả về tên ứng dụng, định danh authenticator, v.v.
3. Phương thức của endpoint callback parse tham số để lấy định danh authenticator, lấy lớp xác thực tương ứng qua `AuthManager`, chủ động gọi phương thức `auth.signIn()`. Phương thức `auth.signIn()` sẽ gọi phương thức `validate()` để xử lý logic xác thực.
4. Phương thức callback nhận `token` xác thực, sau đó 302 redirect về trang frontend, mang theo `token` và định danh authenticator trong tham số URL: `?authenticator=xxx&token=yyy`.

<img src="https://static-docs.nocobase.com/202404211852377.png"/>

Sau đây sẽ giới thiệu cách đăng ký endpoint phía server và giao diện người dùng phía client.

## Server

### Interface xác thực

NocoBase core cung cấp khả năng đăng ký và quản lý các loại xác thực mở rộng. Để xử lý logic core của plugin đăng nhập mở rộng, bạn cần kế thừa lớp trừu tượng `Auth` trong core và hiện thực các interface chuẩn tương ứng.
Tham khảo API đầy đủ tại [Auth](/api/auth/auth).

```typescript
import { Auth } from '@nocobase/auth';

class CustomAuth extends Auth {
  set user(user) {}
  get user() {}

  async check() {}
  async signIn() {}
}
```

Core cũng đăng ký các thao tác resource cơ bản liên quan đến xác thực người dùng.

| API | Mô tả |
| --- | ----- |
| `auth:check` | Kiểm tra người dùng đã đăng nhập hay chưa |
| `auth:signIn` | Đăng nhập |
| `auth:signUp` | Đăng ký |
| `auth:signOut` | Đăng xuất |

Trong hầu hết trường hợp, loại xác thực mở rộng cũng có thể tận dụng logic xác thực JWT hiện có để sinh credential người dùng truy cập API. Lớp `BaseAuth` của core cung cấp hiện thực cơ bản cho lớp trừu tượng `Auth`, tham khảo [BaseAuth](../../../api/auth/base-auth.md). Plugin có thể kế thừa trực tiếp lớp `BaseAuth` để tái sử dụng một phần logic, giảm chi phí phát triển.

```javascript
import { BaseAuth } from '@nocobase/auth';

class CustomAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // Cài đặt collection users
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // Hiện thực logic xác thực người dùng
  async validate() {}
}
```

### Dữ liệu người dùng

Khi hiện thực logic xác thực người dùng, thường liên quan đến xử lý dữ liệu người dùng. Trong ứng dụng NocoBase, mặc định các collection liên quan được định nghĩa như sau:

| Collection | Vai trò | Plugin |
| ---------- | ------- | ------ |
| `users` | Lưu thông tin người dùng, email, nickname và mật khẩu, v.v. | [Plugin Users (`@nocobase/plugin-users`)](/users-permissions/user) |
| `authenticators` | Lưu thông tin authenticator (entity của loại xác thực), tương ứng với loại xác thực và cấu hình | Plugin xác thực người dùng (`@nocobase/plugin-auth`) |
| `usersAuthenticators` | Liên kết người dùng và authenticator, lưu thông tin của người dùng dưới authenticator tương ứng | Plugin xác thực người dùng (`@nocobase/plugin-auth`) |

Thông thường, phương thức đăng nhập mở rộng có thể dùng `users` và `usersAuthenticators` để lưu dữ liệu người dùng tương ứng. Chỉ trong trường hợp đặc biệt mới cần tự thêm Collection.

Các field chính của `usersAuthenticators`:

| Field | Mô tả |
| ----- | ----- |
| `uuid` | Định danh duy nhất của người dùng cho phương thức xác thực này, ví dụ số điện thoại, openid WeChat, v.v. |
| `meta` | Field JSON, các thông tin khác cần lưu |
| `userId` | User ID |
| `authenticator` | Tên authenticator (định danh duy nhất) |

Đối với thao tác query và create người dùng, model dữ liệu `AuthModel` của `authenticators` cũng đóng gói một số phương thức, có thể dùng trong lớp `CustomAuth` qua `this.authenticator[tên phương thức]`. Tham khảo API đầy đủ tại [AuthModel](./api#authmodel).

```ts
import { AuthModel } from '@nocobase/plugin-auth';

class CustomAuth extends BaseAuth {
  async validate() {
    // ...
    const authenticator = this.authenticator as AuthModel;
    this.authenticator.findUser(); // Query người dùng
    this.authenticator.newUser(); // Tạo người dùng mới
    this.authenticator.findOrCreateUser(); // Query hoặc tạo người dùng mới
    // ...
  }
}
```

### Đăng ký loại xác thực

Phương thức xác thực mở rộng cần được đăng ký với module quản lý xác thực.

```javascript
class CustomAuthPlugin extends Plugin {
  async load() {
    this.app.authManager.registerTypes('custom-auth-type', {
      auth: CustomAuth,
    });
  }
}
```

## Client

Giao diện người dùng phía client được đăng ký qua interface `registerType` do client của plugin xác thực người dùng cung cấp:

```ts
import AuthPlugin from '@nocobase/plugin-auth/client';

class CustomAuthPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType('custom-auth-type', {
      components: {
        SignInForm, // Form đăng nhập
        SignInButton, // Nút đăng nhập (bên thứ ba), có thể chọn một trong hai với SignInForm
        SignUpForm, // Form đăng ký
        AdminSettingsForm, // Form quản lý backend
      },
    });
  }
}
```

### Form đăng nhập

![](https://static-docs.nocobase.com/33afe18f229c3db45c7a1921c2c050b7.png)

Nếu nhiều loại xác thực tương ứng với nhiều authenticator đều đăng ký form đăng nhập, sẽ hiển thị dưới dạng Tab. Tiêu đề Tab là tiêu đề authenticator được cấu hình ở backend.

![](https://static-docs.nocobase.com/ada6d7add744be0c812359c23bf4c7fc.png)

### Nút đăng nhập

![](https://static-docs.nocobase.com/e706f7785782adc77b0f4ee4faadfab8.png)

Thường là nút đăng nhập bên thứ ba, thực tế có thể là bất kỳ component nào.

### Form đăng ký

![](https://static-docs.nocobase.com/f95c53431bf21ec312fcfd51923f0b42.png)

Nếu cần chuyển từ trang đăng nhập sang trang đăng ký, bạn cần tự xử lý trong component đăng nhập.

### Form quản lý backend

![](https://static-docs.nocobase.com/f4b544b5b0f5afee5621ad4abf66b24f.png)

Phía trên là cấu hình authenticator chung, phía dưới là phần form cấu hình tùy chỉnh có thể đăng ký.

### Request API

Để gọi API liên quan đến xác thực người dùng phía client, bạn có thể sử dụng SDK do NocoBase cung cấp.

```ts
import { useAPIClient } from '@nocobase/client';

// dùng trong component
const api = useAPIClient();
api.auth.signIn(data, authenticator);
```

Tham khảo API chi tiết tại [@nocobase/sdk - Auth](/api/sdk/auth).
