---
title: "So sánh cơ sở dữ liệu chính và bên ngoài"
description: "Sự khác biệt giữa cơ sở dữ liệu chính và cơ sở dữ liệu bên ngoài: so sánh về loại cơ sở dữ liệu được hỗ trợ, loại bảng dữ liệu, loại trường dữ liệu và khả năng sao lưu, khôi phục, di chuyển."
keywords: "cơ sở dữ liệu chính,cơ sở dữ liệu bên ngoài,so sánh nguồn dữ liệu,kết nối chỉ đọc,đồng bộ bảng dữ liệu,NocoBase"
---

# So sánh cơ sở dữ liệu chính và bên ngoài

Sự khác biệt giữa cơ sở dữ liệu chính và cơ sở dữ liệu bên ngoài trong NocoBase chủ yếu thể hiện ở bốn khía cạnh sau: hỗ trợ loại cơ sở dữ liệu, hỗ trợ loại bảng dữ liệu, hỗ trợ loại trường dữ liệu và khả năng sao lưu, khôi phục, di chuyển.

## Một, hỗ trợ loại cơ sở dữ liệu

Để biết thêm chi tiết, vui lòng tham khảo: [Quản lý nguồn dữ liệu](https://docs.nocobase.com/data-sources/data-source-manager)

### Loại cơ sở dữ liệu

| Loại cơ sở dữ liệu | Cơ sở dữ liệu chính | Cơ sở dữ liệu bên ngoài |
|-----------|-------------|--------------|
| PostgreSQL | ✅ | ✅ |
| MySQL | ✅ | ✅ |
| MariaDB | ✅ | ✅ |
| KingbaseES | ✅ | ✅ |
| MSSQL | ❌ | ✅ |
| Oracle | ❌ | ✅ |

### Quản lý bảng dữ liệu

| Quản lý bảng dữ liệu | Cơ sở dữ liệu chính | Cơ sở dữ liệu bên ngoài |
|-----------|-------------|--------------|
| Quản lý cơ bản | ✅ | ✅ |
| Quản lý trực quan | ✅ | ❌ |

## Hai, hỗ trợ loại bảng dữ liệu

Để biết thêm chi tiết, vui lòng tham khảo: [Bảng dữ liệu](https://docs.nocobase.com/data-sources/data-modeling/collection)

| Loại bảng dữ liệu | Cơ sở dữ liệu chính | Cơ sở dữ liệu bên ngoài | Mô tả |
|-----------|---------|-----------|------|
| Bảng thông thường | ✅ | ✅ | Bảng dữ liệu cơ bản |
| Bảng dạng view | ✅ | ✅ | View của nguồn dữ liệu |
| Bảng kế thừa | ✅ | ❌ | Hỗ trợ kế thừa mô hình dữ liệu, chỉ nguồn dữ liệu chính hỗ trợ |
| Bảng tệp | ✅ | ❌ | Hỗ trợ tải tệp lên, chỉ nguồn dữ liệu chính hỗ trợ |
| Bảng bình luận | ✅ | ❌ | Hệ thống bình luận tích hợp, chỉ nguồn dữ liệu chính hỗ trợ |
| Bảng lịch | ✅ | ❌ | Bảng dữ liệu dùng cho chế độ xem lịch |
| Bảng biểu thức | ✅ | ❌ | Hỗ trợ tính toán công thức |
| Bảng cây | ✅ | ❌ | Dùng để mô hình hóa dữ liệu có cấu trúc cây |
| Bảng SQL | ✅ | ❌ | Bảng dữ liệu có thể định nghĩa bằng SQL |
| Bảng kết nối dữ liệu bên ngoài | ✅ | ❌ | Bảng kết nối với nguồn dữ liệu bên ngoài, chức năng hạn chế |

## Ba, hỗ trợ loại trường dữ liệu

Để biết thêm chi tiết, vui lòng tham khảo: [Trường bảng dữ liệu](https://docs.nocobase.com/data-sources/data-modeling/collection-fields)

### Loại cơ bản

| Loại trường | Cơ sở dữ liệu chính | Cơ sở dữ liệu bên ngoài |
|---------|---------|-----------|
| Văn bản một dòng | ✅ | ✅ |
| Văn bản nhiều dòng | ✅ | ✅ |
| Số điện thoại | ✅ | ✅ |
| Email | ✅ | ✅ |
| URL | ✅ | ✅ |
| Số nguyên | ✅ | ✅ |
| Số | ✅ | ✅ |
| Phần trăm | ✅ | ✅ |
| Mật khẩu | ✅ | ✅ |
| Màu sắc | ✅ | ✅ |
| Biểu tượng | ✅ | ✅ |

### Loại lựa chọn

| Loại trường | Cơ sở dữ liệu chính | Cơ sở dữ liệu bên ngoài |
|---------|---------|-----------|
| Hộp kiểm | ✅ | ✅ |
| Menu thả xuống (chọn một) | ✅ | ✅ |
| Menu thả xuống (chọn nhiều) | ✅ | ✅ |
| Nút radio | ✅ | ✅ |
| Hộp kiểm nhiều lựa chọn | ✅ | ✅ |
| Khu vực hành chính Trung Quốc | ✅ | ❌ |

### Loại đa phương tiện

| Loại trường | Cơ sở dữ liệu chính | Cơ sở dữ liệu bên ngoài |
|---------|---------|-----------|
| Đa phương tiện | ✅ | ✅ |
| Markdown | ✅ | ✅ |
| Markdown (Vditor) | ✅ | ✅ |
| Văn bản có định dạng | ✅ | ✅ |
| Tệp đính kèm (quan hệ) | ✅ | ❌ |
| Tệp đính kèm (URL) | ✅ | ✅ |

### Loại ngày giờ

| Loại trường | Cơ sở dữ liệu chính | Cơ sở dữ liệu bên ngoài |
|---------|---------|-----------|
| Ngày giờ (có múi giờ) | ✅ | ✅ |
| Ngày giờ (không có múi giờ) | ✅ | ✅ |
| Dấu thời gian Unix | ✅ | ✅ |
| Ngày (không có thời gian) | ✅ | ✅ |
| Thời gian | ✅ | ✅ |

### Loại hình học

| Loại trường | Cơ sở dữ liệu chính | Cơ sở dữ liệu bên ngoài |
|---------|---------|-----------|
| Điểm | ✅ | ✅ |
| Đường | ✅ | ✅ |
| Hình tròn | ✅ | ✅ |
| Đa giác | ✅ | ✅ |

### Loại nâng cao

| Loại trường | Cơ sở dữ liệu chính | Cơ sở dữ liệu bên ngoài |
|---------|---------|-----------|
| UUID | ✅ | ✅ |
| Nano ID | ✅ | ✅ |
| Sắp xếp | ✅ | ✅ |
| Công thức tính toán | ✅ | ✅ |
| Mã tự động | ✅ | ✅ |
| JSON | ✅ | ✅ |
| Bộ chọn bảng dữ liệu | ✅ | ❌ |
| Mã hóa | ✅ | ✅ |

### Trường thông tin hệ thống

| Loại trường | Cơ sở dữ liệu chính | Cơ sở dữ liệu bên ngoài |
|---------|---------|-----------|
| Ngày tạo | ✅ | ✅ |
| Ngày sửa đổi lần cuối | ✅ | ✅ |
| Người tạo | ✅ | ❌ |
| Người sửa đổi lần cuối | ✅ | ❌ |
| Table OID | ✅ | ❌ |

### Loại quan hệ

| Loại trường | Cơ sở dữ liệu chính | Cơ sở dữ liệu bên ngoài |
|---------|---------|-----------|
| Một-một | ✅ | ✅ |
| Một-nhiều | ✅ | ✅ |
| Nhiều-một | ✅ | ✅ |
| Nhiều-nhiều | ✅ | ✅ |
| Nhiều-nhiều (mảng) | ✅ | ✅ |

:::info
Trường tệp đính kèm phụ thuộc vào bảng tệp, trong khi bảng tệp chỉ được cơ sở dữ liệu chính hỗ trợ. Vì vậy, cơ sở dữ liệu bên ngoài hiện chưa hỗ trợ trường tệp đính kèm.
:::

## Bốn, so sánh khả năng sao lưu và di chuyển

| Chức năng | Cơ sở dữ liệu chính | Cơ sở dữ liệu bên ngoài |
|-----|---------|-----------|
| Sao lưu và khôi phục | ✅ | ❌ (cần tự xử lý) |
| Quản lý di chuyển | ✅ | ❌ (cần tự xử lý) |

:::info
NocoBase cung cấp khả năng sao lưu, khôi phục và di chuyển cấu trúc cho cơ sở dữ liệu chính. Đối với cơ sở dữ liệu bên ngoài, người dùng cần tự thực hiện các thao tác này tùy theo môi trường cơ sở dữ liệu của mình; NocoBase không cung cấp hỗ trợ tích hợp sẵn.
:::

## So sánh tổng quan

| Hạng mục so sánh | Cơ sở dữ liệu chính | Cơ sở dữ liệu bên ngoài |
|-------|---------|-----------|
| Loại cơ sở dữ liệu | PostgreSQL, MySQL, MariaDB, KingbaseES | PostgreSQL, MySQL, MariaDB, MSSQL, Oracle, KingbaseES |
| Hỗ trợ loại bảng | Tất cả các loại bảng | Chỉ hỗ trợ bảng thông thường và bảng dạng view |
| Hỗ trợ loại trường | Tất cả các loại trường | Tất cả các loại trường ngoại trừ trường tệp đính kèm |
| Sao lưu và di chuyển | Hỗ trợ tích hợp sẵn | Cần tự xử lý |

## Khuyến nghị

- **Nếu sử dụng NocoBase để xây dựng một hệ thống nghiệp vụ hoàn toàn mới**, hãy sử dụng **cơ sở dữ liệu chính** để có thể sử dụng đầy đủ các chức năng của NocoBase.
- **Nếu sử dụng NocoBase để kết nối với cơ sở dữ liệu của hệ thống khác nhằm thực hiện các thao tác thêm, xóa, sửa và truy vấn dữ liệu cơ bản**, hãy sử dụng **cơ sở dữ liệu bên ngoài**.