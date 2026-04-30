---
pkg: '@nocobase/plugin-file-manager'
title: "Storage engine: Tencent COS"
description: "Cấu hình storage engine Tencent COS tích hợp sẵn của NocoBase: Region, SecretId, SecretKey, Bucket, dùng cho Tencent Cloud Object Storage."
keywords: "Tencent COS,Tencent Cloud,SecretId,SecretKey,Bucket,Object Storage,NocoBase"
---

# Tencent COS

Storage engine dựa trên Tencent COS, cần chuẩn bị tài khoản và quyền liên quan trước khi sử dụng.

## Tham số cấu hình

![Ví dụ cấu hình storage engine Tencent COS](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Mẹo}
Chỉ giới thiệu các tham số dành riêng cho storage engine Tencent COS. Đối với các tham số chung, vui lòng tham khảo [Tham số chung của engine](./index.md#tham-số-chung).
:::

### Region

Điền Region của COS, ví dụ: `ap-chengdu`.

:::info{title=Mẹo}
Có thể xem thông tin Region của Bucket lưu trữ tại [Tencent Cloud COS Console](https://console.cloud.tencent.com/cos), chỉ cần lấy phần tiền tố Region (không cần tên miền đầy đủ).
:::

### SecretId

Điền ID của khóa truy cập được ủy quyền của Tencent Cloud.

### SecretKey

Điền Secret của khóa truy cập được ủy quyền của Tencent Cloud.

### Bucket

Điền tên Bucket của COS, ví dụ: `qing-cdn-1234189398`.
