:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Tích hợp Đăng nhập một lần (SSO)

NocoBase cung cấp giải pháp Đăng nhập một lần (SSO) toàn diện, hỗ trợ nhiều giao thức xác thực phổ biến, giúp tích hợp liền mạch với các hệ thống nhận dạng hiện có của doanh nghiệp.

## Tổng quan

Đăng nhập một lần cho phép người dùng sử dụng một bộ thông tin đăng nhập duy nhất để truy cập nhiều hệ thống liên quan nhưng độc lập. Người dùng chỉ cần đăng nhập một lần là có thể truy cập tất cả các ứng dụng được ủy quyền mà không cần nhập lại tên người dùng và mật khẩu. Điều này không chỉ nâng cao trải nghiệm người dùng mà còn tăng cường bảo mật hệ thống và hiệu quả quản lý.

## Các giao thức xác thực được hỗ trợ

NocoBase hỗ trợ các giao thức và phương thức xác thực sau thông qua các **plugin**:

### Giao thức SSO cấp doanh nghiệp

- **[SAML 2.0](/auth-verification/auth-saml/)**: Một tiêu chuẩn mở dựa trên XML, được sử dụng rộng rãi trong xác thực danh tính cấp doanh nghiệp. Phù hợp cho các trường hợp cần tích hợp với nhà cung cấp danh tính (IdP) của doanh nghiệp.

- **[OIDC (OpenID Connect)](/auth-verification/auth-oidc/)**: Lớp xác thực danh tính dựa trên OAuth 2.0, cung cấp cơ chế xác thực và ủy quyền hiện đại. Hỗ trợ tích hợp với các nhà cung cấp danh tính lớn (như Google, Azure AD, v.v.).

- **[CAS (Central Authentication Service)](/auth-verification/auth-cas/)**: Giao thức đăng nhập một lần được phát triển bởi Đại học Yale, được áp dụng rộng rãi trong các trường đại học và tổ chức giáo dục.

- **[LDAP](/auth-verification/auth-ldap/)**: Giao thức truy cập thư mục nhẹ, dùng để truy cập và duy trì các dịch vụ thông tin thư mục phân tán. Phù hợp cho các trường hợp cần tích hợp với Active Directory hoặc các máy chủ LDAP khác.

### Xác thực nền tảng bên thứ ba

- **[WeCom (WeChat Work)](/auth-verification/auth-wecom/)**: Hỗ trợ đăng nhập bằng mã QR WeCom và đăng nhập không cần mật khẩu trong ứng dụng WeCom.

- **[DingTalk](/auth-verification/auth-dingtalk/)**: Hỗ trợ đăng nhập bằng mã QR DingTalk và đăng nhập không cần mật khẩu trong ứng dụng DingTalk.

### Các phương thức xác thực khác

- **[Mã xác minh SMS](/auth-verification/auth-sms/)**: Phương thức đăng nhập bằng mã xác minh gửi qua tin nhắn điện thoại.

- **[Tên người dùng/Mật khẩu](/auth-verification/auth/)**: Phương thức xác thực cơ bản được tích hợp sẵn trong NocoBase.

## Các bước tích hợp

### 1. Cài đặt **plugin** xác thực

Tùy theo nhu cầu của bạn, hãy tìm và cài đặt **plugin** xác thực phù hợp trong trình quản lý **plugin**. Hầu hết các **plugin** xác thực SSO yêu cầu mua hoặc đăng ký riêng.

![auth_sso-2025-11-24-08-26-46](https://static-docs.nocobase.com/auth_sso-2025-11-24-08-26-46.png)

Ví dụ, cài đặt **plugin** xác thực SAML 2.0:

![](https://static-docs.nocobase.com/6a12f3d8073c47532a4f8aac900e4296.png)

Hoặc cài đặt **plugin** xác thực OIDC:

![](https://static-docs.nocobase.com/202411122358790.png)

### 2. Cấu hình phương thức xác thực

1. Truy cập trang **Cài đặt hệ thống > Xác thực người dùng**

![](https://static-docs.nocobase.com/202411130004459.png)

2. Nhấp vào **Thêm phương thức xác thực**
3. Chọn loại xác thực đã cài đặt (ví dụ: SAML)

![](https://static-docs.nocobase.com/5076fe56086b7799be308bbaf7c4425d.png)

Hoặc chọn OIDC:

![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)

4. Cấu hình các thông số liên quan theo hướng dẫn

### 3. Cấu hình nhà cung cấp danh tính

Mỗi giao thức xác thực yêu cầu cấu hình thông tin nhà cung cấp danh tính tương ứng:

- **SAML**: Cấu hình siêu dữ liệu IdP, chứng chỉ, v.v.

![](https://static-docs.nocobase.com/976b66e589973c322d81dcddd22c6146.png)

- **OIDC**: Cấu hình Client ID, Client Secret, điểm cuối khám phá (discovery endpoint), v.v.

![](https://static-docs.nocobase.com/202411130006341.png)

- **CAS**: Cấu hình địa chỉ máy chủ CAS
- **LDAP**: Cấu hình địa chỉ máy chủ LDAP, Bind DN, v.v.
- **WeCom/DingTalk**: Cấu hình thông tin xác thực ứng dụng, Corp ID, v.v.

### 4. Kiểm tra đăng nhập

Sau khi cấu hình xong, bạn nên thực hiện kiểm tra đăng nhập:

1. Đăng xuất khỏi phiên hiện tại
2. Trên trang đăng nhập, chọn phương thức SSO đã cấu hình

![](https://static-docs.nocobase.com/74963865c9d36a294948e6adeb5b24bc.png)

3. Hoàn tất quy trình xác thực của nhà cung cấp danh tính
4. Xác minh xem có thể đăng nhập NocoBase thành công hay không

## Ánh xạ người dùng và phân quyền

Sau khi xác thực SSO thành công, NocoBase sẽ tự động xử lý tài khoản người dùng:

- **Đăng nhập lần đầu**: Tự động tạo tài khoản người dùng mới và đồng bộ thông tin cơ bản (biệt danh, email, v.v.) từ nhà cung cấp danh tính.
- **Các lần đăng nhập sau**: Sử dụng tài khoản hiện có; có thể chọn có đồng bộ cập nhật thông tin người dùng hay không.
- **Phân quyền**: Có thể cấu hình vai trò mặc định, hoặc tự động phân quyền dựa trên trường vai trò trong thông tin người dùng.

## Khuyến nghị bảo mật

1. **Sử dụng HTTPS**: Đảm bảo NocoBase được triển khai trong môi trường HTTPS để bảo vệ an toàn dữ liệu xác thực khi truyền tải.
2. **Cập nhật chứng chỉ thường xuyên**: Kịp thời cập nhật và xoay vòng các thông tin xác thực bảo mật như chứng chỉ SAML.
3. **Cấu hình danh sách trắng URL gọi lại**: Cấu hình chính xác URL gọi lại của NocoBase tại nhà cung cấp danh tính.
4. **Nguyên tắc đặc quyền tối thiểu**: Gán các vai trò và quyền phù hợp cho người dùng SSO.
5. **Bật ghi nhật ký kiểm tra**: Ghi lại và giám sát các hoạt động đăng nhập SSO.

## Các câu hỏi thường gặp

### Đăng nhập SSO thất bại?

1. Kiểm tra xem cấu hình nhà cung cấp danh tính có chính xác không.
2. Xác minh URL gọi lại đã được cấu hình đúng chưa.
3. Xem nhật ký NocoBase để biết thông tin lỗi chi tiết.
4. Xác nhận chứng chỉ và khóa có hợp lệ không.

### Thông tin người dùng không đồng bộ?

1. Kiểm tra các thuộc tính người dùng được trả về từ nhà cung cấp danh tính.
2. Xác minh cấu hình ánh xạ trường có chính xác không.
3. Xác nhận tùy chọn đồng bộ thông tin người dùng đã được bật chưa.

### Làm thế nào để hỗ trợ nhiều phương thức xác thực cùng lúc?

NocoBase hỗ trợ cấu hình nhiều phương thức xác thực cùng lúc. Người dùng có thể chọn phương thức phù hợp trên trang đăng nhập.

## Tài nguyên liên quan

- [Tài liệu xác thực người dùng](/auth-verification/auth/)
- [Xác thực khóa API](/integration/api-keys/)
- [Quản lý người dùng và quyền hạn](/plugins/@nocobase/plugin-users/)