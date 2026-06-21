---
title: "Bắt buộc"
description: "Cấu hình Field: cài đặt Field bắt buộc, kiểm tra không rỗng khi gửi, hỗ trợ thông báo lỗi tùy chỉnh."
keywords: "bắt buộc,required,xác thực Field,xác thực Form,Interface Builder,NocoBase"
---

# Bắt buộc

## Giới thiệu

Bắt buộc là quy tắc xác thực Form thường gặp, bạn có thể bật bắt buộc trực tiếp trong tùy chọn cấu hình Field, hoặc đặt Field bắt buộc động thông qua Quy tắc liên kết của Form.

## Có thể đặt Field bắt buộc ở đâu

### Cài đặt Field của Table dữ liệu

Khi cài đặt bắt buộc trong Field Table dữ liệu, sẽ kích hoạt xác thực phía backend, frontend cũng mặc định hiển thị là bắt buộc (không thể sửa đổi).
![20251025175418](https://static-docs.nocobase.com/20251025175418.png)

### Cấu hình Field

Đặt trực tiếp Field là bắt buộc, phù hợp với những Field luôn cần người dùng điền, như tên người dùng, mật khẩu.

![20251028222818](https://static-docs.nocobase.com/20251028222818.png)

### Quy tắc liên kết

Thông qua Quy tắc liên kết Field của Block Form để đặt bắt buộc theo điều kiện.

Ví dụ: khi ngày đơn hàng không rỗng thì mã đơn hàng bắt buộc.

![20251028223004](https://static-docs.nocobase.com/20251028223004.png)

### Event Flow
