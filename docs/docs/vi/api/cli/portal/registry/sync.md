---
title: "nb portal registry sync"
description: "Tài liệu nb portal registry sync: cài đặt, so sánh hoặc cập nhật các mục Registry do plugin cung cấp trong AI Portal."
keywords: "nb portal registry sync,NocoBase CLI,Portal Registry,shadcn,AI Portal"
---

# nb portal registry sync

Cài đặt các mục NocoBase Portal Registry vào workspace AI Portal đã có. Lệnh đọc chỉ mục Registry từ dịch vụ NocoBase được chọn, vì vậy các mục của plugin mới bật sẽ khả dụng mà không cần ghi cố định vào template Portal.

## Cách dùng

```bash
nb portal registry sync <portal> [mục...] [cờ]
```

## Đối số và cờ

| Đối số hoặc cờ | Kiểu | Mô tả |
| --- | --- | --- |
| `<portal>` | string | Tên hoặc slug AI Portal, bắt buộc |
| `[mục...]` | string[] | Tên mục Registry tùy chọn. Nếu bỏ qua, lệnh cài tất cả mục từ plugin đang bật. Hỗ trợ cả `ai` và `@nocobase/ai` |
| `--env`, `-e` | string | Tên env CLI; nếu bỏ qua sẽ dùng env hiện tại |
| `--yes`, `-y` | boolean | Bỏ qua xác nhận khi `--env` trỏ tới env khác |
| `--overwrite` | boolean | Thay thế các tệp Registry đã cài nhưng giữ nguyên các tệp hiện có trong `src/components/ui` |
| `--overwrite-ui` | boolean | Cho phép `--overwrite` thay thế cả `src/components/ui`; yêu cầu `--overwrite` |
| `--diff` | boolean | Hiển thị khác biệt mà không thay đổi Portal |
| `--build` | boolean | Chạy `pnpm build` và `pnpm build:html` sau khi cài đặt |

## Ví dụ

Cài đặt tất cả mục khả dụng chưa được cài:

```bash
nb portal registry sync customer
```

Cài đặt các mục được chọn:

```bash
nb portal registry sync customer ai acl auth-sms
```

So sánh mục đã cài với phiên bản trên dịch vụ:

```bash
nb portal registry sync customer ai --diff
```

Cập nhật mục nhưng giữ nguyên các component UI cơ sở:

```bash
nb portal registry sync customer ai --overwrite
```

Ghi đè tệp Registry và component UI cơ sở:

```bash
nb portal registry sync customer --overwrite --overwrite-ui
```

Cài đặt rồi build Portal:

```bash
nb portal registry sync customer --build
```

Dùng env khác trong quy trình không tương tác:

```bash
nb portal registry sync customer --env dev --yes
```

## Cách hoạt động

Trước tiên, lệnh yêu cầu chỉ mục Registry từ dịch vụ NocoBase được chọn. Máy chủ chỉ trả về các mục của plugin đang bật. Sau đó, Registry `@nocobase` được cấu hình trong `components.json` của Portal và các mục được cài bằng CLI shadcn cục bộ của Portal.

Theo mặc định, những mục có tệp đích đã tồn tại sẽ bị bỏ qua. Khi thêm mục và dependency còn thiếu, các tệp hiện có trong `src/extensions` và `src/components/ui` được bảo vệ.

Chỉ dùng `--overwrite` khi chủ động muốn làm mới các tệp Registry đã cài. Component UI cơ sở vẫn được bảo vệ trừ khi truyền thêm `--overwrite-ui`. Hãy kiểm tra các tùy chỉnh cục bộ trước khi ghi đè.

`--diff` chỉ đọc và không thể kết hợp với `--overwrite`, `--overwrite-ui` hoặc `--build`.

Nếu Portal chưa có `node_modules`, lệnh chạy `pnpm install --frozen-lockfile` trước khi gọi shadcn.

## Lệnh liên quan

- [`nb portal registry`](./index.md)
- [`nb portal create`](../create.md)
- [`nb portal dev`](../dev.md)
- [`nb portal deploy`](../deploy.md)
