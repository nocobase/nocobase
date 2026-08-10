---
title: "Tổng quan về mô hình hóa dữ liệu"
description: "Mô hình hóa dữ liệu: thiết kế mô hình dữ liệu, kết nối nhiều loại nguồn dữ liệu, trực quan hóa sơ đồ ER, tạo bảng dữ liệu, hỗ trợ cơ sở dữ liệu chính và cơ sở dữ liệu bên ngoài."
keywords: "Mô hình hóa dữ liệu,Collection,mô hình dữ liệu,sơ đồ ER,cơ sở dữ liệu chính,cơ sở dữ liệu bên ngoài,NocoBase"
---

# Tổng quan

Mô hình hóa dữ liệu là một bước quan trọng trong quá trình thiết kế cơ sở dữ liệu, bao gồm việc phân tích và trừu tượng hóa chuyên sâu các loại dữ liệu trong thế giới thực cũng như mối quan hệ giữa chúng. Trong quá trình này, chúng ta cố gắng khám phá mối liên hệ nội tại giữa các dữ liệu và mô tả chúng dưới dạng mô hình dữ liệu, đặt nền tảng cho cấu trúc cơ sở dữ liệu của hệ thống thông tin. NocoBase là một nền tảng dựa trên mô hình dữ liệu, với các đặc điểm sau:

## Hỗ trợ kết nối dữ liệu từ nhiều nguồn khác nhau

Nguồn dữ liệu của NocoBase có thể là nhiều loại cơ sở dữ liệu phổ biến, nền tảng API (SDK) và tệp.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase cung cấp [plugin quản lý nguồn dữ liệu](/data-sources/data-source-manager) để quản lý các nguồn dữ liệu và bảng dữ liệu tương ứng. Plugin quản lý nguồn dữ liệu chỉ cung cấp giao diện quản lý cho tất cả các nguồn dữ liệu, không cung cấp khả năng kết nối với nguồn dữ liệu; plugin này cần được sử dụng kết hợp với các plugin nguồn dữ liệu khác nhau. Các nguồn dữ liệu hiện được hỗ trợ bao gồm:

- [Cơ sở dữ liệu chính](/data-sources/data-source-main)：Cơ sở dữ liệu chính của NocoBase, hỗ trợ các cơ sở dữ liệu quan hệ như MySQL, PostgreSQL, MariaDB.
- [KingbaseES](/data-sources/data-source-kingbase)：Sử dụng cơ sở dữ liệu KingbaseES của Renmin Jincang làm nguồn dữ liệu, có thể được sử dụng làm cơ sở dữ liệu chính hoặc cơ sở dữ liệu bên ngoài.
- [MySQL bên ngoài](/data-sources/data-source-external-mysql)：Sử dụng cơ sở dữ liệu MySQL bên ngoài làm nguồn dữ liệu.
- [MariaDB bên ngoài](/data-sources/data-source-external-mariadb)：Sử dụng cơ sở dữ liệu MariaDB bên ngoài làm nguồn dữ liệu.
- [PostgreSQL bên ngoài](/data-sources/data-source-external-postgres)：Sử dụng cơ sở dữ liệu PostgreSQL bên ngoài làm nguồn dữ liệu.
- [MSSQL bên ngoài](/data-sources/data-source-external-mssql)：Sử dụng cơ sở dữ liệu MSSQL (SQL Server) bên ngoài làm nguồn dữ liệu.
- [Oracle bên ngoài](/data-sources/data-source-external-oracle)：Sử dụng cơ sở dữ liệu Oracle bên ngoài làm nguồn dữ liệu.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Cung cấp nhiều công cụ mô hình hóa dữ liệu

**Giao diện quản lý bảng dữ liệu đơn giản**：Dùng để tạo nhiều mô hình (bảng dữ liệu) hoặc kết nối với các mô hình (bảng dữ liệu) hiện có.

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Giao diện trực quan hóa tương tự sơ đồ ER**：Dùng để trích xuất các thực thể và mối quan hệ giữa chúng từ nhu cầu của người dùng và nghiệp vụ. Giao diện này cung cấp một cách trực quan và dễ hiểu để mô tả mô hình dữ liệu. Thông qua sơ đồ ER, có thể hiểu rõ hơn về các thực thể dữ liệu chính trong hệ thống và mối liên hệ giữa chúng.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Hỗ trợ tạo nhiều loại bảng dữ liệu

| Bảng dữ liệu | Mô tả |
| - | - |
| [Bảng dữ liệu thông thường](/data-sources/data-source-main/general-collection) | Tích hợp các trường hệ thống thường dùng |
| [Bảng dữ liệu lịch](/data-sources/calendar/calendar-collection) | Dùng để tạo các bảng sự kiện liên quan đến lịch |
| Bảng bình luận | Dùng để lưu trữ bình luận hoặc phản hồi về dữ liệu |
| [Bảng cấu trúc cây](/data-sources/collection-tree) | Bảng cấu trúc cây, hiện chỉ hỗ trợ thiết kế bảng liền kề |
| [Bảng dữ liệu tệp](/data-sources/file-manager/file-collection) | Dùng để quản lý việc lưu trữ tệp |
| [Bảng dữ liệu SQL](/data-sources/collection-sql) | Không phải là bảng cơ sở dữ liệu thực tế mà là cách hiển thị có cấu trúc nhanh các truy vấn SQL |
| [Kết nối chế độ xem cơ sở dữ liệu](/data-sources/collection-view) | Kết nối với chế độ xem cơ sở dữ liệu hiện có |
| Bảng biểu thức | Dùng cho các tình huống biểu thức động trong quy trình làm việc |
| [Kết nối dữ liệu bên ngoài](/data-sources/collection-fdw) | Kết nối với các bảng dữ liệu từ xa dựa trên công nghệ FDW của cơ sở dữ liệu |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

Xem thêm 「[Bảng dữ liệu / Tổng quan](/data-sources/data-modeling/collection)」

## Cung cấp nhiều loại trường dữ liệu

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

Xem thêm 「[Trường bảng dữ liệu / Tổng quan](/data-sources/data-modeling/collection-fields)」 chương
