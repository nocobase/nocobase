---
pkg: "@nocobase/plugin-collection-fdw"
title: "Kết nối Collection bên ngoài (FDW)"
description: "Kết nối Collection từ xa dựa trên Foreign Data Wrapper, engine federated của MySQL, postgres_fdw của PostgreSQL, ánh xạ bảng từ xa thành bảng cục bộ để sử dụng."
keywords: "FDW,Foreign Data Wrapper,federated,postgres_fdw,bảng bên ngoài,bảng từ xa,NocoBase"
---
# Kết nối Collection bên ngoài (FDW)

## Giới thiệu

Plugin chức năng kết nối Collection từ xa được triển khai dựa trên foreign data wrapper của database. Hiện tại hỗ trợ database MySQL và PostgreSQL.

:::info{title="Kết nối Data Source vs Kết nối Collection bên ngoài"}
- **Kết nối Data Source** đề cập đến việc thiết lập kết nối với một database cụ thể hoặc dịch vụ API, có thể sử dụng đầy đủ các tính năng của database hoặc dịch vụ do API cung cấp.
- **Kết nối Collection bên ngoài** đề cập đến việc lấy dữ liệu từ bên ngoài và ánh xạ vào sử dụng cục bộ. Trong database gọi là FDW (Foreign Data Wrapper), là một công nghệ database, tập trung vào việc sử dụng bảng từ xa như bảng cục bộ, chỉ có thể kết nối từng bảng một. Vì là truy cập từ xa nên khi sử dụng sẽ có nhiều ràng buộc và hạn chế.

Hai loại này cũng có thể được sử dụng kết hợp, loại trước dùng để thiết lập kết nối với Data Source, loại sau dùng để truy cập xuyên Data Source. Ví dụ, đã kết nối một Data Source PostgreSQL, trong Data Source này có một bảng được tạo dựa trên FDW là Collection bên ngoài.
:::

### MySQL

MySQL thông qua engine `federated`, cần kích hoạt, hỗ trợ kết nối với MySQL từ xa và các database tương thích giao thức của nó như MariaDB. Tham khảo tài liệu chi tiết tại [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

Trong PostgreSQL, có thể hỗ trợ các loại dữ liệu từ xa khác nhau thông qua các phần mở rộng `fdw` khác nhau, các phần mở rộng hiện được hỗ trợ bao gồm:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html): Kết nối database PostgreSQL từ xa trong PostgreSQL.
- [mysql_fdw (đang phát triển)](https://github.com/EnterpriseDB/mysql_fdw): Kết nối database MySQL từ xa trong PostgreSQL.
- Các loại phần mở rộng fdw khác, có thể tham khảo [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers), việc tích hợp vào NocoBase cần triển khai các interface adapter tương ứng trong code.

## Cài đặt

Điều kiện tiên quyết

- Nếu database chính của NocoBase là MySQL, cần kích hoạt `federated`, tham khảo [Cách kích hoạt engine federated trong MySQL](./enable-federated.md)

Sau đó cài đặt và kích hoạt plugin thông qua trình quản lý plugin

![Cài đặt và kích hoạt plugin](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Hướng dẫn sử dụng

Trong dropdown "Quản lý Collection > Tạo Collection", chọn "Kết nối dữ liệu bên ngoài"

![Kết nối dữ liệu bên ngoài](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

Trong dropdown "Dịch vụ Database", chọn dịch vụ database hiện có hoặc "Tạo dịch vụ Database"

![Dịch vụ Database](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Tạo dịch vụ Database

![Tạo dịch vụ Database](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Sau khi chọn dịch vụ database, trong dropdown "Bảng từ xa", chọn Collection cần kết nối.

![Chọn Collection cần kết nối](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Cấu hình thông tin Field

![Cấu hình thông tin Field](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Nếu cấu trúc bảng từ xa thay đổi, cũng có thể "Đồng bộ từ bảng từ xa"

![Đồng bộ từ bảng từ xa](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Đồng bộ bảng từ xa

![Đồng bộ bảng từ xa](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Cuối cùng, hiển thị trong giao diện

![Hiển thị trong giao diện](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)
