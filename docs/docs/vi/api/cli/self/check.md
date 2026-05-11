---
title: "nb self check"
description: "Tham khảo lệnh nb self check: kiểm tra phiên bản và khả năng tự cập nhật của NocoBase CLI đã cài."
keywords: "nb self check,NocoBase CLI,kiểm tra phiên bản"
---

# nb self check

Kiểm tra cài đặt NocoBase CLI hiện tại, phân giải phiên bản mới nhất theo channel đã chọn và báo cáo có hỗ trợ tự cập nhật tự động hay không.

## Cách dùng

```bash
nb self check [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--channel` | string | Channel phát hành để so sánh, mặc định `auto`; có thể chọn `auto`, `latest`, `beta`, `alpha` |
| `--json` | boolean | Đầu ra dạng JSON |

## Ví dụ

```bash
nb self check
nb self check --channel beta
nb self check --json
```

## Lệnh liên quan

- [`nb self update`](./update.md)
