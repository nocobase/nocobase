:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Mở rộng loại xác thực

## Tổng quan

NocoBase hỗ trợ mở rộng các loại xác thực người dùng theo nhu cầu. Xác thực người dùng thường có hai loại: một là xác định danh tính người dùng ngay trong ứng dụng NocoBase, ví dụ như đăng nhập bằng mật khẩu, đăng nhập bằng SMS, v.v.; loại còn lại là do dịch vụ bên thứ ba xác định danh tính người dùng và thông báo kết quả cho ứng dụng NocoBase thông qua các callback, ví dụ như các phương thức xác thực OIDC, SAML, v.v. Quy trình xác thực cho hai loại phương thức này trong NocoBase cơ bản như sau:

### Không cần callback từ bên thứ ba

1. Client sử dụng NocoBase SDK để gọi giao diện đăng nhập `api.auth.signIn()`, yêu cầu giao diện đăng nhập `auth:signIn`, đồng thời gửi định danh của bộ xác thực đang sử dụng thông qua tiêu đề yêu cầu `X-Authenticator` đến backend.
2. Giao diện `auth:signIn` dựa trên định danh bộ xác thực trong tiêu đề yêu cầu để chuyển tiếp đến loại xác thực tương ứng. Phương thức `validate` trong lớp xác thực đã đăng ký của loại xác thực đó sẽ xử lý logic tương ứng.
3. Client nhận thông tin người dùng và `token` xác thực từ phản hồi của giao diện `auth:signIn`, lưu `token` vào Local Storage và hoàn tất đăng nhập. Bước này được SDK tự động xử lý nội bộ.

<img src="https://static-docs.nocobase.com/202404211852848.png"/>

### Phụ thuộc vào callback từ bên thứ ba

1. Client lấy URL đăng nhập bên thứ ba thông qua giao diện đã đăng ký (ví dụ: `auth:getAuthUrl`), và mang theo thông tin như tên ứng dụng, định danh bộ xác thực theo giao thức.
2. Chuyển hướng đến URL của bên thứ ba để hoàn tất đăng nhập. Dịch vụ bên thứ ba gọi giao diện callback của ứng dụng NocoBase (cần tự đăng ký, ví dụ: `auth:redirect`), trả về kết quả xác thực, đồng thời trả về thông tin như tên ứng dụng, định danh bộ xác thực.
3. Trong phương thức giao diện callback, phân tích cú pháp các tham số để lấy định danh bộ xác thực, thông qua `AuthManager` để lấy lớp xác thực tương ứng, và chủ động gọi phương thức `auth.signIn()`. Phương thức `auth.signIn()` sẽ gọi phương thức `validate()` để xử lý logic ủy quyền.
4. Phương thức callback nhận được `token` xác thực, sau đó chuyển hướng 302 trở lại trang frontend, và mang theo `token` cùng định danh bộ xác thực trong các tham số URL, `?authenticator=xxx&token=yyy`.

<img src="https://static-docs.nocobase.com/202404211852377.png"/>

Tiếp theo, chúng ta sẽ tìm hiểu cách đăng ký các giao diện phía máy chủ và giao diện người dùng phía client.

## Phía máy chủ

### Giao diện xác thực

Kernel của NocoBase cung cấp khả năng đăng ký và quản lý các loại xác thực mở rộng. Để xử lý logic cốt lõi của việc mở rộng **plugin** đăng nhập, bạn cần kế thừa lớp trừu tượng `Auth` của kernel và triển khai các giao diện tiêu chuẩn tương ứng.  
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

Kernel cũng đã đăng ký các thao tác tài nguyên cơ bản liên quan đến xác thực người dùng.

| API            | Mô tả                       |
| -------------- | --------------------------- |
| `auth:check`   | Kiểm tra người dùng đã đăng nhập chưa |
| `auth:signIn`  | Đăng nhập                   |
| `auth:signUp`  | Đăng ký                     |
| `auth:signOut` | Đăng xuất                   |

Trong hầu hết các trường hợp, loại xác thực người dùng mở rộng cũng có thể sử dụng logic xác thực JWT hiện có để tạo chứng chỉ cho người dùng truy cập API. Lớp `BaseAuth` trong kernel đã triển khai cơ bản lớp trừu tượng `Auth`, tham khảo [BaseAuth](../../../api/auth/base-auth.md). Các **plugin** có thể trực tiếp kế thừa lớp `BaseAuth` để tái sử dụng một phần mã logic, giúp giảm chi phí phát triển.

```javascript
import { BaseAuth } from '@nocobase/auth';

class CustomAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // Thiết lập bộ sưu tập người dùng
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // Triển khai logic xác thực người dùng
  async validate() {}
}
```

### Dữ liệu người dùng

Khi triển khai logic xác thực người dùng, thường liên quan đến việc xử lý dữ liệu người dùng. Trong ứng dụng NocoBase, theo mặc định, các **bộ sưu tập** liên quan được định nghĩa như sau:

| **Bộ sưu tập**           | Mô tả                                                                                                          | **Plugin**                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `users`               | Lưu trữ thông tin người dùng, như email, biệt danh và mật khẩu                                                        | [**Plugin** người dùng (`@nocobase/plugin-users`)](/users-permissions/user) |
| `authenticators`      | Lưu trữ thông tin bộ xác thực (thực thể loại xác thực), tương ứng với loại xác thực và cấu hình | **Plugin** xác thực người dùng (`@nocobase/plugin-auth`)              |
| `usersAuthenticators` | Liên kết người dùng và bộ xác thực, lưu thông tin người dùng dưới bộ xác thực tương ứng                    | **Plugin** xác thực người dùng (`@nocobase/plugin-auth`)              |

Thông thường, các phương thức đăng nhập mở rộng chỉ cần sử dụng `users` và `usersAuthenticators` để lưu trữ dữ liệu người dùng tương ứng. Chỉ trong những trường hợp đặc biệt mới cần tự thêm một **bộ sưu tập** mới.

Các trường chính của `usersAuthenticators` là:

| Trường            | Mô tả                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------- |
| `uuid`          | Định danh duy nhất của người dùng cho loại xác thực này, ví dụ: số điện thoại, OpenID của WeChat |
| `meta`          | Trường JSON, các thông tin khác cần lưu trữ                                                   |
| `userId`        | ID người dùng                                                                                     |
| `authenticator` | Tên bộ xác thực (định danh duy nhất)                                                      |

Đối với các thao tác truy vấn và tạo người dùng, mô hình dữ liệu `AuthModel` của `authenticators` cũng đóng gói một số phương thức có thể được sử dụng trong lớp `CustomAuth` thông qua `this.authenticator[tênPhươngThức]`. Tham khảo API đầy đủ tại [AuthModel](./api#authmodel).

```ts
import { AuthModel } from '@nocobase/plugin-auth';

class CustomAuth extends BaseAuth {
  async validate() {
    // ...
    const authenticator = this.authenticator as AuthModel;
    this.authenticator.findUser(); // Truy vấn người dùng
    this.authenticator.newUser(); // Tạo người dùng mới
    this.authenticator.findOrCreateUser(); // Truy vấn hoặc tạo người dùng mới
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

## Phía client

Giao diện người dùng phía client được đăng ký thông qua giao diện `registerType` do client của **plugin** xác thực người dùng cung cấp:

```ts
import AuthPlugin from '@nocobase/plugin-auth/client';

class CustomAuthPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType('custom-auth-type', {
      components: {
        SignInForm, // Biểu mẫu đăng nhập
        SignInButton, // Nút đăng nhập (bên thứ ba), có thể chọn một trong hai với biểu mẫu đăng nhập
        SignUpForm, // Biểu mẫu đăng ký
        AdminSettingsForm, // Biểu mẫu cài đặt quản trị
      },
    });
  }
}
```

### Biểu mẫu đăng nhập

![](https://static-docs.nocobase.com/33afe18f229c3db45c7a1921c2c050b7.png)

Nếu có nhiều bộ xác thực tương ứng với loại xác thực đã đăng ký biểu mẫu đăng nhập, chúng sẽ được hiển thị dưới dạng các Tab. Tiêu đề của Tab là tiêu đề của bộ xác thực được cấu hình ở phần quản trị.

![](https://static-docs.nocobase.com/ada6d7add744be0c812359c23bf4c7fc.png)

### Nút đăng nhập

![](https://static-docs.nocobase.com/e706f7785782adc77b0f4ee4faadfab8.png)

Thường là nút đăng nhập của bên thứ ba, nhưng trên thực tế có thể là bất kỳ thành phần nào.

### Biểu mẫu đăng ký

![](https://static-docs.nocobase.com/f95c53431bf21ec312fcfd51923f0b42.png)

Nếu cần chuyển từ trang đăng nhập sang trang đăng ký, bạn cần tự xử lý trong thành phần đăng nhập.

### Biểu mẫu cài đặt quản trị

![](https://static-docs.nocobase.com/f4b544b5b0f5afee5621ad4abf66b24f.png)

Phía trên là cấu hình bộ xác thực chung, phía dưới là phần biểu mẫu cấu hình tùy chỉnh có thể đăng ký.

### Yêu cầu API

Để gửi các yêu cầu API liên quan đến xác thực người dùng từ phía client, bạn có thể sử dụng SDK do NocoBase cung cấp.

```ts
import { useAPIClient } from '@nocobase/client';

// Sử dụng trong thành phần
const api = useAPIClient();
api.auth.signIn(data, authenticator);
```

Tham khảo API chi tiết tại [@nocobase/sdk - Auth](/api/sdk/auth).