---
title: "Tích hợp đăng nhập một lần SSO"
description: "Tích hợp SSO của NocoBase: xác thực SAML, OIDC, CAS, LDAP, WeCom, DingTalk, cấu hình identity provider, mapping người dùng, phân vai trò, khuyến nghị bảo mật."
keywords: "SSO,Đăng nhập một lần,SAML,OIDC,CAS,LDAP,WeCom,DingTalk,Xác thực thống nhất,NocoBase"
---

# Tích hợp đăng nhập một lần (SSO)

NocoBase cung cấp giải pháp đăng nhập một lần (Single Sign-On, SSO) hoàn chỉnh, hỗ trợ nhiều giao thức xác thực phổ biến, có thể tích hợp liền mạch với hệ thống xác thực định danh hiện có của doanh nghiệp.

## Tổng quan

Đăng nhập một lần cho phép người dùng dùng một bộ thông tin đăng nhập để truy cập nhiều hệ thống liên quan nhưng độc lập. Người dùng chỉ cần đăng nhập một lần, là có thể truy cập tất cả các ứng dụng được ủy quyền mà không cần nhập lại tên đăng nhập và mật khẩu. Điều này không chỉ nâng cao trải nghiệm người dùng mà còn tăng cường bảo mật hệ thống và hiệu quả quản lý.

## Các giao thức xác thực được hỗ trợ

NocoBase hỗ trợ các giao thức và phương thức xác thực sau thông qua plugin:

### Giao thức SSO doanh nghiệp

- **[SAML 2.0](/auth-verification/auth-saml/index.md)**: Tiêu chuẩn mở dựa trên XML, được sử dụng rộng rãi trong xác thực định danh doanh nghiệp. Phù hợp với các kịch bản cần tích hợp với identity provider (IdP) của doanh nghiệp.

- **[OIDC (OpenID Connect)](/auth-verification/auth-oidc/index.md)**: Lớp xác thực định danh dựa trên OAuth 2.0, cung cấp cơ chế xác thực và ủy quyền hiện đại. Hỗ trợ tích hợp với các identity provider phổ biến (như Google, Azure AD, v.v.).

- **[CAS (Central Authentication Service)](/auth-verification/auth-cas/index.md)**: Giao thức đăng nhập một lần do Đại học Yale phát triển, được sử dụng rộng rãi trong các tổ chức giáo dục và đại học.

- **[LDAP](/auth-verification/auth-ldap/index.md)**: Giao thức truy cập thư mục nhẹ, dùng để truy cập và duy trì dịch vụ thông tin thư mục phân tán. Phù hợp với các kịch bản cần tích hợp với Active Directory hoặc các máy chủ LDAP khác.

### Xác thực nền tảng bên thứ ba

- **[WeCom](/auth-verification/auth-wecom/index.md)**: Hỗ trợ đăng nhập quét QR WeCom và đăng nhập tự động trong WeCom.

- **[DingTalk](/auth-verification/auth-dingtalk/index.md)**: Hỗ trợ đăng nhập quét QR DingTalk và đăng nhập tự động trong DingTalk.

### Phương thức xác thực khác

- **[Mã xác thực SMS](/auth-verification/auth-sms/index.md)**: Phương thức đăng nhập bằng mã xác thực SMS qua điện thoại di động.

- **[Tên đăng nhập và mật khẩu](/auth-verification/auth/index.md)**: Phương thức xác thực cơ bản tích hợp sẵn của NocoBase.

## Các bước tích hợp

### 1. Cài đặt plugin xác thực

Dựa vào nhu cầu của bạn, tìm và cài đặt plugin xác thực tương ứng trong trình quản lý plugin. Hầu hết các plugin xác thực SSO cần mua hoặc đăng ký riêng.

![auth_sso-2025-11-24-08-26-46](https://static-docs.nocobase.com/auth_sso-2025-11-24-08-26-46.png)

Ví dụ, cài đặt plugin xác thực SAML 2.0:

![](https://static-docs.nocobase.com/6a12f3d8073c47532a4f8aac900e4296.png)

Hoặc cài đặt plugin xác thực OIDC:

![](https://static-docs.nocobase.com/202411122358790.png)

### 2. Cấu hình phương thức xác thực

1. Vào trang **Cài đặt hệ thống > Xác thực người dùng**

![](https://static-docs.nocobase.com/202411130004459.png)

2. Nhấp **Thêm phương thức xác thực**
3. Chọn loại xác thực đã cài đặt (ví dụ SAML)

![](https://static-docs.nocobase.com/5076fe56086b7799be308bbaf7c4425d.png)

Hoặc chọn OIDC:

![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)

4. Cấu hình tham số liên quan dựa theo hướng dẫn

### 3. Cấu hình identity provider

Mỗi giao thức xác thực cần cấu hình thông tin identity provider tương ứng:

- **SAML**: Cấu hình metadata IdP, certificate, v.v.

![](https://static-docs.nocobase.com/976b66e589973c322d81dcddd22c6146.png)

- **OIDC**: Cấu hình Client ID, Client Secret, discovery endpoint, v.v.

![](https://static-docs.nocobase.com/202411130006341.png)

- **CAS**: Cấu hình địa chỉ máy chủ CAS
- **LDAP**: Cấu hình địa chỉ máy chủ LDAP, bind DN, v.v.
- **WeCom/DingTalk**: Cấu hình thông tin xác thực ứng dụng, Corp ID, v.v.

### 4. Kiểm thử đăng nhập

Sau khi cấu hình xong, khuyến nghị kiểm thử trước:

1. Đăng xuất khỏi tài khoản hiện tại
2. Trên trang đăng nhập, chọn phương thức SSO đã cấu hình

![](https://static-docs.nocobase.com/74963865c9d36a294948e6adeb5b24bc.png)

3. Hoàn thành quy trình xác thực của identity provider
4. Xác minh có đăng nhập NocoBase thành công không

## Mapping người dùng và phân vai trò

Sau khi xác thực SSO thành công, NocoBase sẽ tự động xử lý tài khoản người dùng:

- **Lần đăng nhập đầu**: Tự động tạo tài khoản người dùng mới và đồng bộ thông tin cơ bản (biệt danh, email, v.v.) từ identity provider
- **Đăng nhập lại**: Sử dụng tài khoản hiện có để đăng nhập, có thể chọn có đồng bộ cập nhật thông tin người dùng hay không
- **Phân vai trò**: Có thể cấu hình vai trò mặc định, hoặc tự động phân vai trò dựa trên trường vai trò trong thông tin người dùng

## Khuyến nghị bảo mật

1. **Sử dụng HTTPS**: Đảm bảo NocoBase được triển khai trong môi trường HTTPS, bảo vệ an toàn truyền dữ liệu xác thực
2. **Cập nhật certificate định kỳ**: Cập nhật và xoay vòng kịp thời các thông tin bảo mật như certificate SAML
3. **Cấu hình whitelist địa chỉ callback**: Cấu hình đúng địa chỉ callback của NocoBase tại identity provider
4. **Nguyên tắc đặc quyền tối thiểu**: Phân vai trò và quyền phù hợp cho người dùng SSO
5. **Bật log audit**: Ghi lại và giám sát hành vi đăng nhập SSO

## Câu hỏi thường gặp

### Đăng nhập SSO thất bại?

1. Kiểm tra cấu hình identity provider có chính xác không
2. Xác minh địa chỉ callback có được cấu hình đúng không
3. Xem log NocoBase để biết thông tin lỗi chi tiết
4. Xác nhận certificate và khóa có còn hiệu lực không

### Thông tin người dùng không được đồng bộ?

1. Kiểm tra thuộc tính người dùng được trả về bởi identity provider
2. Xác minh cấu hình mapping trường có chính xác không
3. Xác nhận đã bật tùy chọn đồng bộ thông tin người dùng chưa

### Cách hỗ trợ đồng thời nhiều phương thức xác thực?

NocoBase hỗ trợ cấu hình đồng thời nhiều phương thức xác thực, người dùng có thể chọn phương thức phù hợp để đăng nhập trên trang đăng nhập.

## Tài nguyên liên quan

- [Tài liệu xác thực người dùng](/auth-verification/auth/index.md)
- [Xác thực API Key](/integration/api-keys/index.md)
- [Quản lý người dùng và phân quyền](/plugins/@nocobase/plugin-users/index.md)
