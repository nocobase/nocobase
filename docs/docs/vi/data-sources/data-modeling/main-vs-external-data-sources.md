---
title: "So sánh Database chính và bên ngoài"
description: "Sự khác biệt giữa database chính và database bên ngoài: hỗ trợ loại database, loại Collection, loại Field, khả năng sao lưu khôi phục và di chuyển."
keywords: "database chính,database bên ngoài,so sánh Data Source,kết nối chỉ đọc,đồng bộ Collection,NocoBase"
---

# So sánh Database chính và bên ngoài

Sự khác biệt giữa database chính và database bên ngoài trong NocoBase chủ yếu thể hiện ở bốn khía cạnh sau: hỗ trợ loại database, hỗ trợ loại Collection, hỗ trợ loại Field và sao lưu khôi phục di chuyển.

## Một, Hỗ trợ loại database

Xem thêm chi tiết tại: [Quản lý Data Source](https://docs.nocobase.com/data-sources/data-source-manager)

### Loại database

| Loại database | Database chính hỗ trợ | Database bên ngoài hỗ trợ |
|-----------|-------------|--------------|
| PostgreSQL | ✅ | ✅ |
| MySQL | ✅ | ✅ |
| MariaDB | ✅ | ✅ |
| KingbaseES | ✅ | ✅ |
| MSSQL | ❌ | ✅ |
| Oracle | ❌ | ✅ |

### Quản lý Collection

| Quản lý Collection | Database chính hỗ trợ | Database bên ngoài hỗ trợ |
|-----------|-------------|--------------|
| Quản lý cơ bản | ✅ | ✅ |
| Quản lý trực quan | ✅ | ❌ |

## Hai, Hỗ trợ loại Collection

Xem thêm chi tiết tại: [Collection](https://docs.nocobase.com/data-sources/data-modeling/collection)

| Loại Collection | Database chính | Database bên ngoài | Ghi chú |
|-----------|---------|-----------|------|
| Bảng thông thường | ✅ | ✅ | Collection cơ bản |
| Bảng View | ✅ | ✅ | View của Data Source |
| Bảng kế thừa | ✅ | ❌ | Hỗ trợ kế thừa mô hình dữ liệu, chỉ Data Source chính hỗ trợ |
| Bảng tệp | ✅ | ❌ | Hỗ trợ tải lên tệp, chỉ Data Source chính hỗ trợ |
| Bảng bình luận | ✅ | ❌ | Tích hợp sẵn hệ thống bình luận, chỉ Data Source chính hỗ trợ |
| Bảng lịch | ✅ | ❌ | Collection cho giao diện lịch |
| Bảng biểu thức | ✅ | ❌ | Hỗ trợ tính toán công thức |
| Bảng cây | ✅ | ❌ | Dùng cho mô hình hóa dữ liệu cấu trúc cây |
| Bảng SQL | ✅ | ❌ | Collection có thể được định nghĩa qua SQL |
| Kết nối Collection bên ngoài | ✅ | ❌ | Bảng kết nối Data Source bên ngoài, chức năng hạn chế |

## Ba, Hỗ trợ loại Field

Xem thêm chi tiết tại: [Field của Collection](https://docs.nocobase.com/data-sources/data-modeling/collection-fields)

### Kiểu cơ bản

| Loại Field | Database chính | Database bên ngoài |
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

### Kiểu lựa chọn

| Loại Field | Database chính | Database bên ngoài |
|---------|---------|-----------|
| Checkbox | ✅ | ✅ |
| Dropdown (chọn một) | ✅ | ✅ |
| Dropdown (chọn nhiều) | ✅ | ✅ |
| Radio | ✅ | ✅ |
| Nhóm Checkbox | ✅ | ✅ |
| Khu vực hành chính Trung Quốc | ✅ | ❌ |

### Kiểu đa phương tiện

| Loại Field | Database chính | Database bên ngoài |
|---------|---------|-----------|
| Đa phương tiện | ✅ | ✅ |
| Markdown | ✅ | ✅ |
| Markdown (Vditor) | ✅ | ✅ |
| Văn bản giàu định dạng | ✅ | ✅ |
| Tệp đính kèm (Quan hệ) | ✅ | ❌ |
| Tệp đính kèm (URL) | ✅ | ✅ |

### Kiểu Datetime

| Loại Field | Database chính | Database bên ngoài |
|---------|---------|-----------|
| Datetime (có múi giờ) | ✅ | ✅ |
| Datetime (không có múi giờ) | ✅ | ✅ |
| Unix Timestamp | ✅ | ✅ |
| Ngày (không có giờ) | ✅ | ✅ |
| Giờ | ✅ | ✅ |

### Kiểu hình học

| Loại Field | Database chính | Database bên ngoài |
|---------|---------|-----------|
| Điểm | ✅ | ✅ |
| Đường thẳng | ✅ | ✅ |
| Hình tròn | ✅ | ✅ |
| Đa giác | ✅ | ✅ |

### Kiểu nâng cao

| Loại Field | Database chính | Database bên ngoài |
|---------|---------|-----------|
| UUID | ✅ | ✅ |
| Nano ID | ✅ | ✅ |
| Sắp xếp | ✅ | ✅ |
| Công thức | ✅ | ✅ |
| Mã hóa tự động | ✅ | ✅ |
| JSON | ✅ | ✅ |
| Bộ chọn Collection | ✅ | ❌ |
| Mã hóa | ✅ | ✅ |

### Field thông tin hệ thống

| Loại Field | Database chính | Database bên ngoài |
|---------|---------|-----------|
| Ngày tạo | ✅ | ✅ |
| Ngày cập nhật cuối | ✅ | ✅ |
| Người tạo | ✅ | ❌ |
| Người cập nhật cuối | ✅ | ❌ |
| Table OID | ✅ | ❌ |

### Kiểu quan hệ

| Loại Field | Database chính | Database bên ngoài |
|---------|---------|-----------|
| OneToOne | ✅ | ✅ |
| OneToMany | ✅ | ✅ |
| ManyToOne | ✅ | ✅ |
| ManyToMany | ✅ | ✅ |
| ManyToMany (mảng) | ✅ | ✅ |

:::info
Field tệp đính kèm phụ thuộc vào bảng tệp, mà bảng tệp chỉ được hỗ trợ bởi database chính, do đó database bên ngoài tạm thời không hỗ trợ Field tệp đính kèm.
:::

## Bốn, So sánh hỗ trợ sao lưu và di chuyển

| Chức năng | Database chính | Database bên ngoài |
|-----|---------|-----------|
| Sao lưu khôi phục | ✅ | ❌ (cần tự xử lý) |
| Quản lý di chuyển | ✅ | ❌ (cần tự xử lý) |

:::info
NocoBase cung cấp khả năng sao lưu, khôi phục và di chuyển cấu trúc cho database chính. Đối với database bên ngoài, các thao tác này cần được người dùng tự thực hiện độc lập theo môi trường database của mình, NocoBase không cung cấp hỗ trợ tích hợp sẵn.
:::

## So sánh tổng kết

| Mục so sánh | Database chính | Database bên ngoài |
|-------|---------|-----------|
| Loại database | PostgreSQL, MySQL, MariaDB, KingbaseES | PostgreSQL, MySQL, MariaDB, MSSQL, Oracle, KingbaseES |
| Hỗ trợ loại bảng | Tất cả các loại bảng | Chỉ hỗ trợ bảng thông thường và bảng View |
| Hỗ trợ loại Field | Tất cả các loại Field | Tất cả các loại Field ngoại trừ Field tệp đính kèm |
| Sao lưu và di chuyển | Hỗ trợ tích hợp sẵn | Cần tự xử lý |

## Khuyến nghị

- **Nếu sử dụng NocoBase để xây dựng hệ thống nghiệp vụ hoàn toàn mới**, vui lòng sử dụng **Database chính**, điều này sẽ cho phép bạn sử dụng đầy đủ chức năng của NocoBase.
- **Nếu sử dụng NocoBase để kết nối database của hệ thống khác nhằm thực hiện các thao tác CRUD cơ bản**, hãy sử dụng **Database bên ngoài**.
