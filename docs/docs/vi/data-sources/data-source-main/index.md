---
pkg: "@nocobase/plugin-data-source-main"
title: "Main Database"
description: "Database chính của NocoBase: lưu trữ dữ liệu nghiệp vụ và metadata, hỗ trợ MySQL/PostgreSQL/MariaDB, đồng bộ bảng có sẵn từ database, tạo General Collection/Tree Collection/SQL Collection, v.v."
keywords: "Database chính,MySQL,PostgreSQL,MariaDB,Đồng bộ Collection,Lưu trữ metadata,NocoBase"
---
# Main Database

## Giới thiệu

Database chính của NocoBase vừa có thể dùng để lưu trữ dữ liệu nghiệp vụ, vừa dùng để lưu trữ metadata của ứng dụng, bao gồm dữ liệu bảng hệ thống, dữ liệu bảng tùy chỉnh, v.v. Database chính hỗ trợ các relational database như MySQL, PostgreSQL. Khi cài đặt ứng dụng NocoBase, Database chính phải được cài đặt đồng bộ và không thể xóa.

## Cài đặt

Plugin tích hợp sẵn, không cần cài đặt riêng.

## Quản lý Collection

Main Data Source cung cấp đầy đủ chức năng quản lý Collection, vừa có thể tạo bảng mới thông qua NocoBase, vừa có thể đồng bộ cấu trúc bảng có sẵn trong database.

![20240322230134](https://static-docs.nocobase.com/20240322230134.png)

### Đồng bộ bảng có sẵn từ database

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Một đặc điểm quan trọng của Main Data Source là có thể đồng bộ các bảng đã tồn tại trong database vào NocoBase để quản lý. Điều này có nghĩa là:

- **Bảo vệ đầu tư hiện có**: Nếu trong database của bạn đã có nhiều bảng nghiệp vụ, không cần phải tạo lại, có thể đồng bộ trực tiếp để sử dụng
- **Tích hợp linh hoạt**: Có thể đưa các bảng được tạo bằng các công cụ khác (như SQL script, công cụ quản lý database, v.v.) vào quản lý của NocoBase
- **Migration tăng dần**: Hỗ trợ chuyển đổi dần dần hệ thống có sẵn sang NocoBase, thay vì tái cấu trúc một lần

Thông qua chức năng "Load from database", bạn có thể:
1. Duyệt tất cả các bảng trong database
2. Chọn các bảng cần đồng bộ
3. Tự động nhận biết cấu trúc bảng và kiểu field
4. Import vào NocoBase với một cú nhấp chuột để quản lý

### Hỗ trợ nhiều kiểu cấu trúc bảng

![nocobase_doc-2025-10-29-19-47-14](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-47-14.png)

NocoBase hỗ trợ tạo và quản lý nhiều kiểu Collection:
- **General Collection**: Tích hợp sẵn các field hệ thống thông dụng;
- **Inheritance Collection**: Có thể tạo một bảng cha, sau đó dẫn xuất bảng con từ bảng cha đó, bảng con sẽ kế thừa cấu trúc của bảng cha, đồng thời còn có thể định nghĩa các cột riêng.
- **Tree Collection**: Bảng cấu trúc cây, hiện chỉ hỗ trợ thiết kế adjacency list;
- **Calendar Collection**: Dùng để tạo bảng sự kiện liên quan đến calendar;
- **File Collection**: Dùng cho việc quản lý file storage;
- **Expression Collection**: Dùng cho các tình huống expression động của workflow;
- **SQL Collection**: Không phải là bảng database thực sự, mà là hiển thị nhanh chóng truy vấn SQL ở dạng có cấu trúc;
- **View Collection**: Kết nối với view có sẵn của database;
- **External Collection**: Cho phép database system truy cập và truy vấn trực tiếp dữ liệu trong external Data Source, dựa trên công nghệ FDW;

### Hỗ trợ phân loại quản lý Collection

![20240322231520](https://static-docs.nocobase.com/20240322231520.png)

### Cung cấp các kiểu field phong phú

![nocobase_doc-2025-10-29-19-48-51](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-48-51.png)

#### Chuyển đổi kiểu field linh hoạt

NocoBase hỗ trợ chuyển đổi kiểu field linh hoạt trên cùng kiểu database.

**Ví dụ: Tùy chọn chuyển đổi của field kiểu String**

Khi field trong database là kiểu String, có thể chuyển đổi trong NocoBase thành bất kỳ form nào sau đây:

- **Kiểu cơ bản**: Single-line text, Multi-line text, Phone number, Email, URL, Password, Color, Icon
- **Kiểu chọn**: Dropdown menu (single select), Radio button
- **Kiểu rich media**: Markdown, Markdown (Vditor), Rich text, Attachment (URL)
- **Kiểu date/time**: Date time (with timezone), Date time (without timezone)
- **Kiểu nâng cao**: Auto-coding, Collection selector, Encryption

Cơ chế chuyển đổi linh hoạt này có nghĩa là:
- **Không cần sửa cấu trúc database**: Kiểu lưu trữ ở tầng dưới của field giữ nguyên không thay đổi, chỉ thay đổi cách thể hiện trong NocoBase
- **Thích ứng với thay đổi nghiệp vụ**: Khi yêu cầu nghiệp vụ thay đổi, có thể nhanh chóng điều chỉnh cách hiển thị và tương tác của field
- **Bảo mật dữ liệu**: Quá trình chuyển đổi không ảnh hưởng đến tính toàn vẹn của dữ liệu hiện có

### Đồng bộ linh hoạt ở mức field

NocoBase không chỉ có thể đồng bộ toàn bộ bảng, mà còn hỗ trợ quản lý đồng bộ chi tiết ở mức field:

![nocobase_doc-2025-10-29-19-49-56](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-49-56.png)

#### Đặc điểm của đồng bộ field:

1. **Đồng bộ thời gian thực**: Khi cấu trúc bảng database thay đổi, có thể đồng bộ field mới được thêm bất kỳ lúc nào
2. **Đồng bộ có chọn lọc**: Có thể chọn lọc đồng bộ các field cần thiết, thay vì tất cả các field
3. **Tự động nhận biết kiểu**: Tự động nhận biết kiểu field database và map đến kiểu field của NocoBase
4. **Giữ tính toàn vẹn dữ liệu**: Quá trình đồng bộ không ảnh hưởng đến dữ liệu hiện có

#### Tình huống sử dụng:

- **Tiến hóa cấu trúc database**: Khi yêu cầu nghiệp vụ thay đổi, cần thêm field mới trong database, có thể nhanh chóng đồng bộ vào NocoBase
- **Hợp tác nhóm**: Khi thành viên khác trong team hoặc DBA thêm field trong database, có thể đồng bộ kịp thời
- **Mô hình quản lý hỗn hợp**: Một số field được quản lý thông qua NocoBase, một số field được quản lý theo cách truyền thống, kết hợp linh hoạt

Cơ chế đồng bộ linh hoạt này cho phép NocoBase tích hợp tốt với kiến trúc kỹ thuật hiện có, không cần thay đổi cách quản lý database ban đầu, đồng thời lại có thể tận hưởng sự tiện lợi phát triển low-code do NocoBase mang lại.

Xem thêm tại chương "[Field Collection / Tổng quan](/data-sources/data-modeling/collection-fields)"
