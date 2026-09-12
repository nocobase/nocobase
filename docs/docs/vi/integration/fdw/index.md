---
title: "FDW kết nối bảng dữ liệu ngoài"
description: "Kết nối bảng từ xa dựa trên Foreign Data Wrapper: MySQL federated, postgres_fdw/mysql_fdw của PostgreSQL, tạo dịch vụ database, chọn bảng từ xa, đồng bộ trường."
keywords: "FDW,Bảng dữ liệu ngoài,Foreign Data Wrapper,postgres_fdw,mysql_fdw,federated,Bảng từ xa,NocoBase"
---

# Kết nối bảng dữ liệu ngoài (FDW)

## Giới thiệu

Tính năng kết nối bảng dữ liệu từ xa dựa trên Foreign Data Wrapper của database. Hiện hỗ trợ các database MySQL và PostgreSQL.

:::info{title="Kết nối nguồn dữ liệu vs Kết nối bảng dữ liệu ngoài"}
- **Kết nối nguồn dữ liệu** đề cập đến việc thiết lập kết nối với một database hoặc dịch vụ API cụ thể, có thể sử dụng đầy đủ các tính năng của database hoặc dịch vụ mà API cung cấp;
- **Kết nối bảng dữ liệu ngoài** đề cập đến việc lấy dữ liệu từ bên ngoài và ánh xạ để sử dụng cục bộ. Trong database gọi là FDW (Foreign Data Wrapper), một công nghệ database tập trung vào việc xem bảng từ xa như bảng cục bộ, chỉ có thể kết nối từng bảng một. Vì là truy cập từ xa nên khi sử dụng sẽ có nhiều ràng buộc và hạn chế.

Hai cái này cũng có thể dùng kết hợp, cái trước dùng để thiết lập kết nối với nguồn dữ liệu, cái sau dùng để truy cập dữ liệu xuyên qua các nguồn dữ liệu. Ví dụ, sau khi kết nối một nguồn dữ liệu PostgreSQL, có một bảng nào đó trong nguồn dữ liệu này được tạo dựa trên FDW làm bảng dữ liệu ngoài.
:::

### MySQL

MySQL thông qua engine `federated`, cần kích hoạt, hỗ trợ kết nối MySQL từ xa và các database tương thích giao thức của nó như MariaDB. Tài liệu chi tiết tham khảo [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

Trong PostgreSQL, có thể hỗ trợ các loại dữ liệu từ xa khác nhau thông qua các extension `fdw` khác nhau. Hiện các extension được hỗ trợ là:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html): Kết nối database PostgreSQL từ xa trong PostgreSQL.
- [mysql_fdw](https://github.com/EnterpriseDB/mysql_fdw): Kết nối database MySQL từ xa trong PostgreSQL.
- Các loại extension fdw khác, có thể tham khảo [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers). Để tích hợp vào NocoBase, cần triển khai các interface adapter tương ứng trong code.

## Điều kiện tiên quyết

- Nếu database chính của NocoBase là MySQL, cần kích hoạt `federated`, tham khảo [Cách bật engine federated trong MySQL](./enable-federated)

Sau đó cài đặt và kích hoạt plugin thông qua trình quản lý plugin

![Cài đặt và kích hoạt plugin](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Hướng dẫn sử dụng

Trong dropdown "Quản lý bảng dữ liệu > Tạo bảng dữ liệu", chọn "Kết nối dữ liệu ngoài"

![Kết nối dữ liệu ngoài](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

Trong tùy chọn dropdown "Dịch vụ database", chọn dịch vụ database đã tồn tại, hoặc "Tạo dịch vụ database"

![Dịch vụ database](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Tạo dịch vụ database

![Tạo dịch vụ database](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Sau khi chọn dịch vụ database, trong tùy chọn dropdown "Bảng từ xa", chọn bảng dữ liệu cần kết nối.

![Chọn bảng dữ liệu cần kết nối](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Cấu hình thông tin trường

![Cấu hình thông tin trường](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Nếu bảng từ xa có thay đổi cấu trúc, cũng có thể "Đồng bộ từ bảng từ xa"

![Đồng bộ từ bảng từ xa](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Đồng bộ bảng từ xa

![Đồng bộ bảng từ xa](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Cuối cùng, hiển thị trên giao diện

![Hiển thị trên giao diện](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)
