---
title: "Tổng quan Data Source"
description: "Data Source và mô hình hóa dữ liệu của NocoBase: database chính, MySQL/PostgreSQL/Oracle/MSSQL bên ngoài, quản lý Data Source, sơ đồ ER, bảng thông thường, bảng cây, bảng SQL, FDW, bảng tệp, REST API."
keywords: "Data Source,mô hình hóa dữ liệu,database chính,database bên ngoài,sơ đồ ER,Collection,bảng cây,bảng SQL,FDW,NocoBase"
---

# Tổng quan

Mô hình hóa dữ liệu là bước then chốt khi thiết kế database, bao gồm việc phân tích sâu sắc và trừu tượng hóa các loại dữ liệu trong thế giới thực cũng như mối quan hệ giữa chúng. Trong quá trình này, chúng ta cố gắng làm rõ các mối liên hệ nội tại giữa các dữ liệu và mô tả chúng một cách hình thức thành mô hình dữ liệu, đặt nền tảng cho cấu trúc database của hệ thống thông tin. NocoBase là một nền tảng được điều khiển bởi mô hình dữ liệu, có những đặc điểm sau:

## Hỗ trợ kết nối nhiều nguồn dữ liệu khác nhau

Data Source của NocoBase có thể là các loại database, nền tảng API (SDK) và tệp phổ biến.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase cung cấp [plugin Quản lý Data Source](/data-sources/data-source-manager) để quản lý các Data Source và Collection của chúng. Plugin Quản lý Data Source chỉ cung cấp giao diện quản lý cho tất cả Data Source mà không cung cấp khả năng kết nối Data Source, nó cần được sử dụng kết hợp với các plugin Data Source khác nhau. Các Data Source hiện được hỗ trợ bao gồm:

- [Main Database](/data-sources/data-source-main): Database chính của NocoBase, hỗ trợ các database quan hệ như MySQL, PostgreSQL, MariaDB.
- [KingbaseES](/data-sources/data-source-kingbase): Sử dụng database KingbaseES làm Data Source, có thể dùng làm database chính hoặc database bên ngoài.
- [External MySQL](/data-sources/data-source-external-mysql): Sử dụng database MySQL bên ngoài làm Data Source.
- [External MariaDB](/data-sources/data-source-external-mariadb): Sử dụng database MariaDB bên ngoài làm Data Source.
- [External PostgreSQL](/data-sources/data-source-external-postgres): Sử dụng database PostgreSQL bên ngoài làm Data Source.
- [External MSSQL](/data-sources/data-source-external-mssql): Sử dụng database MSSQL (SQL Server) bên ngoài làm Data Source.
- [External Oracle](/data-sources/data-source-external-oracle): Sử dụng database Oracle bên ngoài làm Data Source.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Cung cấp các công cụ mô hình hóa dữ liệu đa dạng

**Giao diện quản lý Collection đơn giản**: Dùng để tạo các mô hình (Collection) khác nhau hoặc kết nối các mô hình (Collection) hiện có.

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Giao diện trực quan giống sơ đồ ER**: Dùng để trích xuất các thực thể và mối quan hệ giữa chúng từ nhu cầu của người dùng và nghiệp vụ. Nó cung cấp một cách trực quan và dễ hiểu để mô tả mô hình dữ liệu, qua sơ đồ ER bạn có thể hiểu rõ hơn các thực thể dữ liệu chính trong hệ thống và mối liên hệ giữa chúng.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Hỗ trợ tạo nhiều loại Collection

| Collection | Mô tả |
| - | - |
| [Bảng thông thường](/data-sources/data-source-main/general-collection) | Có sẵn các Field hệ thống thông dụng |
| [Bảng lịch](/data-sources/calendar/calendar-collection) | Dùng để tạo bảng sự kiện liên quan đến lịch |
| Bảng bình luận | Dùng để lưu trữ bình luận hoặc phản hồi về dữ liệu |
| [Bảng cấu trúc cây](/data-sources/collection-tree) | Bảng cấu trúc cây, hiện chỉ hỗ trợ thiết kế adjacency list |
| [Bảng tệp](/data-sources/file-manager/file-collection) | Dùng để quản lý lưu trữ tệp |
| [Bảng SQL](/data-sources/collection-sql) | Không phải là bảng database thực tế, mà là cách hiển thị nhanh truy vấn SQL theo dạng có cấu trúc |
| [Kết nối Database View](/data-sources/collection-view) | Kết nối Database View hiện có |
| Bảng biểu thức | Dùng cho các tình huống biểu thức động trong workflow |
| [Kết nối dữ liệu bên ngoài](/data-sources/collection-fdw) | Kết nối Collection từ xa dựa trên công nghệ FDW của database |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

Xem thêm tại chương "[Collection / Tổng quan](/data-sources/data-modeling/collection)"

## Cung cấp đa dạng các loại Field

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

Xem thêm tại chương "[Field của Collection / Tổng quan](/data-sources/data-modeling/collection-fields)"
