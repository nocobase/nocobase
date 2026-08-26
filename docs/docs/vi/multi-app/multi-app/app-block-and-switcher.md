---
pkg: '@nocobase/plugin-app-supervisor'
title: 'Khối ứng dụng và chuyển đổi ứng dụng'
description: 'Khối ứng dụng và app switcher trong multi-app: hiển thị entry ứng dụng con ở frontend, cấu hình icon, trạng thái hiển thị và app switcher ở góc trái trên.'
keywords: 'multi-app,khối ứng dụng,app switcher,entry ứng dụng con,NocoBase'
---

# Khối ứng dụng và chuyển đổi ứng dụng

Ngoài việc quản lý ứng dụng con trong admin, multi-app cũng có thể cung cấp entry ứng dụng ở frontend. Các cách phổ biến gồm:

- Thêm khối "Applications" vào trang để hiển thị các ứng dụng con có thể truy cập
- Bật app switcher ở góc trái trên để người dùng chuyển giữa ứng dụng chính và ứng dụng con

## Khối ứng dụng

![](https://static-docs.nocobase.com/202605271350840.png)

Khối "Applications" hiển thị danh sách ứng dụng con trên trang frontend. Khối này phù hợp để tạo một portal ứng dụng đơn giản, cho phép người dùng vào các ứng dụng nghiệp vụ khác nhau từ một trang.

Mỗi ứng dụng hiển thị:

- Icon ứng dụng
- Tên ứng dụng
- Entry truy cập

Khi nhấn vào ứng dụng, ứng dụng con tương ứng sẽ được mở.

### Cấu hình icon ứng dụng

Khi tạo hoặc chỉnh sửa ứng dụng trong App Supervisor, bạn có thể tải lên icon trong "Display configuration".

Nếu chưa tải icon, hệ thống sẽ tạo icon mặc định từ chữ cái đầu của tên ứng dụng.

![](https://static-docs.nocobase.com/202605271402603.png)

### Ẩn ứng dụng

Nếu không muốn ứng dụng xuất hiện trong khối "Applications", hãy chọn "Hide in Applications block" trong cấu hình ứng dụng.

Sau khi ẩn:

- Ứng dụng vẫn có thể được quản lý trong admin
- Ứng dụng vẫn có thể truy cập bằng địa chỉ trực tiếp
- Ứng dụng chỉ không còn hiển thị trong khối "Applications"

![](https://static-docs.nocobase.com/202605271403980.png)

## App switcher

![](https://static-docs.nocobase.com/202605271403304.png)

App switcher hiển thị ở góc trái trên, dùng để chuyển nhanh sang ứng dụng khác.

Nếu muốn ứng dụng xuất hiện trong app switcher, bật "Show in app switcher" trong cấu hình ứng dụng.

Sau khi bật, người dùng có thể thấy app switcher trong ứng dụng chính hoặc ứng dụng con và vào ứng dụng khác từ danh sách.

![](https://static-docs.nocobase.com/202605271404322.png)

### Cách mở

App switcher mở ứng dụng theo cách sau:

- Từ ứng dụng chính sang ứng dụng con: mở trong tab mới
- Từ một ứng dụng con sang ứng dụng con khác: mở trong tab hiện tại

Cách này tránh làm gián đoạn thao tác trong ứng dụng chính và giúp chuyển giữa các ứng dụng con tự nhiên hơn.
