:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Tổng quan

Mô hình hóa dữ liệu là một bước quan trọng khi thiết kế cơ sở dữ liệu. Quá trình này bao gồm việc phân tích sâu sắc và trừu tượng hóa các loại dữ liệu trong thế giới thực cùng các mối quan hệ giữa chúng. Trong quá trình này, chúng ta cố gắng khám phá các mối liên hệ nội tại giữa dữ liệu và hình thức hóa chúng thành các mô hình dữ liệu, đặt nền tảng cho cấu trúc cơ sở dữ liệu của hệ thống thông tin. NocoBase là một nền tảng được điều khiển bởi mô hình dữ liệu, với các tính năng nổi bật sau:

## Hỗ trợ truy cập dữ liệu từ nhiều nguồn khác nhau

Nguồn dữ liệu của NocoBase có thể là các loại cơ sở dữ liệu phổ biến, nền tảng API (SDK) và tệp tin.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase cung cấp [plugin quản lý nguồn dữ liệu](/data-sources/data-source-manager) để quản lý các nguồn dữ liệu và các bộ sưu tập của chúng. Plugin quản lý nguồn dữ liệu chỉ cung cấp giao diện quản lý cho tất cả các nguồn dữ liệu, chứ không cung cấp khả năng truy cập trực tiếp vào nguồn dữ liệu. Nó cần được sử dụng kết hợp với các plugin nguồn dữ liệu khác nhau. Các nguồn dữ liệu hiện được hỗ trợ bao gồm:

- [Cơ sở dữ liệu chính](/data-sources/data-source-main): Cơ sở dữ liệu chính của NocoBase, hỗ trợ các cơ sở dữ liệu quan hệ như MySQL, PostgreSQL và MariaDB.
- [KingbaseES](/data-sources/data-source-kingbase): Sử dụng cơ sở dữ liệu KingbaseES làm nguồn dữ liệu, có thể dùng làm cơ sở dữ liệu chính hoặc cơ sở dữ liệu bên ngoài.
- [MySQL bên ngoài](/data-sources/data-source-external-mysql): Sử dụng cơ sở dữ liệu MySQL bên ngoài làm nguồn dữ liệu.
- [MariaDB bên ngoài](/data-sources/data-source-external-mariadb): Sử dụng cơ sở dữ liệu MariaDB bên ngoài làm nguồn dữ liệu.
- [PostgreSQL bên ngoài](/data-sources/data-source-external-postgres): Sử dụng cơ sở dữ liệu PostgreSQL bên ngoài làm nguồn dữ liệu.
- [MSSQL bên ngoài](/data-sources/data-source-external-mssql): Sử dụng cơ sở dữ liệu MSSQL (SQL Server) bên ngoài làm nguồn dữ liệu.
- [Oracle bên ngoài](/data-sources/data-source-external-oracle): Sử dụng cơ sở dữ liệu Oracle bên ngoài làm nguồn dữ liệu.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## Cung cấp đa dạng công cụ mô hình hóa dữ liệu

**Giao diện quản lý bộ sưu tập đơn giản**: Dùng để tạo các mô hình (bộ sưu tập) khác nhau hoặc kết nối với các mô hình (bộ sưu tập) hiện có.

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**Giao diện trực quan kiểu biểu đồ ER**: Dùng để trích xuất các thực thể và mối quan hệ giữa chúng từ yêu cầu của người dùng và nghiệp vụ. Giao diện này cung cấp một cách trực quan và dễ hiểu để mô tả các mô hình dữ liệu. Thông qua biểu đồ ER, quý vị có thể hiểu rõ hơn về các thực thể dữ liệu chính trong hệ thống và mối liên hệ giữa chúng.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## Hỗ trợ tạo nhiều loại bộ sưu tập khác nhau

| Bộ sưu tập | Mô tả |
| - | - |
| [Bộ sưu tập chung](/data-sources/data-source-main/general-collection) | Tích hợp các trường hệ thống thông dụng |
| [Bộ sưu tập lịch](/data-sources/calendar/calendar-collection) | Dùng để tạo các bộ sưu tập sự kiện liên quan đến lịch |
| Bộ sưu tập bình luận | Dùng để lưu trữ bình luận hoặc phản hồi về dữ liệu |
| [Bộ sưu tập dạng cây](/data-sources/collection-tree) | Bộ sưu tập có cấu trúc cây, hiện chỉ hỗ trợ thiết kế danh sách kề |
| [Bộ sưu tập tệp tin](/data-sources/file-manager/file-collection) | Dùng để quản lý lưu trữ tệp tin |
| [Bộ sưu tập SQL](/data-sources/collection-sql) | Không phải là một bộ sưu tập cơ sở dữ liệu thực tế, mà là cách nhanh chóng để hiển thị các truy vấn SQL một cách có cấu trúc |
| [Kết nối đến chế độ xem cơ sở dữ liệu](/data-sources/collection-view) | Kết nối đến các chế độ xem cơ sở dữ liệu hiện có |
| Bộ sưu tập biểu thức | Dùng cho các kịch bản biểu thức động trong luồng công việc |
| [Kết nối dữ liệu ngoài](/data-sources/collection-fdw) | Kết nối các bộ sưu tập dữ liệu từ xa dựa trên công nghệ FDW của cơ sở dữ liệu |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

Để biết thêm chi tiết, vui lòng xem chương 「[Bộ sưu tập / Tổng quan](/data-sources/data-modeling/collection)」.

## Cung cấp đa dạng các loại trường

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

Để biết thêm chi tiết, vui lòng xem chương 「[Trường bộ sưu tập / Tổng quan](/data-sources/data-modeling/collection-fields)」.