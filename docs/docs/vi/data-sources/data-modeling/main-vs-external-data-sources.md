:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# So sánh Cơ sở dữ liệu chính và Cơ sở dữ liệu ngoài

Sự khác biệt giữa cơ sở dữ liệu chính và cơ sở dữ liệu ngoài trong NocoBase chủ yếu thể hiện ở bốn khía cạnh sau: hỗ trợ loại cơ sở dữ liệu, hỗ trợ loại bộ sưu tập, hỗ trợ loại trường và khả năng sao lưu, di chuyển.

## 1. Hỗ trợ loại Cơ sở dữ liệu

Để biết thêm chi tiết, vui lòng tham khảo: [Quản lý nguồn dữ liệu](https://docs.nocobase.com/data-sources/data-source-manager)

### Các loại Cơ sở dữ liệu

| Loại Cơ sở dữ liệu | Hỗ trợ Cơ sở dữ liệu chính | Hỗ trợ Cơ sở dữ liệu ngoài |
|-------------------|---------------------------|------------------------------|
| PostgreSQL        | ✅                        | ✅                           |
| MySQL             | ✅                        | ✅                           |
| MariaDB           | ✅                        | ✅                           |
| KingbaseES        | ✅                        | ✅                           |
| MSSQL             | ❌                        | ✅                           |
| Oracle            | ❌                        | ✅                           |

### Quản lý bộ sưu tập

| Quản lý bộ sưu tập | Hỗ trợ Cơ sở dữ liệu chính | Hỗ trợ Cơ sở dữ liệu ngoài |
|--------------------|-----------------------------|------------------------------|
| Quản lý cơ bản     | ✅                          | ✅                           |
| Quản lý trực quan  | ✅                          | ❌                           |

## 2. Hỗ trợ loại bộ sưu tập

Để biết thêm chi tiết, vui lòng tham khảo: [Bộ sưu tập](https://docs.nocobase.com/data-sources/data-modeling/collection)

| Loại bộ sưu tập      | Cơ sở dữ liệu chính | Cơ sở dữ liệu ngoài | Mô tả                                                 |
|----------------------|-------------------|---------------------|-------------------------------------------------------|
| Thông thường         | ✅                | ✅                  | Bộ sưu tập cơ bản                                     |
| Dạng xem             | ✅                | ✅                  | Dạng xem nguồn dữ liệu                                |
| Kế thừa              | ✅                | ❌                  | Hỗ trợ kế thừa mô hình dữ liệu, chỉ áp dụng cho nguồn dữ liệu chính |
| Tệp                  | ✅                | ❌                  | Hỗ trợ tải tệp lên, chỉ áp dụng cho nguồn dữ liệu chính |
| Bình luận            | ✅                | ❌                  | Hệ thống bình luận tích hợp, chỉ áp dụng cho nguồn dữ liệu chính |
| Lịch                 | ✅                | ❌                  | Bộ sưu tập dùng cho dạng xem lịch                     |
| Biểu thức            | ✅                | ❌                  | Hỗ trợ tính toán công thức                            |
| Cây                  | ✅                | ❌                  | Dùng để mô hình hóa dữ liệu cấu trúc cây              |
| SQL                  | ✅                | ❌                  | Bộ sưu tập có thể định nghĩa bằng SQL                 |
| Kết nối ngoài        | ✅                | ❌                  | Bộ sưu tập kết nối cho nguồn dữ liệu ngoài, chức năng hạn chế |

## 3. Hỗ trợ loại trường

Để biết thêm chi tiết, vui lòng tham khảo: [Trường bộ sưu tập](https://docs.nocobase.com/data-sources/data-modeling/collection-fields)

### Các loại cơ bản

| Loại trường         | Cơ sở dữ liệu chính | Cơ sở dữ liệu ngoài |
|---------------------|-------------------|---------------------|
| Văn bản một dòng    | ✅                | ✅                  |
| Văn bản nhiều dòng  | ✅                | ✅                  |
| Số điện thoại       | ✅                | ✅                  |
| Email               | ✅                | ✅                  |
| URL                 | ✅                | ✅                  |
| Số nguyên           | ✅                | ✅                  |
| Số                  | ✅                | ✅                  |
| Phần trăm           | ✅                | ✅                  |
| Mật khẩu            | ✅                | ✅                  |
| Màu sắc             | ✅                | ✅                  |
| Biểu tượng          | ✅                | ✅                  |

### Các loại lựa chọn

| Loại trường                   | Cơ sở dữ liệu chính | Cơ sở dữ liệu ngoài |
|-------------------------------|-------------------|---------------------|
| Hộp kiểm                      | ✅                | ✅                  |
| Menu thả xuống (chọn một)     | ✅                | ✅                  |
| Menu thả xuống (chọn nhiều)   | ✅                | ✅                  |
| Nhóm nút radio                | ✅                | ✅                  |
| Nhóm hộp kiểm                 | ✅                | ✅                  |
| Khu vực hành chính Trung Quốc | ✅                | ❌                  |

### Các loại đa phương tiện

| Loại trường               | Cơ sở dữ liệu chính | Cơ sở dữ liệu ngoài |
|---------------------------|-------------------|---------------------|
| Đa phương tiện            | ✅                | ✅                  |
| Markdown                  | ✅                | ✅                  |
| Markdown (Vditor)         | ✅                | ✅                  |
| Văn bản đa dạng           | ✅                | ✅                  |
| Tệp đính kèm (Liên kết)   | ✅                | ❌                  |
| Tệp đính kèm (URL)        | ✅                | ✅                  |

### Các loại Ngày & Giờ

| Loại trường                 | Cơ sở dữ liệu chính | Cơ sở dữ liệu ngoài |
|-----------------------------|-------------------|---------------------|
| Ngày giờ (có múi giờ)       | ✅                | ✅                  |
| Ngày giờ (không múi giờ)    | ✅                | ✅                  |
| Dấu thời gian Unix          | ✅                | ✅                  |
| Ngày (không có giờ)         | ✅                | ✅                  |
| Giờ                         | ✅                | ✅                  |

### Các loại Hình học

| Loại trường | Cơ sở dữ liệu chính | Cơ sở dữ liệu ngoài |
|-------------|-------------------|---------------------|
| Điểm        | ✅                | ✅                  |
| Đường        | ✅                | ✅                  |
| Hình tròn   | ✅                | ✅                  |
| Đa giác     | ✅                | ✅                  |

### Các loại nâng cao

| Loại trường           | Cơ sở dữ liệu chính | Cơ sở dữ liệu ngoài |
|-----------------------|-------------------|---------------------|
| UUID                  | ✅                | ✅                  |
| Nano ID               | ✅                | ✅                  |
| Sắp xếp               | ✅                | ✅                  |
| Công thức tính toán   | ✅                | ✅                  |
| Mã tự động            | ✅                | ✅                  |
| JSON                  | ✅                | ✅                  |
| Bộ chọn bộ sưu tập    | ✅                | ❌                  |
| Mã hóa                | ✅                | ✅                  |

### Các trường thông tin hệ thống

| Loại trường           | Cơ sở dữ liệu chính | Cơ sở dữ liệu ngoài |
|-----------------------|-------------------|---------------------|
| Ngày tạo              | ✅                | ✅                  |
| Ngày cập nhật cuối    | ✅                | ✅                  |
| Người tạo             | ✅                | ❌                  |
| Người cập nhật cuối   | ✅                | ❌                  |
| OID bảng              | ✅                | ❌                  |

### Các loại liên kết

| Loại trường           | Cơ sở dữ liệu chính | Cơ sở dữ liệu ngoài |
|-----------------------|-------------------|---------------------|
| Một-một               | ✅                | ✅                  |
| Một-nhiều             | ✅                | ✅                  |
| Nhiều-một             | ✅                | ✅                  |
| Nhiều-nhiều           | ✅                | ✅                  |
| Nhiều-nhiều (mảng)    | ✅                | ✅                  |

:::info
Các trường tệp đính kèm phụ thuộc vào bộ sưu tập tệp, mà bộ sưu tập tệp chỉ được hỗ trợ bởi cơ sở dữ liệu chính. Do đó, cơ sở dữ liệu ngoài hiện không hỗ trợ các trường tệp đính kèm.
:::

## 4. So sánh hỗ trợ Sao lưu và Di chuyển

| Tính năng           | Cơ sở dữ liệu chính | Cơ sở dữ liệu ngoài |
|---------------------|-------------------|---------------------|
| Sao lưu & Khôi phục | ✅                | ❌ (Người dùng tự xử lý) |
| Quản lý di chuyển   | ✅                | ❌ (Người dùng tự xử lý) |

:::info
NocoBase cung cấp khả năng sao lưu, khôi phục và di chuyển cấu trúc cho cơ sở dữ liệu chính. Đối với cơ sở dữ liệu ngoài, người dùng cần tự thực hiện các thao tác này tùy theo môi trường cơ sở dữ liệu của họ. NocoBase không cung cấp hỗ trợ tích hợp sẵn.
:::

## Tóm tắt so sánh

| Mục so sánh               | Cơ sở dữ liệu chính                               | Cơ sở dữ liệu ngoài                                   |
|---------------------------|---------------------------------------------------|-------------------------------------------------------|
| Các loại Cơ sở dữ liệu    | PostgreSQL, MySQL, MariaDB, KingbaseES            | PostgreSQL, MySQL, MariaDB, MSSQL, Oracle, KingbaseES |
| Hỗ trợ loại bộ sưu tập    | Tất cả các loại bộ sưu tập                        | Chỉ hỗ trợ bộ sưu tập thông thường và dạng xem        |
| Hỗ trợ loại trường        | Tất cả các loại trường                            | Tất cả các loại trường ngoại trừ trường tệp đính kèm |
| Sao lưu & Di chuyển       | Hỗ trợ tích hợp sẵn                               | Người dùng tự xử lý                                   |

## Khuyến nghị

- **Nếu bạn đang sử dụng NocoBase để xây dựng một hệ thống nghiệp vụ hoàn toàn mới**, vui lòng sử dụng **cơ sở dữ liệu chính**. Điều này sẽ cho phép bạn tận dụng toàn bộ chức năng của NocoBase.
- **Nếu bạn đang sử dụng NocoBase để kết nối với cơ sở dữ liệu của các hệ thống khác nhằm thực hiện các thao tác CRUD cơ bản**, thì hãy sử dụng **cơ sở dữ liệu ngoài**.