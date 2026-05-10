---
title: "nb license id"
description: "Tài liệu lệnh nb license id: hiển thị hoặc tạo lại instance ID giấy phép thương mại cho một env đã chọn."
keywords: "nb license id,NocoBase CLI,instance id"
---

# nb license id

Hiển thị instance ID giấy phép thương mại cho env đã chọn. Nếu chưa có instance ID nào được lưu, CLI sẽ tự động tạo và lưu nó.

## Cách dùng

```bash
nb license id [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--env`, `-e` | string | Tên env CLI; nếu bỏ qua thì dùng env hiện tại |
| `--yes`, `-y` | boolean | Khi `--env` được truyền tường minh và trỏ tới env khác với env hiện tại, bỏ qua bước xác nhận tương tác |
| `--force` | boolean | Tạo lại instance ID ngay cả khi đã có bản lưu |
| `--json` | boolean | Xuất JSON |

## Ví dụ

```bash
nb license id
nb license id --env app1
nb license id --env app1 --yes
nb license id --env app1 --force
nb license id --env app1 --json
```

`--force` chỉ ép tái tạo instance ID. Nó không thay thế bước xác nhận cross-env; nếu `--env` được truyền tường minh trỏ tới env không phải env hiện tại, bạn vẫn cần xác nhận hoặc `--yes`.

## Lệnh liên quan

- [`nb license activate`](./activate.md)
- [`nb license status`](./status.md)
