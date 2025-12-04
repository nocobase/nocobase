---
pkg: "@nocobase/plugin-data-source-manager"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Quản lý nguồn dữ liệu

## Giới thiệu

NocoBase cung cấp plugin quản lý nguồn dữ liệu, dùng để quản lý các nguồn dữ liệu và bộ sưu tập của chúng. Plugin quản lý nguồn dữ liệu chỉ cung cấp giao diện quản lý cho tất cả các nguồn dữ liệu, chứ không cung cấp khả năng truy cập trực tiếp vào chúng. Plugin này cần được sử dụng kết hợp với các plugin nguồn dữ liệu khác. Các nguồn dữ liệu hiện được hỗ trợ bao gồm:

- [Cơ sở dữ liệu chính](/data-sources/data-source-main): Cơ sở dữ liệu chính của NocoBase, hỗ trợ các cơ sở dữ liệu quan hệ như MySQL, PostgreSQL và MariaDB.
- [MySQL bên ngoài](/data-sources/data-source-external-mysql): Sử dụng cơ sở dữ liệu MySQL bên ngoài làm nguồn dữ liệu.
- [MariaDB bên ngoài](/data-sources/data-source-external-mariadb): Sử dụng cơ sở dữ liệu MariaDB bên ngoài làm nguồn dữ liệu.
- [PostgreSQL bên ngoài](/data-sources/data-source-external-postgres): Sử dụng cơ sở dữ liệu PostgreSQL bên ngoài làm nguồn dữ liệu.
- [MSSQL bên ngoài](/data-sources/data-source-external-mssql): Sử dụng cơ sở dữ liệu MSSQL (SQL Server) bên ngoài làm nguồn dữ liệu.
- [Oracle bên ngoài](/data-sources/data-source-external-oracle): Sử dụng cơ sở dữ liệu Oracle bên ngoài làm nguồn dữ liệu.

Ngoài ra, bạn có thể mở rộng thêm nhiều loại nguồn dữ liệu thông qua các plugin, có thể là các loại cơ sở dữ liệu phổ biến hoặc các nền tảng cung cấp API (SDK).

## Cài đặt

Đây là plugin tích hợp sẵn, không cần cài đặt riêng.

## Hướng dẫn sử dụng

Khi ứng dụng được khởi tạo và cài đặt, một nguồn dữ liệu mặc định sẽ được cung cấp để lưu trữ dữ liệu của NocoBase, được gọi là cơ sở dữ liệu chính. Để biết thêm chi tiết, vui lòng xem tài liệu về [Cơ sở dữ liệu chính](/data-sources/data-source-main/).

### Nguồn dữ liệu bên ngoài

NocoBase hỗ trợ sử dụng các cơ sở dữ liệu bên ngoài làm nguồn dữ liệu. Để biết thêm chi tiết, vui lòng xem tài liệu về [Cơ sở dữ liệu bên ngoài / Giới thiệu](/data-sources/data-source-manager/external-database).

![nocobase_doc-2025-10-29-19-45-33](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-45-33.png)

### Hỗ trợ đồng bộ các bảng tự tạo trong cơ sở dữ liệu

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Bạn cũng có thể truy cập dữ liệu từ các nguồn HTTP API. Để biết thêm chi tiết, vui lòng xem tài liệu về [Nguồn dữ liệu REST API](/data-sources/data-source-rest-api/).