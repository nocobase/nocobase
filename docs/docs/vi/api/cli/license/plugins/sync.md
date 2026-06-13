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
| `--yes`, `-y` | boolean | Khi `--env` được truyền tường minh và trỏ tới env khác với env hiện tại, bỏ qua bước xác nhận tương tác |
| `--dry-run` | boolean | Xem trước thay đổi mà không cài đặt, nâng cấp hoặc xóa plugin |
| `--version` | string | Phiên bản registry hoặc dist-tag sẽ được đồng bộ; mặc định dùng phiên bản workspace hiện tại |
| `--skip-if-no-license` | boolean | Bỏ qua mà không báo lỗi khi env hiện tại chưa có license key đã lưu |
| `--verbose` | boolean | Hiển thị log chi tiết cho từng plugin |
| `--json` | boolean | Xuất JSON |

## Ví dụ

```bash
nb license plugins sync
nb license plugins sync --env app1
nb license plugins sync --env app1 --yes
nb license plugins sync --env app1 --dry-run
nb license plugins sync --env app1 --skip-if-no-license
nb license plugins sync --env app1 --json
```

## Ghi chú

Khi bỏ qua `--version`, CLI sẽ tự động phát hiện phiên bản ứng dụng hiện tại và dùng nó để quyết định nên tải phiên bản registry nào của các plugin thương mại.

`--skip-if-no-license` chỉ bỏ qua một trường hợp: env hiện tại chưa có license key đã lưu. Các lỗi khác, như thiếu thông tin xác thực registry trong license key, lỗi đăng nhập registry hoặc lỗi tải plugin, vẫn sẽ được hiển thị bình thường.

Nếu bạn truyền `--env` một cách tường minh và nó khác env hiện tại, CLI sẽ yêu cầu xác nhận trước. Trong terminal không tương tác hoặc phiên AI agent, hãy tự thêm `--yes` hoặc chạy `nb env use <name>` trước rồi thử lại.

## Lệnh liên quan

- [`nb license plugins list`](./list.md)
- [`nb license plugins clean`](./clean.md)
