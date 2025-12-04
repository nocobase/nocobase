:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Tích hợp

## Tổng quan

NocoBase cung cấp khả năng tích hợp toàn diện, cho phép kết nối liền mạch với các hệ thống bên ngoài, dịch vụ của bên thứ ba và nhiều nguồn dữ liệu khác nhau. Thông qua các phương pháp tích hợp linh hoạt, bạn có thể mở rộng chức năng của NocoBase để đáp ứng các nhu cầu kinh doanh đa dạng.

## Các phương pháp tích hợp

### Tích hợp API

NocoBase cung cấp khả năng API mạnh mẽ để tích hợp với các ứng dụng và dịch vụ bên ngoài:

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

- **[Khóa API](/integration/api-keys/)**: Sử dụng khóa API để xác thực an toàn, truy cập tài nguyên NocoBase theo chương trình
- **[Tài liệu API](/integration/api-doc/)**: Tài liệu API tích hợp sẵn để khám phá và kiểm thử các điểm cuối

### Đăng nhập một lần (SSO)

Tích hợp với các hệ thống nhận dạng doanh nghiệp để thực hiện xác thực hợp nhất:

![auth_sso-2025-11-24-08-26-46](https://static-docs.nocobase.com/auth_sso-2025-11-24-08-26-46.png)

- **[Tích hợp SSO](/integration/sso/)**: Hỗ trợ xác thực SAML, OIDC, CAS, LDAP và các nền tảng của bên thứ ba
- Quản lý người dùng và kiểm soát truy cập tập trung
- Trải nghiệm xác thực liền mạch trên các hệ thống

### Tích hợp luồng công việc

Kết nối các luồng công việc của NocoBase với các hệ thống bên ngoài:

![auth_sso-2025-11-24-12-02-01](https://static-docs.nocobase.com/auth_sso-2025-11-24-12-02-01.png)

- **[Webhook luồng công việc](/integration/workflow-webhook/)**: Nhận các sự kiện từ hệ thống bên ngoài để kích hoạt luồng công việc
- **[Yêu cầu HTTP luồng công việc](/integration/workflow-http-request/)**: Gửi yêu cầu HTTP đến các API bên ngoài từ luồng công việc
- Tự động hóa quy trình kinh doanh trên các nền tảng

### Nguồn dữ liệu bên ngoài

Kết nối với các cơ sở dữ liệu và hệ thống dữ liệu bên ngoài:

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

- **[Cơ sở dữ liệu bên ngoài](/data-sources/)**: Kết nối trực tiếp với các cơ sở dữ liệu MySQL, PostgreSQL, MariaDB, MSSQL, Oracle và KingbaseES
- Nhận diện cấu trúc bảng của cơ sở dữ liệu bên ngoài và thực hiện các thao tác CRUD trực tiếp trên dữ liệu bên ngoài trong NocoBase
- Giao diện quản lý dữ liệu hợp nhất

### Nội dung nhúng

Nhúng nội dung bên ngoài vào NocoBase:

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

- **[Khối Iframe](/integration/block-iframe/)**: Nhúng các trang web và ứng dụng bên ngoài
- **Khối JS**: Thực thi mã JavaScript tùy chỉnh để đạt được tích hợp nâng cao

## Các kịch bản tích hợp phổ biến

### Tích hợp hệ thống doanh nghiệp

- Kết nối NocoBase với ERP, CRM hoặc các hệ thống doanh nghiệp khác
- Đồng bộ hóa dữ liệu hai chiều
- Tự động hóa luồng công việc liên hệ thống

### Tích hợp dịch vụ bên thứ ba

- Truy vấn trạng thái thanh toán từ cổng thanh toán, tích hợp dịch vụ nhắn tin hoặc nền tảng đám mây
- Tận dụng API bên ngoài để mở rộng chức năng
- Xây dựng tích hợp tùy chỉnh bằng cách sử dụng webhook và yêu cầu HTTP

### Tích hợp dữ liệu

- Kết nối với nhiều nguồn dữ liệu
- Tổng hợp dữ liệu từ các hệ thống khác nhau
- Tạo bảng điều khiển và báo cáo hợp nhất

## Các lưu ý về bảo mật

Khi tích hợp NocoBase với các hệ thống bên ngoài, vui lòng xem xét các thực tiễn bảo mật tốt nhất sau:

1. **Sử dụng HTTPS**: Luôn sử dụng kết nối được mã hóa để truyền dữ liệu
2. **Bảo vệ khóa API**: Lưu trữ khóa API một cách an toàn và xoay vòng định kỳ
3. **Nguyên tắc đặc quyền tối thiểu**: Chỉ cấp các quyền cần thiết cho việc tích hợp
4. **Ghi nhật ký kiểm tra**: Giám sát và ghi lại các hoạt động tích hợp
5. **Xác thực dữ liệu**: Xác thực tất cả dữ liệu từ các nguồn bên ngoài