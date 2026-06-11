---
title: "Quản lý Plugin"
description: "Skill quản lý Plugin dùng để xem, kích hoạt và tắt các Plugin của NocoBase."
keywords: "AI Builder,Quản lý Plugin,Kích hoạt Plugin,Tắt Plugin"
---

# Quản lý Plugin

:::tip Điều kiện tiên quyết

Trước khi đọc trang này, vui lòng đảm bảo bạn đã cài đặt NocoBase CLI và hoàn thành khởi tạo theo [Bắt đầu nhanh với AI Builder](./index.md).

:::

## Giới thiệu

Skill quản lý Plugin dùng để xem, kích hoạt và tắt các Plugin của NocoBase — nó sẽ tự động nhận diện môi trường cục bộ hoặc từ xa, chọn backend thực thi phù hợp, và đảm bảo thao tác thành công thông qua việc đọc lại để kiểm tra.


## Phạm vi năng lực

- Xem danh mục Plugin và trạng thái kích hoạt.
- Kích hoạt Plugin.
- Tắt Plugin.

## Ví dụ câu lệnh

### Tình huống A: Xem trạng thái Plugin

Chế độ câu lệnh
```
Môi trường hiện tại có những Plugin nào
```
Chế độ dòng lệnh
```
nb plugin list
```

Sẽ liệt kê tất cả Plugin cùng trạng thái kích hoạt và thông tin phiên bản.

![Xem trạng thái Plugin](https://static-docs.nocobase.com/20260417150510.png)

### Tình huống B: Kích hoạt Plugin

Chế độ câu lệnh
```
Kích hoạt Plugin localization giúp tôi
```
Chế độ dòng lệnh
```
nb plugin enable <localization>
```

Skill sẽ kích hoạt theo thứ tự, sau mỗi lần kích hoạt sẽ đọc lại để xác nhận `enabled=true`.

![Kích hoạt Plugin](https://static-docs.nocobase.com/20260417153023.png)

### Tình huống C: Tắt Plugin

Chế độ câu lệnh
```
Tắt Plugin localization giúp tôi
```
Chế độ dòng lệnh
```
nb plugin disable  <localization>
```

![Tắt Plugin](https://static-docs.nocobase.com/20260417173442.png)

## Câu hỏi thường gặp

**Plugin đã kích hoạt nhưng chưa có hiệu lực thì sao?**

Một số Plugin sau khi kích hoạt cần restart ứng dụng mới có hiệu lực. Skill sẽ thông báo trong kết quả xem có cần restart không.

## Liên kết liên quan

- [Tổng quan về AI Builder](./index.md) — Tổng quan và cách cài đặt tất cả Skills của AI Builder
- [NocoBase CLI](../ai/quick-start.md) — Công cụ dòng lệnh để cài đặt và quản lý NocoBase
