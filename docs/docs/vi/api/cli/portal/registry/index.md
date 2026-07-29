---
title: "nb portal registry"
description: "Tài liệu nb portal registry: quản lý các mục Portal Registry do plugin cung cấp trong workspace AI Portal."
keywords: "nb portal registry,NocoBase CLI,Portal Registry,shadcn,AI Portal"
---

# nb portal registry

Quản lý các mục NocoBase Portal Registry trong workspace AI Portal. Những plugin đã bật trên máy chủ có thể cung cấp các tích hợp frontend tái sử dụng như component, hook, adapter và trang demo. Các lệnh Registry cài đặt những tích hợp này vào mã nguồn Portal.

## Cách dùng

```bash
nb portal registry <lệnh>
```

## Lệnh con

| Lệnh | Mô tả |
| --- | --- |
| [`nb portal registry sync`](./sync.md) | Cài đặt hoặc cập nhật các mục Registry do plugin NocoBase đang bật cung cấp |

## Yêu cầu

- Workspace Portal phải tồn tại và có `package.json` cùng `components.json`.
- Env NocoBase được chọn phải cung cấp API Portal Registry.
- Chỉ các mục Registry từ plugin đang bật mới khả dụng.

## Ví dụ

Cài đặt tất cả mục Registry khả dụng vào Portal `customer`:

```bash
nb portal registry sync customer
```

Chỉ cài đặt các mục được chọn:

```bash
nb portal registry sync customer ai acl auth-sms
```

## Lệnh liên quan

- [`nb portal create`](../create.md)
- [`nb portal dev`](../dev.md)
- [`nb portal deploy`](../deploy.md)
