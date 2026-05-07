---
title: "nb env list"
description: "Tài liệu lệnh nb env list: liệt kê các NocoBase CLI env đã cấu hình và trạng thái xác thực API."
keywords: "nb env list,NocoBase CLI,Danh sách env,Trạng thái xác thực"
---

# nb env list

Liệt kê tất cả env đã cấu hình và dùng thông tin Token/OAuth đã lưu để kiểm tra trạng thái xác thực với API ứng dụng.

## Cách dùng

```bash
nb env list
```

## Đầu ra

Bảng output gồm cờ env hiện tại, tên, kiểu, App Status, URL, phương thức xác thực và phiên bản runtime.

`App Status` thể hiện trạng thái CLI nhận được khi gọi API ứng dụng bằng thông tin xác thực của env hiện tại, ví dụ `ok`, `auth failed`, `unreachable` hoặc `unconfigured`. Để xem trạng thái runtime của database, hãy dùng [`nb db ps`](../db/ps.md).

## Ví dụ

```bash
nb env list
```

## Lệnh liên quan

- [`nb env info`](./info.md)
- [`nb env use`](./use.md)
- [`nb db ps`](../db/ps.md)
