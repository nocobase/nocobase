---
title: "Trình quản lý route"
description: "Trình quản lý route quản lý route trang chính và menu, hỗ trợ desktop/mobile, bốn loại route group/page/tab/link, đồng bộ menu và route."
keywords: "route,Routes,menu route,NocoBase"
---

# Trình quản lý route

<PluginInfo name="client"></PluginInfo>

## Giới thiệu

Trình quản lý route là công cụ để quản lý route trang chính của hệ thống, hỗ trợ cả `desktop` và `mobile`. Các route được tạo bằng trình quản lý route sẽ tự động hiển thị trong menu (có thể cấu hình để không hiển thị trong menu). Ngược lại, các menu được thêm tại trang menu cũng sẽ tự động hiển thị trong danh sách trình quản lý route.

![20250107115449](https://static-docs.nocobase.com/20250107115449.png)

## Hướng dẫn sử dụng

### Loại route

Hệ thống hỗ trợ bốn loại route:

- Group: dùng để nhóm các route, có thể chứa route con
- Page: trang nội bộ của hệ thống
- Tab: loại route dùng để chuyển tab bên trong trang
- Link: liên kết nội bộ hoặc bên ngoài, có thể chuyển trực tiếp đến địa chỉ link đã cấu hình

### Thêm route

Click nút "Add new" ở góc trên bên phải để tạo route mới:

1. Chọn loại route (Type)
2. Điền tiêu đề route (Title)
3. Chọn icon route (Icon)
4. Đặt có hiển thị trong menu hay không (Show in menu)
5. Đặt có bật page tabs hay không (Enable page tabs)
6. Với loại page, hệ thống sẽ tự động sinh đường dẫn route duy nhất (Path)

![20250124131803](https://static-docs.nocobase.com/20250124131803.png)

### Thao tác route

Mỗi mục route hỗ trợ các thao tác sau:

- Add child: thêm route con
- Edit: chỉnh sửa cấu hình route
- View: xem trang route
- Delete: xóa route

### Thao tác hàng loạt

Thanh công cụ phía trên cung cấp các thao tác hàng loạt sau:

- Refresh: làm mới danh sách route
- Delete: xóa các route đã chọn
- Hide in menu: ẩn các route đã chọn trong menu
- Show in menu: hiển thị các route đã chọn trong menu

### Lọc route

Sử dụng tính năng "Filter" ở phía trên để lọc danh sách route theo nhu cầu.

:::info{title=Mẹo}
Việc thay đổi cấu hình route sẽ ảnh hưởng trực tiếp đến cấu trúc menu điều hướng của hệ thống. Hãy thao tác cẩn thận để đảm bảo tính chính xác của cấu hình route.
:::
