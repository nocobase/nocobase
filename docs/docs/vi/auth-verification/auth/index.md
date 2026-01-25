:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Xác thực người dùng

Module xác thực người dùng của NocoBase chủ yếu bao gồm hai phần:

-   `@nocobase/auth` trong nhân (kernel) định nghĩa các giao diện mở rộng và middleware liên quan đến xác thực người dùng như đăng nhập, đăng ký, xác minh, đồng thời dùng để đăng ký và quản lý các phương thức xác thực mở rộng khác nhau.
-   `@nocobase/plugin-auth` trong plugin được dùng để khởi tạo module quản lý xác thực trong nhân, đồng thời cung cấp phương thức xác thực cơ bản bằng tên người dùng (hoặc email) / mật khẩu.

> Cần sử dụng đồng thời với chức năng quản lý người dùng được cung cấp bởi [`plugin @nocobase/plugin-users`](/users-permissions/user).

Ngoài ra, NocoBase còn cung cấp nhiều plugin phương thức xác thực người dùng khác:

-   [`@nocobase/plugin-auth-sms`](/auth-verification/auth-sms/) - Cung cấp chức năng đăng nhập bằng xác minh SMS
-   [`@nocobase/plugin-auth-saml`](/auth-verification/auth-saml/) - Cung cấp chức năng đăng nhập SAML SSO
-   [`@nocobase/plugin-auth-oidc`](/auth-verification/auth-oidc/) - Cung cấp chức năng đăng nhập OIDC SSO
-   [`@nocobase/plugin-auth-cas`](/auth-verification/auth-cas/) - Cung cấp chức năng đăng nhập CAS SSO
-   [`@nocobase/plugin-auth-ldap`](/auth-verification/auth-ldap/) - Cung cấp chức năng đăng nhập LDAP SSO
-   [`@nocobase/plugin-auth-wecom`](/auth-verification/auth-wecom/) - Cung cấp chức năng đăng nhập WeCom
-   [`@nocobase/plugin-auth-dingtalk`](/auth-verification/auth-dingtalk/) - Cung cấp chức năng đăng nhập DingTalk

Thông qua các plugin trên, sau khi quản trị viên cấu hình phương thức xác thực tương ứng, người dùng có thể trực tiếp sử dụng danh tính người dùng được cung cấp bởi các nền tảng như Google Workspace, Microsoft Azure để đăng nhập vào hệ thống, và cũng có thể kết nối với các công cụ nền tảng như Auth0, Logto, Keycloak. Ngoài ra, các nhà phát triển cũng có thể dễ dàng mở rộng các phương thức xác thực khác mà họ cần thông qua các giao diện cơ bản mà chúng tôi cung cấp.