---
pkg: "@nocobase/plugin-collection-fdw"
title: "Kết nối bảng dữ liệu bên ngoài (FDW)"
description: "Plugin kết nối với các bảng dữ liệu từ xa dựa trên Foreign Data Wrapper, hỗ trợ MySQL federated và PostgreSQL postgres_fdw, ánh xạ bảng từ xa thành bảng cục bộ để sử dụng."
keywords: "FDW,Foreign Data Wrapper,federated,postgres_fdw,bảng bên ngoài,bảng từ xa,NocoBase"
---
# Kết nối bảng dữ liệu bên ngoài (FDW)

## Giới thiệu

Plugin chức năng kết nối với các bảng dữ liệu từ xa dựa trên foreign data wrapper của cơ sở dữ liệu. Hiện hỗ trợ cơ sở dữ liệu MySQL và PostgreSQL.

:::info{title="Kết nối nguồn dữ liệu và kết nối bảng dữ liệu bên ngoài"}
- **Kết nối nguồn dữ liệu** là thiết lập kết nối với một cơ sở dữ liệu hoặc dịch vụ API cụ thể, qua đó có thể sử dụng đầy đủ các tính năng của cơ sở dữ liệu hoặc dịch vụ do API cung cấp;
- **Kết nối bảng dữ liệu bên ngoài** là lấy dữ liệu từ bên ngoài và ánh xạ để sử dụng cục bộ. Trong cơ sở dữ liệu, tính năng này được gọi là FDW（Foreign Data Wrapper）, một công nghệ cơ sở dữ liệu tập trung vào việc sử dụng bảng từ xa như bảng cục bộ, và chỉ có thể kết nối từng bảng một. Do truy cập từ xa nên khi sử dụng sẽ có nhiều hạn chế và ràng buộc.

Hai cách này cũng có thể được kết hợp: cách đầu tiên dùng để thiết lập kết nối với nguồn dữ liệu, cách thứ hai dùng để truy cập dữ liệu xuyên qua các nguồn dữ liệu. Ví dụ, sau khi kết nối với một nguồn dữ liệu PostgreSQL, trong nguồn dữ liệu đó có một bảng bên ngoài được tạo dựa trên FDW.
:::

### MySQL

MySQL sử dụng công cụ `federated`, cần được kích hoạt và hỗ trợ kết nối với MySQL từ xa cũng như các cơ sở dữ liệu tương thích với giao thức này, chẳng hạn như MariaDB. Xem tài liệu chi tiết tại [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

Trong PostgreSQL, có thể hỗ trợ các loại dữ liệu từ xa khác nhau thông qua các tiện ích mở rộng `fdw` khác nhau. Hiện các tiện ích mở rộng được hỗ trợ gồm:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html)：kết nối với cơ sở dữ liệu PostgreSQL từ xa trong PostgreSQL.
- [mysql_fdw(đang phát triển)](https://github.com/EnterpriseDB/mysql_fdw)：kết nối với cơ sở dữ liệu MySQL từ xa trong PostgreSQL.
- Các tiện ích mở rộng fdw thuộc các loại khác có thể tham khảo [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers). Để tích hợp vào NocoBase, cần triển khai giao diện thích ứng tương ứng trong mã nguồn.

## Cài đặt

Điều kiện tiên quyết

- Nếu cơ sở dữ liệu chính của NocoBase là MySQL, cần kích hoạt `federated`. Tham khảo [Cách bật công cụ federated trong MySQL](./enable-federated.md)

Sau đó, cài đặt và kích hoạt plugin thông qua trình quản lý plugin

![Cài đặt và kích hoạt plugin](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Hướng dẫn sử dụng

Trong menu thả xuống 「Quản lý bảng dữ liệu > Tạo bảng dữ liệu」, chọn 「Kết nối dữ liệu bên ngoài」

![Kết nối dữ liệu bên ngoài](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

Trong tùy chọn thả xuống 「Dịch vụ cơ sở dữ liệu」, chọn dịch vụ cơ sở dữ liệu hiện có hoặc 「Tạo dịch vụ cơ sở dữ liệu」

![Dịch vụ cơ sở dữ liệu](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Tạo dịch vụ cơ sở dữ liệu

![Tạo dịch vụ cơ sở dữ liệu](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Sau khi chọn dịch vụ cơ sở dữ liệu, trong tùy chọn thả xuống 「Bảng từ xa」, chọn bảng dữ liệu cần kết nối.

![Chọn bảng dữ liệu cần kết nối](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Cấu hình thông tin trường

![Cấu hình thông tin trường](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Nếu bảng từ xa có thay đổi về cấu trúc, bạn cũng có thể chọn 「Đồng bộ từ bảng từ xa」

![Đồng bộ từ bảng từ xa](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Đồng bộ bảng từ xa

![Đồng bộ bảng từ xa](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Cuối cùng, bảng sẽ được hiển thị trên giao diện

![Hiển thị trên giao diện](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)