---
title: "nb self update"
description: "Tham khảo lệnh nb self update: cập nhật NocoBase CLI được cài global qua npm, pnpm hoặc yarn."
keywords: "nb self update,NocoBase CLI,cập nhật,tự cập nhật"
---

# nb self update

Khi CLI hiện tại được quản lý bởi cài đặt global tiêu chuẩn của npm, pnpm hoặc yarn, lệnh này cập nhật NocoBase CLI đã cài.

## Cách dùng

```bash
nb self update [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--channel` | string | Channel phát hành để cập nhật, mặc định `auto`; có thể chọn `auto`, `latest`, `test`, `beta`, `alpha` |
| `--yes`, `-y` | boolean | Bỏ qua xác nhận cập nhật |
| `--json` | boolean | Đầu ra dạng JSON |
| `--skills` | boolean | Đồng thời cập nhật các NocoBase AI coding skills được cài đặt toàn cục |
| `--verbose` | boolean | Hiển thị thông tin cập nhật chi tiết |

## Hành vi cập nhật

`nb self update` trước tiên phát hiện phương thức cài đặt hiện tại khi chạy. Lệnh này không dùng cache lịch sử `self-install-methods.json`.

Khi có bản cập nhật, lệnh sử dụng cùng package manager đang quản lý cài đặt CLI global hiện tại:

| Phương thức cài đặt | Lệnh cập nhật |
| --- | --- |
| `npm-global` | `npm install -g @nocobase/cli@<channel>` |
| `pnpm-global` | `pnpm add -g @nocobase/cli@<channel>` |
| `yarn-global` | `yarn global add @nocobase/cli@<channel>` |

Xác nhận tương tác mặc định là yes. Dùng `--yes` để bỏ qua prompt trong script.

## Ví dụ

```bash
nb self update
nb self update --yes
nb self update --skills
nb self update --channel alpha --json
```

## Lệnh liên quan

- [`nb self check`](./check.md)
- [`nb skills update`](../skills/update.md)
