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
| `--channel` | string | Channel phát hành để so sánh, mặc định `auto`; có thể chọn `auto`, `latest`, `test`, `beta`, `alpha` |
| `--json` | boolean | Đầu ra dạng JSON |

## Phương thức cài đặt

`nb self check` phát hiện phương thức cài đặt hiện tại khi chạy. Lệnh này không dùng cache lịch sử `self-install-methods.json`.

Lệnh có thể báo cáo các phương thức cài đặt sau:

| Phương thức cài đặt | Ý nghĩa |
| --- | --- |
| `npm-global` | CLI được cài dưới `npm prefix -g` hiện tại. |
| `pnpm-global` | CLI được cài trong cây `node_modules` global của pnpm. |
| `yarn-global` | CLI được khởi chạy từ `yarn global bin` hoặc được cài dưới `yarn global dir`. |
| `package-local` | CLI được cài trong cây dependency của một dự án cục bộ. |
| `source` | CLI đang chạy từ checkout repository. |
| `unknown` | Không thể khớp cài đặt CLI với một phương thức cài đặt được hỗ trợ. |

Tự cập nhật được hỗ trợ cho `npm-global`, `pnpm-global` và `yarn-global`. Với `package-local` hoặc `source`, hãy cập nhật dự án cha hoặc checkout repository tương ứng.

## Ví dụ

```bash
nb self check
nb self check --channel beta
nb self check --json
```

## Lệnh liên quan

- [`nb self update`](./update.md)
