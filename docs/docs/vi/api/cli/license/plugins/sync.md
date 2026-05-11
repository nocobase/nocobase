---
title: "nb license plugins sync"
description: "Tài liệu lệnh nb license plugins sync: đồng bộ các plugin thương mại được giấy phép hiện tại cho phép cho một env đã chọn."
keywords: "nb license plugins sync,NocoBase CLI,commercial plugins"
---

# nb license plugins sync

Đồng bộ các plugin thương mại được giấy phép hiện tại cho phép.

## Cách dùng

```bash
nb license plugins sync [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--env`, `-e` | string | Tên env CLI; nếu bỏ qua thì dùng env hiện tại |
| `--dry-run` | boolean | Xem trước thay đổi mà không cài đặt, nâng cấp hoặc xóa plugin |
| `--version` | string | Phiên bản registry hoặc dist-tag sẽ được đồng bộ; mặc định dùng phiên bản workspace hiện tại |
| `--verbose`, `-V` | boolean | Hiển thị log chi tiết cho từng plugin |
| `--json` | boolean | Xuất JSON |

## Ví dụ

```bash
nb license plugins sync
nb license plugins sync --env app1
nb license plugins sync --env app1 --dry-run
nb license plugins sync --env app1 --json
```

## Ghi chú

Khi bỏ qua `--version`, CLI sẽ tự động phát hiện phiên bản ứng dụng hiện tại và dùng nó để quyết định nên tải phiên bản registry nào của các plugin thương mại.

## Lệnh liên quan

- [`nb license plugins list`](./list.md)
- [`nb license plugins clean`](./clean.md)
