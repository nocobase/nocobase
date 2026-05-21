---
pkg: "@nocobase/plugin-data-source-manager"
title: "Data Source Manager"
description: "Plugin Data Source Manager: quản lý Database chính và External MySQL/MariaDB/PostgreSQL/MSSQL/Oracle, đồng bộ bảng tự tạo, tích hợp Data Source REST API, cung cấp giao diện quản lý thống nhất."
keywords: "Data Source Manager,Database chính,External database,Đồng bộ Collection,Data Source REST API,NocoBase"
---
# Data Source Manager

## Giới thiệu

NocoBase cung cấp plugin Data Source Manager, dùng để quản lý Data Source và Collection của chúng. Plugin Data Source Manager chỉ cung cấp giao diện quản lý cho tất cả các Data Source, không cung cấp khả năng tích hợp Data Source, nó cần được sử dụng kết hợp với các plugin Data Source khác. Các Data Source hiện được hỗ trợ tích hợp bao gồm:

- [Main Database](/data-sources/data-source-main): Database chính của NocoBase, hỗ trợ các relational database như MySQL, PostgreSQL, MariaDB.
- [External MySQL](/data-sources/data-source-external-mysql): Sử dụng database MySQL bên ngoài làm Data Source.
- [External MariaDB](/data-sources/data-source-external-mariadb): Sử dụng database MariaDB bên ngoài làm Data Source.
- [External PostgreSQL](/data-sources/data-source-external-postgres): Sử dụng database PostgreSQL bên ngoài làm Data Source.
- [External MSSQL](/data-sources/data-source-external-mssql): Sử dụng database MSSQL (SQL Server) bên ngoài làm Data Source.
- [External Oracle](/data-sources/data-source-external-oracle): Sử dụng database Oracle bên ngoài làm Data Source.

Ngoài ra, có thể mở rộng thêm nhiều kiểu thông qua plugin, có thể là các loại database thông dụng, cũng có thể là các nền tảng cung cấp API (SDK).

## Cài đặt

Plugin tích hợp sẵn, không cần cài đặt riêng.

## Hướng dẫn sử dụng

Khi khởi tạo cài đặt ứng dụng, mặc định sẽ cung cấp một Data Source dùng để lưu trữ dữ liệu NocoBase, được gọi là Database chính. Xem thêm tại tài liệu [Main Database](/data-sources/data-source-main/index.md).

### External Data Source

Hỗ trợ External Database làm Data Source. Xem thêm tại tài liệu [External Database / Giới thiệu](/data-sources/data-source-manager/external-database).

![nocobase_doc-2025-10-29-19-45-33](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-45-33.png)

### Hỗ trợ đồng bộ bảng tự tạo từ database

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Cũng có thể tích hợp dữ liệu từ nguồn HTTP API, xem thêm tại tài liệu [Data Source REST API](/data-sources/data-source-rest-api/index.md).
