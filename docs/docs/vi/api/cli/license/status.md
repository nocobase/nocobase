---
title: "nb license status"
description: "Tài liệu lệnh nb license status: hiển thị trạng thái giấy phép thương mại cho một env đã chọn."
keywords: "nb license status,NocoBase CLI,license status"
---

# nb license status

Hiển thị trạng thái giấy phép thương mại cho env đã chọn.

## Cách dùng

```bash
nb license status [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--env`, `-e` | string | Tên env CLI; nếu bỏ qua thì dùng env hiện tại |
| `--doctor` | boolean | Chạy thêm các kiểm tra và gợi ý chẩn đoán |
| `--json` | boolean | Xuất JSON |

## Ví dụ

```bash
nb license status
nb license status --env app1
nb license status --env app1 --doctor
nb license status --env app1 --json
```

## Ghi chú

CLI mới hiện vẫn chưa triển khai đầy đủ phần kiểm tra trạng thái giấy phép ở backend. Lệnh này vẫn có thể trả về ngữ cảnh cơ bản và thông tin chẩn đoán dạng placeholder, nhưng chưa đưa ra kết luận giấy phép hoàn chỉnh.

## Lệnh liên quan

- [`nb license activate`](./activate.md)
- [`nb license id`](./id.md)
