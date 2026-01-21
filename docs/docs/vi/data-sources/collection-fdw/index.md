---
pkg: "@nocobase/plugin-collection-fdw"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Kết nối bảng dữ liệu ngoài (FDW)

## Giới thiệu

Đây là một plugin cho phép kết nối đến các bảng dữ liệu từ xa, dựa trên cơ chế foreign data wrapper của cơ sở dữ liệu. Hiện tại, plugin này hỗ trợ các cơ sở dữ liệu MySQL và PostgreSQL.

:::info{title="So sánh: Kết nối nguồn dữ liệu và Kết nối bảng dữ liệu ngoài"}
- **Kết nối nguồn dữ liệu** là việc thiết lập kết nối với một cơ sở dữ liệu hoặc dịch vụ API cụ thể, cho phép bạn sử dụng đầy đủ các tính năng của cơ sở dữ liệu hoặc các dịch vụ mà API cung cấp;
- **Kết nối bảng dữ liệu ngoài** là quá trình lấy dữ liệu từ bên ngoài và ánh xạ để sử dụng cục bộ. Trong cơ sở dữ liệu, đây được gọi là FDW (Foreign Data Wrapper) – một công nghệ cơ sở dữ liệu tập trung vào việc sử dụng các bảng từ xa như các bảng cục bộ, nhưng chỉ có thể kết nối từng bảng một. Do là truy cập từ xa, sẽ có nhiều ràng buộc và hạn chế khi sử dụng.

Hai phương pháp này cũng có thể được sử dụng kết hợp. Phương pháp đầu tiên dùng để thiết lập kết nối với nguồn dữ liệu, còn phương pháp thứ hai dùng để truy cập dữ liệu giữa các nguồn khác nhau. Ví dụ, khi bạn kết nối với một nguồn dữ liệu PostgreSQL, một bảng cụ thể trong nguồn dữ liệu đó có thể là một bảng dữ liệu ngoài được tạo dựa trên FDW.
:::

### MySQL

MySQL sử dụng engine `federated`, cần được kích hoạt để hỗ trợ kết nối đến các cơ sở dữ liệu MySQL từ xa và các cơ sở dữ liệu tương thích giao thức, ví dụ như MariaDB. Để biết thêm chi tiết, vui lòng tham khảo tài liệu [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

Trong PostgreSQL, bạn có thể sử dụng các loại tiện ích mở rộng `fdw` khác nhau để hỗ trợ các loại dữ liệu từ xa khác nhau. Các tiện ích mở rộng hiện được hỗ trợ bao gồm:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html): Kết nối đến cơ sở dữ liệu PostgreSQL từ xa trong PostgreSQL.
- [mysql_fdw (đang phát triển)](https://github.com/EnterpriseDB/mysql_fdw): Kết nối đến cơ sở dữ liệu MySQL từ xa trong PostgreSQL.
- Đối với các loại tiện ích mở rộng fdw khác, bạn có thể tham khảo [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers). Để tích hợp vào NocoBase, bạn cần triển khai các giao diện thích ứng tương ứng trong mã nguồn.

## Cài đặt

Điều kiện tiên quyết

- Nếu cơ sở dữ liệu chính của NocoBase là MySQL, bạn cần kích hoạt `federated`. Tham khảo [Cách bật engine federated trong MySQL](./enable-federated.md)

Sau đó, cài đặt và kích hoạt plugin thông qua trình quản lý plugin.

![Cài đặt và kích hoạt plugin](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Hướng dẫn sử dụng

Trong menu thả xuống "Quản lý bộ sưu tập > Tạo bộ sưu tập", chọn "Kết nối dữ liệu ngoài".

![Kết nối dữ liệu ngoài](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

Trong menu thả xuống "Dịch vụ cơ sở dữ liệu", chọn một dịch vụ cơ sở dữ liệu hiện có hoặc chọn "Tạo dịch vụ cơ sở dữ liệu".

![Dịch vụ cơ sở dữ liệu](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Tạo dịch vụ cơ sở dữ liệu

![Tạo dịch vụ cơ sở dữ liệu](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Sau khi chọn dịch vụ cơ sở dữ liệu, trong menu thả xuống "Bảng từ xa", chọn bảng dữ liệu mà bạn muốn kết nối.

![Chọn bảng dữ liệu cần kết nối](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Cấu hình thông tin trường

![Cấu hình thông tin trường](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Nếu bảng từ xa có thay đổi về cấu trúc, bạn cũng có thể chọn "Đồng bộ từ bảng từ xa".

![Đồng bộ từ bảng từ xa](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Đồng bộ bảng từ xa

![Đồng bộ bảng từ xa](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Cuối cùng, hiển thị trên giao diện.

![Hiển thị trên giao diện](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)