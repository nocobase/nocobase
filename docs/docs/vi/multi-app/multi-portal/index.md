---
title: "Multi-portal"
description: "Tìm hiểu khái niệm, tình huống sử dụng, cấu hình và mối quan hệ giữa Multi-portal, Multi-app và Multi-space trong NocoBase."
keywords: "không gian làm việc, portal, multi-portal, NocoBase"
pkg: "@nocobase/plugin-multi-portal"
---

# Multi-portal

## Portal là gì

Portal được dùng để cung cấp nhiều điểm truy cập trong cùng một ứng dụng.

Mỗi portal có thể độc lập có:

- Trang
- Menu
- Cấu trúc điều hướng
- Bố cục
- Cấu hình quyền

Plugin Multi-portal cung cấp các khả năng sau:

- Quản lý portal
- Chuyển đổi portal
- Kiểm soát quyền portal

Với các khả năng này, bạn có thể cung cấp trải nghiệm khác nhau cho các vai trò khác nhau trong khi vẫn chia sẻ cùng một bộ dữ liệu và năng lực nghiệp vụ.

## Tại sao cần portal

Trong các tình huống nghiệp vụ thực tế, các vai trò khác nhau thường cần các giao diện khác nhau.

Ví dụ trong một hệ thống quản lý bán lẻ:

```text
Hệ thống quản lý bán lẻ

├─ Portal trụ sở
├─ Portal cửa hàng
├─ Portal nhà phân phối
└─ Portal di động
```

Nhân viên trụ sở tập trung vào:

- Quản lý sản phẩm
- Quản lý tồn kho
- Phân tích dữ liệu

Nhân viên cửa hàng tập trung vào:

- Thu ngân
- Kiểm kê
- Xử lý đơn hàng

Nhà phân phối tập trung vào:

- Mua hàng
- Đối soát
- Trạng thái giao hàng

Mặc dù cùng sử dụng một hệ thống, nhưng các vai trò khác nhau không cần nhìn thấy cùng một menu và trang.

Portal được tạo ra chính để giải quyết vấn đề này.

## Mối quan hệ giữa portal và menu

Mỗi portal có cây menu riêng.

Menu giữa các portal khác nhau không ảnh hưởng lẫn nhau.

Ví dụ:

```text
Portal trụ sở
├─ Quản lý sản phẩm
├─ Quản lý chuỗi cung ứng
└─ Phân tích dữ liệu

Portal cửa hàng
├─ Thu ngân
├─ Quản lý đơn hàng
└─ Kiểm kê
```

## Mối quan hệ giữa portal và trang

Các trang thuộc về portal tương ứng của chúng.

Cùng một trang cũng có thể chỉ hiển thị trong một số portal nhất định.

Điều này cho phép thiết kế các quy trình thao tác hoàn toàn khác nhau cho các vai trò khác nhau.

## Mối quan hệ giữa portal và quyền

Bản thân portal có thể được cấu hình quyền truy cập.

Chỉ những người dùng được cấp quyền mới có thể truy cập portal tương ứng.

Các portal chưa được cấp quyền:

- Sẽ không xuất hiện trong danh sách chuyển đổi
- Không thể được truy cập trực tiếp

## Quản lý portal

Sau khi bật plugin Multi-portal, hệ thống mặc định cung cấp hai portal tích hợp sẵn:

| Portal | Đường dẫn | Mục đích |
|----------|----------|----------|
| Desktop | `/v/admin` | Điểm vào desktop |
| Mobile | `/v/mobile` | Điểm vào mobile |

### Portal tích hợp sẵn

![2026-07-10-08-01-50](https://static-docs.nocobase.com/2026-07-10-08-01-50.png)

### Portal desktop

Đường dẫn truy cập:

```text
/v/admin
```

![2026-07-10-08-03-12](https://static-docs.nocobase.com/2026-07-10-08-03-12.png)

### Portal mobile

Đường dẫn truy cập:

```text
/v/mobile
```

![2026-07-10-08-04-59](https://static-docs.nocobase.com/2026-07-10-08-04-59.png)

## Tạo portal

Ngoài các portal tích hợp sẵn, bạn cũng có thể tạo thêm portal theo nhu cầu nghiệp vụ.

Ví dụ:

- Portal cửa hàng
- Portal nhà phân phối
- Portal chăm sóc khách hàng
- Portal phân tích dữ liệu

Sau khi tạo, bạn có thể cấu hình:

- Trang
- Menu
- Quyền
- Điều hướng

![2026-07-10-08-06-15](https://static-docs.nocobase.com/2026-07-10-08-06-15.png)

## Chuyển đổi portal

Người dùng có thể nhanh chóng chuyển đổi giữa nhiều portal thông qua bộ chuyển đổi portal.

### Chuyển đổi portal trong một ứng dụng

Thêm vào bảng chuyển đổi portal ở góc trên bên trái

![2026-07-10-08-20-41](https://static-docs.nocobase.com/2026-07-10-08-20-41.png)

Thêm vào khối bảng thao tác

![2026-07-10-08-21-15](https://static-docs.nocobase.com/2026-07-10-08-21-15.png)

### Chuyển đổi portal giữa các ứng dụng

Sau khi bật Multi-app và cấu hình SSO, người dùng cũng có thể chuyển đổi giữa các portal của các ứng dụng khác nhau thông qua bộ chuyển đổi portal.

Thêm vào bảng chuyển đổi portal ở góc trên bên trái

![2026-07-10-08-25-19](https://static-docs.nocobase.com/2026-07-10-08-25-19.png)

Thêm vào khối bảng thao tác

![2026-07-10-08-25-50](https://static-docs.nocobase.com/2026-07-10-08-25-50.png)

## Quyền portal

Bạn có thể kiểm soát người dùng được truy cập portal nào thông qua quyền vai trò.

Các portal chưa được cấp quyền sẽ không xuất hiện trong danh sách bộ chuyển đổi portal, và người dùng cũng không thể truy cập trực tiếp vào các điểm vào đó.

![2026-07-10-08-29-22](https://static-docs.nocobase.com/2026-07-10-08-29-22.png)

## Liên kết liên quan

Để xem sự khác biệt và cách kết hợp giữa Multi-portal, Multi-app và Multi-space, hãy tham khảo: [Multi-app vs Multi-portal vs Multi-space](../multi-app-vs-multi-portal-vs-multi-space.md).
