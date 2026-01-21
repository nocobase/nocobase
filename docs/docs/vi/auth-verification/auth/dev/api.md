:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Tham chiếu API

## Phía máy chủ

### Auth

API lõi, tham khảo: [Auth](/api/auth/auth)

### BaseAuth

API lõi, tham khảo: [BaseAuth](/api/auth/base-auth)

### AuthModel

#### Tổng quan

`AuthModel` là mô hình dữ liệu của bộ xác thực (`Authenticator`) được sử dụng trong các ứng dụng NocoBase. (Tham khảo: [AuthManager - setStorer](/api/auth/auth-manager#setstorer) và [Auth - constructor](/api/auth/auth#constructor)). Nó cung cấp các phương thức để tương tác với bảng dữ liệu người dùng. Ngoài ra, bạn cũng có thể sử dụng các phương thức do Sequelize Model cung cấp.

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

#### Phương thức lớp

- `findUser(uuid: string): UserModel` - Truy vấn người dùng bằng `uuid`.
  - `uuid` - Mã định danh duy nhất của người dùng từ loại xác thực hiện tại.

- `newUser(uuid: string, userValues?: any): UserModel` - Tạo người dùng mới, liên kết người dùng với bộ xác thực hiện tại thông qua `uuid`.
  - `uuid` - Mã định danh duy nhất của người dùng từ loại xác thực hiện tại.
  - `userValues` - Tùy chọn. Các thông tin khác của người dùng. Nếu không truyền, `uuid` sẽ được sử dụng làm biệt danh của người dùng.

- `findOrCreateUser(uuid: string, userValues?: any): UserModel` - Tìm hoặc tạo người dùng mới, quy tắc tạo tương tự như trên.
  - `uuid` - Mã định danh duy nhất của người dùng từ loại xác thực hiện tại.
  - `userValues` - Tùy chọn. Các thông tin khác của người dùng.

## Phía máy khách

### `plugin.registerType()`

Đăng ký máy khách cho loại xác thực.

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

#### Chữ ký

- `registerType(authType: string, options: AuthOptions)`

#### Kiểu

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

- `SignInForm` - Biểu mẫu đăng nhập
- `SignInButton` - Nút đăng nhập (bên thứ ba), có thể dùng thay thế cho biểu mẫu đăng nhập.
- `SignUpForm` - Biểu mẫu đăng ký
- `AdminSettingsForm` - Biểu mẫu cấu hình quản trị.

### Tuyến đường

Các tuyến đường phía máy khách mà plugin auth đăng ký như sau:

- Bố cục Auth
  - name: `auth`
  - path: `-`
  - component: `AuthLayout`

- Trang Đăng nhập
  - name: `auth.signin`
  - path: `/signin`
  - component: `SignInPage`

- Trang Đăng ký
  - name: `auth.signup`
  - path: `/signup`
  - component: `SignUpPage`