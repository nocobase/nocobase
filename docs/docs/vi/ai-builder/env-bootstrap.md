---
title: "Quản lý môi trường"
description: "Skill quản lý môi trường phụ trách việc cài đặt, nâng cấp, dừng, khởi động ứng dụng NocoBase và quản lý đa môi trường, ví dụ môi trường phát triển, môi trường test, môi trường production... — từ \"chưa cài NocoBase\" đến \"có thể đăng nhập sử dụng\"."
keywords: "AI Builder,Quản lý môi trường,Cài đặt,Nâng cấp,Docker"
---

# Quản lý môi trường

:::tip Điều kiện tiên quyết

Trước khi đọc trang này, vui lòng đảm bảo bạn đã cài đặt NocoBase CLI và hoàn thành khởi tạo theo [Bắt đầu nhanh với AI Builder](./index.md).

:::

## Giới thiệu

Skill quản lý môi trường phụ trách việc cài đặt, nâng cấp, dừng, khởi động ứng dụng NocoBase và quản lý đa môi trường, ví dụ môi trường phát triển, môi trường test, môi trường production... — từ "chưa cài NocoBase" đến "có thể đăng nhập sử dụng".


## Phạm vi năng lực

- Truy vấn môi trường và trạng thái NocoBase
- Thêm, xóa, chuyển đổi môi trường NocoBase
- Cài đặt, nâng cấp, dừng, khởi động NocoBase


## Ví dụ câu lệnh

### Tình huống A: Truy vấn trạng thái môi trường
Chế độ câu lệnh
```
Hiện có những NocoBase nào? Tôi đang ở môi trường nào?
```
Chế độ dòng lệnh
```
nb env list
```

### Tình huống B: Thêm môi trường đã có
:::tip Điều kiện tiên quyết

Cần đã có sẵn NocoBase, dù là cục bộ hay từ xa

:::

Chế độ câu lệnh
```
Thêm cho tôi môi trường dev http://localhost:13000
```
Chế độ dòng lệnh
```
nb env add <dev> --base-url http://localhost:13000/api
```
### Tình huống C: Cài đặt NocoBase mới
:::tip Điều kiện tiên quyết

Cách cài đặt NocoBase tiện và nhanh nhất là dùng chế độ Docker, trước khi chạy hãy đảm bảo máy bạn đã có Node, Docker, Yarn

:::

Chế độ câu lệnh
```
Cài NocoBase giúp tôi
```
Chế độ dòng lệnh
```
nb init --ui
```

### Tình huống D: Nâng cấp instance

Chế độ câu lệnh
```
Nâng cấp instance hiện tại lên phiên bản mới nhất giúp tôi
```
Chế độ dòng lệnh
```
nb upgrade
```

### Tình huống E: Dừng instance

Chế độ câu lệnh
```
Dừng instance hiện tại giúp tôi
```
Chế độ dòng lệnh
```
nb app stop
```

### Tình huống E: Khởi động instance

Chế độ câu lệnh
```
Khởi động instance hiện tại giúp tôi
```
Chế độ dòng lệnh
```
nb app start
```

## Câu hỏi thường gặp

**Sau khi cài xong phát hiện không trải nghiệm được các năng lực AI Builder thì sao?**

Hiện tại tất cả năng lực AI Builder đều ở image alpha, hãy xác nhận xem có dùng image này để cài đặt không, nếu không có thể nâng cấp lên image này.

**Docker khởi động báo xung đột cổng thì sao?**

Đổi sang một cổng khác (ví dụ `port=14000`), hoặc dừng tiến trình đang chiếm cổng 13000 trước. Giai đoạn precheck của Skill sẽ chủ động cảnh báo xung đột cổng.

## Liên kết liên quan

- [Tổng quan về AI Builder](./index.md) — Tổng quan và cách cài đặt tất cả Skills của AI Builder
- [NocoBase CLI](../ai/quick-start.md) — Công cụ dòng lệnh để cài đặt và quản lý NocoBase
