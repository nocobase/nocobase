:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/integration/fdw/index).
:::

# Kết nối bảng dữ liệu bên ngoài (FDW)

## Giới thiệu

Tính năng kết nối với các bảng dữ liệu từ xa dựa trên Foreign Data Wrapper của cơ sở dữ liệu. Hiện tại, tính năng này hỗ trợ cơ sở dữ liệu MySQL và PostgreSQL.

:::info{title="Kết nối nguồn dữ liệu vs Kết nối bảng dữ liệu bên ngoài"}
- **Kết nối nguồn dữ liệu** đề cập đến việc thiết lập kết nối với một cơ sở dữ liệu hoặc dịch vụ API cụ thể, cho phép bạn sử dụng đầy đủ các tính năng của cơ sở dữ liệu hoặc dịch vụ do API cung cấp;
- **Kết nối bảng dữ liệu bên ngoài** đề cập đến việc lấy dữ liệu từ bên ngoài và ánh xạ để sử dụng cục bộ. Trong cơ sở dữ liệu, kỹ thuật này được gọi là FDW (Foreign Data Wrapper), tập trung vào việc sử dụng các bảng từ xa như các bảng cục bộ và chỉ có thể kết nối từng bảng một. Vì là truy cập từ xa, nên sẽ có các ràng buộc và hạn chế nhất định khi sử dụng.

Cả hai cũng có thể được sử dụng kết hợp với nhau. Phương thức đầu tiên được sử dụng để thiết lập kết nối với nguồn dữ liệu, và phương thức sau được sử dụng để truy cập chéo giữa các nguồn dữ liệu. Ví dụ, một nguồn dữ liệu PostgreSQL nhất định đã được kết nối, và một bảng cụ thể trong nguồn dữ liệu này là một bảng dữ liệu bên ngoài được tạo dựa trên FDW.
:::

### MySQL

MySQL sử dụng công cụ `federated`, cần được kích hoạt, và hỗ trợ kết nối với MySQL từ xa cũng như các cơ sở dữ liệu tương thích với giao thức này, chẳng hạn như MariaDB. Để biết thêm chi tiết, vui lòng tham khảo tài liệu về [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html).

### PostgreSQL

Trong PostgreSQL, các loại tiện ích mở rộng `fdw` khác nhau có thể được sử dụng để hỗ trợ các loại dữ liệu từ xa khác nhau. Các tiện ích mở rộng hiện đang được hỗ trợ bao gồm:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html): Kết nối với cơ sở dữ liệu PostgreSQL từ xa trong PostgreSQL.
- [mysql_fdw](https://github.com/EnterpriseDB/mysql_fdw): Kết nối với cơ sở dữ liệu MySQL từ xa trong PostgreSQL.
- Đối với các loại tiện ích mở rộng fdw khác, vui lòng tham khảo [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers). Bạn cần triển khai giao diện thích ứng tương ứng trong mã nguồn.

## Điều kiện tiên quyết

- Nếu cơ sở dữ liệu chính của NocoBase là MySQL, bạn cần kích hoạt `federated`. Tham khảo [Cách kích hoạt công cụ federated trong MySQL](./enable-federated)

Sau đó, cài đặt và kích hoạt plugin thông qua trình quản lý plugin.

![Cài đặt và kích hoạt plugin](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## Hướng dẫn sử dụng

Trong menu thả xuống của "Quản lý bộ sưu tập > Tạo bộ sưu tập", chọn "Kết nối dữ liệu bên ngoài"

![Kết nối dữ liệu bên ngoài](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

Trong menu thả xuống "Dịch vụ cơ sở dữ liệu", chọn một dịch vụ cơ sở dữ liệu hiện có hoặc "Tạo dịch vụ cơ sở dữ liệu"

![Dịch vụ cơ sở dữ liệu](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

Tạo dịch vụ cơ sở dữ liệu

![Tạo dịch vụ cơ sở dữ liệu](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

Sau khi chọn dịch vụ cơ sở dữ liệu, trong menu thả xuống "Bảng từ xa", hãy chọn bảng dữ liệu bạn cần kết nối.

![Chọn bảng dữ liệu cần kết nối](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

Cấu hình thông tin trường

![Cấu hình thông tin trường](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

Nếu bảng từ xa có thay đổi về cấu trúc, bạn cũng có thể "Đồng bộ từ bảng từ xa"

![Đồng bộ từ bảng từ xa](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

Đồng bộ bảng từ xa

![Đồng bộ bảng từ xa](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

Cuối cùng, hiển thị trên giao diện

![Hiển thị trên giao diện](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)