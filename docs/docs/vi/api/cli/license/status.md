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
| `--yes`, `-y` | boolean | Khi `--env` được truyền tường minh và trỏ tới env khác với env hiện tại, bỏ qua bước xác nhận tương tác |
| `--doctor` | boolean | Chạy thêm các kiểm tra và gợi ý chẩn đoán |
| `--json` | boolean | Xuất JSON |

## Ví dụ

```bash
nb license status
nb license status --env app1
nb license status --env app1 --yes
nb license status --env app1 --doctor
nb license status --env app1 --json
```

## Ghi chú

CLI mới hiện vẫn chưa triển khai đầy đủ phần kiểm tra trạng thái giấy phép ở backend. Lệnh này vẫn có thể trả về ngữ cảnh cơ bản và thông tin chẩn đoán dạng placeholder, nhưng chưa đưa ra kết luận giấy phép hoàn chỉnh.

Nếu bạn truyền `--env` một cách tường minh và nó khác env hiện tại, CLI sẽ yêu cầu xác nhận trước. Trong terminal không tương tác hoặc phiên AI agent, hãy tự thêm `--yes` hoặc chạy `nb env use <name>` trước rồi thử lại.

## Lệnh liên quan

- [`nb license activate`](./activate.md)
- [`nb license id`](./id.md)
