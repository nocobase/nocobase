---
pkg: "@nocobase/plugin-data-source-manager"
title: "Quản lý nguồn dữ liệu"
description: "Plugin quản lý nguồn dữ liệu: quản lý cơ sở dữ liệu chính, cơ sở dữ liệu bên ngoài, nguồn dữ liệu REST API và nguồn dữ liệu NocoBase bên ngoài, cung cấp giao diện quản lý nguồn dữ liệu thống nhất."
keywords: "quản lý nguồn dữ liệu,cơ sở dữ liệu chính,cơ sở dữ liệu bên ngoài,đồng bộ bảng dữ liệu,nguồn dữ liệu REST API,NocoBase"
---
# Quản lý nguồn dữ liệu

## Giới thiệu

NocoBase cung cấp plugin quản lý nguồn dữ liệu để quản lý các nguồn dữ liệu và bảng dữ liệu của chúng. Plugin quản lý nguồn dữ liệu chỉ cung cấp giao diện quản lý cho tất cả các nguồn dữ liệu, không cung cấp khả năng kết nối với nguồn dữ liệu. Plugin này cần được sử dụng kết hợp với các plugin nguồn dữ liệu khác nhau. Hiện tại, các nguồn dữ liệu được hỗ trợ bao gồm:

- [Cơ sở dữ liệu chính](/data-sources/data-source-main/): Cơ sở dữ liệu chính của NocoBase, hỗ trợ MySQL, PostgreSQL, MariaDB, KingbaseES và OceanBase.
- [PostgreSQL bên ngoài](/data-sources/data-source-external-postgres/): Sử dụng cơ sở dữ liệu PostgreSQL bên ngoài làm nguồn dữ liệu.
- [MySQL bên ngoài](/data-sources/data-source-external-mysql/): Sử dụng cơ sở dữ liệu MySQL bên ngoài làm nguồn dữ liệu.
- [MariaDB bên ngoài](/data-sources/data-source-external-mariadb/): Sử dụng cơ sở dữ liệu MariaDB bên ngoài làm nguồn dữ liệu.
- [MSSQL bên ngoài](/data-sources/data-source-external-mssql/): Sử dụng cơ sở dữ liệu MSSQL (SQL Server) bên ngoài làm nguồn dữ liệu.
- [KingbaseES bên ngoài](/data-sources/data-source-kingbase/): Sử dụng cơ sở dữ liệu KingbaseES bên ngoài làm nguồn dữ liệu.
- [OceanBase bên ngoài](/data-sources/external/oceanbase): Sử dụng cơ sở dữ liệu OceanBase bên ngoài làm nguồn dữ liệu.
- [Oracle bên ngoài](/data-sources/data-source-external-oracle/): Sử dụng cơ sở dữ liệu Oracle bên ngoài làm nguồn dữ liệu.
- [ClickHouse bên ngoài](/data-sources/external/clickhouse): Sử dụng cơ sở dữ liệu ClickHouse bên ngoài làm nguồn dữ liệu, thường được dùng để truy vấn, thống kê và hiển thị báo cáo.
- [Doris bên ngoài](/data-sources/external/doris): Sử dụng cơ sở dữ liệu Doris bên ngoài làm nguồn dữ liệu, thường được dùng để truy vấn, thống kê và hiển thị báo cáo.
- [Nguồn dữ liệu REST API](/data-sources/data-source-rest-api/): Kết nối dữ liệu từ REST API vào NocoBase.
- [NocoBase bên ngoài](/data-sources/data-source-external-nocobase/): Sử dụng một ứng dụng NocoBase khác làm nguồn dữ liệu bên ngoài thông qua API NocoBase từ xa.

Ngoài ra, có thể mở rộng thêm nhiều loại nguồn dữ liệu thông qua plugin, bao gồm các loại cơ sở dữ liệu phổ biến cũng như các nền tảng cung cấp API (SDK).

## Cài đặt

Plugin tích hợp sẵn, không cần cài đặt riêng.

## Hướng dẫn sử dụng

Khi khởi tạo và cài đặt ứng dụng, hệ thống sẽ mặc định cung cấp một nguồn dữ liệu dùng để lưu trữ dữ liệu NocoBase, được gọi là cơ sở dữ liệu chính. Để biết thêm thông tin, hãy xem tài liệu [Cơ sở dữ liệu chính](/data-sources/data-source-main/index.md).

### Nguồn dữ liệu bên ngoài

Hỗ trợ sử dụng cơ sở dữ liệu bên ngoài làm nguồn dữ liệu. Để biết thêm thông tin, hãy xem tài liệu [Cơ sở dữ liệu bên ngoài / Giới thiệu](/data-sources/data-source-manager/external-database.md).

![nocobase_doc-2025-10-29-19-45-33](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-45-33.png)

### Hỗ trợ đồng bộ các bảng tự tạo trong cơ sở dữ liệu

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Cũng có thể kết nối dữ liệu từ HTTP API. Để biết thêm thông tin, hãy xem tài liệu [Nguồn dữ liệu REST API](/data-sources/data-source-rest-api/index.md).

### Nguồn dữ liệu NocoBase bên ngoài

Có thể sử dụng một ứng dụng NocoBase khác làm nguồn dữ liệu bên ngoài thông qua API NocoBase từ xa. Để biết thêm thông tin, hãy xem tài liệu [NocoBase bên ngoài](/data-sources/data-source-external-nocobase/index.md).