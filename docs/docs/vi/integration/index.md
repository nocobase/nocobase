---
title: "Tổng quan tích hợp NocoBase"
description: "Khả năng tích hợp của NocoBase: API Key và tài liệu API, đăng nhập một lần SSO, Webhook/HTTP request trong workflow, nguồn dữ liệu ngoài FDW, nhúng iframe, kết nối hệ thống doanh nghiệp và tích hợp dịch vụ bên thứ ba."
keywords: "Tích hợp,Tích hợp API,Webhook,FDW,SSO,Đăng nhập một lần,Tích hợp workflow,Nguồn dữ liệu ngoài,NocoBase"
---

# Tích hợp

## Tổng quan

NocoBase cung cấp khả năng tích hợp toàn diện, cho phép kết nối liền mạch với các hệ thống bên ngoài, dịch vụ bên thứ ba và nhiều nguồn dữ liệu khác nhau. Thông qua các phương thức tích hợp linh hoạt, bạn có thể mở rộng tính năng của NocoBase để đáp ứng các nhu cầu kinh doanh đa dạng.

## Phương thức tích hợp

### Tích hợp API

NocoBase cung cấp khả năng API mạnh mẽ để tích hợp với các ứng dụng và dịch vụ bên ngoài:

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

- **[API Key](/integration/api-keys/index.md)**: Sử dụng API Key để xác thực an toàn và truy cập tài nguyên NocoBase theo phương thức lập trình
- **[Tài liệu API](/integration/api-doc/index.md)**: Tài liệu API tích hợp sẵn để khám phá và kiểm thử các endpoint

### Đăng nhập một lần (SSO)

Tích hợp với hệ thống định danh doanh nghiệp để xác thực thống nhất:

![auth_sso-2025-11-24-08-26-46](https://static-docs.nocobase.com/auth_sso-2025-11-24-08-26-46.png)

- **[Tích hợp SSO](/integration/sso/index.md)**: Hỗ trợ xác thực SAML, OIDC, CAS, LDAP và các nền tảng bên thứ ba
- Quản lý người dùng và kiểm soát truy cập tập trung
- Trải nghiệm xác thực liền mạch giữa các hệ thống

### Tích hợp workflow

Kết nối workflow của NocoBase với các hệ thống bên ngoài:

![auth_sso-2025-11-24-12-02-01](https://static-docs.nocobase.com/auth_sso-2025-11-24-12-02-01.png)

- **[Workflow Webhook](/integration/workflow-webhook/index.md)**: Nhận sự kiện từ hệ thống bên ngoài để kích hoạt workflow
- **[Workflow HTTP Request](/integration/workflow-http-request/index.md)**: Gửi HTTP request từ workflow đến API bên ngoài
- Tự động hóa quy trình kinh doanh giữa các nền tảng

### Nguồn dữ liệu ngoài

Kết nối đến cơ sở dữ liệu và hệ thống dữ liệu bên ngoài:

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

- **[Cơ sở dữ liệu ngoài](/data-sources/index.md)**: Kết nối trực tiếp đến MySQL, PostgreSQL, MariaDB, MSSQL, Oracle và KingbaseES
- Nhận diện cấu trúc bảng cơ sở dữ liệu ngoài, thực hiện trực tiếp các thao tác CRUD trên dữ liệu ngoài trong NocoBase
- Giao diện quản lý dữ liệu thống nhất

### Nội dung nhúng

Nhúng nội dung bên ngoài vào NocoBase:

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

- **[Block Iframe](/integration/block-iframe/index.md)**: Nhúng các trang web và ứng dụng bên ngoài
- **JS Block**: Thực thi mã JavaScript tùy chỉnh để tích hợp nâng cao

## Các kịch bản tích hợp phổ biến

### Tích hợp hệ thống doanh nghiệp

- Kết nối NocoBase với ERP, CRM hoặc các hệ thống doanh nghiệp khác
- Đồng bộ dữ liệu hai chiều
- Tự động hóa workflow giữa các hệ thống

### Tích hợp dịch vụ bên thứ ba

- Truy vấn trạng thái thanh toán của payment gateway, tích hợp dịch vụ tin nhắn hoặc nền tảng cloud
- Mở rộng tính năng bằng cách tận dụng API bên ngoài
- Xây dựng tích hợp tùy chỉnh bằng webhook và HTTP request

### Tích hợp dữ liệu

- Kết nối đến nhiều nguồn dữ liệu
- Tổng hợp dữ liệu từ các hệ thống khác nhau
- Tạo dashboard và báo cáo thống nhất

## Lưu ý về bảo mật

Khi tích hợp NocoBase với hệ thống bên ngoài, hãy cân nhắc các thực hành bảo mật tốt nhất sau:

1. **Sử dụng HTTPS**: Luôn sử dụng kết nối được mã hóa để truyền dữ liệu
2. **Bảo vệ API Key**: Lưu trữ API Key một cách an toàn và xoay vòng định kỳ
3. **Nguyên tắc đặc quyền tối thiểu**: Chỉ cấp các quyền cần thiết cho việc tích hợp
4. **Log audit**: Giám sát và ghi lại các hoạt động tích hợp
5. **Xác thực dữ liệu**: Xác thực mọi dữ liệu đến từ nguồn bên ngoài
