---
title: "nb env list"
description: "Tài liệu lệnh nb env list: liệt kê các NocoBase CLI env đã được cấu hình."
keywords: "nb env list,NocoBase CLI,danh sách môi trường,API Base URL"
---

# nb env list

Liệt kê tất cả env đã được cấu hình.

Lệnh này chỉ hiển thị cấu hình đã lưu. Hãy dùng [`nb env status`](./status.md) khi bạn muốn kiểm tra trạng thái.

## Cách dùng


nb env list

## Đầu ra

Bảng kết quả bao gồm dấu đánh dấu môi trường hiện tại, tên, loại, `API Base URL`, kiểu xác thực và phiên bản runtime.

- `Current` đánh dấu env đang có hiệu lực bằng `*`
- `API Base URL` hiển thị địa chỉ API gốc đã lưu
- `Runtime` hiển thị thông tin phiên bản runtime đã được cache

## Ví dụ


nb env list

## Lệnh liên quan

- [`nb env current`](./current.md)
- [`nb env status`](./status.md)
- [`nb env info`](./info.md)
- [`nb env use`](./use.md)
