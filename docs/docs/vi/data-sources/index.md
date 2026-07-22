---
title: "Tổng quan về nguồn dữ liệu"
description: "Nguồn dữ liệu và mô hình hóa dữ liệu của NocoBase: cơ sở dữ liệu chính, cơ sở dữ liệu bên ngoài, REST API, NocoBase bên ngoài, quản lý nguồn dữ liệu, bảng thông thường, bảng cây, bảng SQL, bảng tệp."
keywords: "nguồn dữ liệu,mô hình hóa dữ liệu,cơ sở dữ liệu chính,cơ sở dữ liệu bên ngoài,REST API,NocoBase bên ngoài,Collection,bảng cây,bảng SQL,NocoBase"
---

# Tổng quan

Mô hình hóa dữ liệu là một bước quan trọng trong quá trình thiết kế cơ sở dữ liệu, bao gồm việc phân tích và trừu tượng hóa chuyên sâu các loại dữ liệu trong thế giới thực cũng như mối quan hệ giữa chúng. Trong quá trình này, chúng ta cố gắng làm rõ mối liên hệ nội tại giữa các dữ liệu và mô tả chúng dưới dạng mô hình dữ liệu, đặt nền tảng cho cấu trúc cơ sở dữ liệu của hệ thống thông tin. NocoBase là một nền tảng hướng theo mô hình dữ liệu, với các đặc điểm sau:

## Hỗ trợ kết nối với dữ liệu từ nhiều nguồn khác nhau

Nguồn dữ liệu của NocoBase có thể là các loại cơ sở dữ liệu phổ biến, nền tảng API (SDK) và tệp.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase cung cấp [plugin quản lý nguồn dữ liệu](./data-source-manager/index.md) để quản lý các nguồn dữ liệu và bảng dữ liệu tương ứng. Plugin quản lý nguồn dữ liệu chỉ cung cấp giao diện quản lý tất cả các nguồn dữ liệu, không cung cấp khả năng kết nối với nguồn dữ liệu; plugin này cần được sử dụng cùng với các plugin nguồn dữ liệu khác nhau. Các nguồn dữ liệu hiện được hỗ trợ bao gồm:

- [nguồn dữ liệu chính](./data-source-main/index.md): Cơ sở dữ liệu chính của NocoBase, hỗ trợ PostgreSQL, MySQL, MariaDB, KingbaseES và OceanBase.
- [PostgreSQL bên ngoài](./data-source-external-postgres/index.md): Kết nối với cơ sở dữ liệu PostgreSQL hiện có.
- [MySQL bên ngoài](./data-source-external-mysql/index.md): Kết nối với cơ sở dữ liệu MySQL hiện có.
- [MariaDB bên ngoài](./data-source-external-mariadb/index.md): Kết nối với cơ sở dữ liệu MariaDB hiện có.
- [MSSQL bên ngoài](./data-source-external-mssql/index.md): Kết nối với cơ sở dữ liệu SQL Server hiện có.
- [KingbaseES bên ngoài](./data-source-kingbase/index.md): Kết nối với cơ sở dữ liệu KingbaseES hiện có.
- [OceanBase bên ngoài](./external/oceanbase.md): Kết nối với cơ sở dữ liệu OceanBase hiện có.
- [Oracle bên ngoài](./data-source-external-oracle/index.md): Kết nối với cơ sở dữ liệu Oracle hiện có.
- [ClickHouse bên ngoài](./external/clickhouse.md): Kết nối với cơ sở dữ liệu ClickHouse hiện có.
- [Doris bên ngoài](./external/doris.md): Kết nối với cơ sở dữ liệu Doris hiện có.
- [nguồn dữ liệu REST API](./data-source-rest-api/index.md): Ánh xạ REST API của hệ thống bên thứ ba thành nguồn dữ liệu.
- [nguồn dữ liệu NocoBase bên ngoài](./data-source-external-nocobase/index.md): Kết nối với các bảng dữ liệu trong một ứng dụng NocoBase khác.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Cung cấp nhiều công cụ mô hình hóa dữ liệu

**Giao diện quản lý bảng dữ liệu đơn giản**: Dùng để tạo các mô hình (bảng dữ liệu) hoặc kết nối với các mô hình (bảng dữ liệu) hiện có.

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Giao diện trực quan dạng sơ đồ ER**: Dùng để trích xuất các thực thể và mối quan hệ giữa chúng từ nhu cầu của người dùng và nghiệp vụ. Giao diện này cung cấp một cách trực quan, dễ hiểu để mô tả mô hình dữ liệu. Thông qua sơ đồ ER, có thể hiểu rõ hơn về các thực thể dữ liệu chính trong hệ thống và mối liên hệ giữa chúng.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Hỗ trợ tạo nhiều loại bảng dữ liệu

| Bảng dữ liệu | Mô tả |
| - | - |
| [Bảng dữ liệu thông thường](/data-sources/data-source-main/general-collection) | Tích hợp các trường hệ thống thường dùng |
| [Bảng dữ liệu lịch](/data-sources/calendar/calendar-collection) | Dùng để tạo các bảng sự kiện liên quan đến lịch |
| [Bảng bình luận](/data-sources/collection-comment/) | Dùng để lưu trữ bình luận hoặc phản hồi về dữ liệu |
| [Bảng cấu trúc cây](/data-sources/collection-tree/) | Bảng cấu trúc cây, hiện chỉ hỗ trợ thiết kế bảng liền kề |
| [Bảng dữ liệu tệp](/data-sources/file-manager/file-collection) | Dùng để quản lý việc lưu trữ tệp |
| [Kết nối đến chế độ xem cơ sở dữ liệu](/data-sources/collection-view/) | Kết nối với chế độ xem cơ sở dữ liệu hiện có |
| [Bảng dữ liệu SQL](/data-sources/collection-sql/) | Không phải là bảng cơ sở dữ liệu thực tế, mà là cách nhanh chóng hiển thị có cấu trúc các truy vấn SQL |
| [Kết nối dữ liệu bên ngoài](/data-sources/collection-fdw) | Kết nối với các bảng dữ liệu từ xa dựa trên công nghệ FDW của cơ sở dữ liệu |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

Xem thêm tại chương 「[Bảng dữ liệu / Tổng quan](/data-sources/data-modeling/collection)」

## Cung cấp nhiều loại trường phong phú

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

Xem thêm tại chương 「[Trường bảng dữ liệu / Tổng quan](/data-sources/data-modeling/collection-fields/)」
