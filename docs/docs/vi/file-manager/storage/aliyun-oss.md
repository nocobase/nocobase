---
pkg: '@nocobase/plugin-file-manager'
title: "Storage engine: Aliyun OSS"
description: "Cấu hình storage engine Aliyun OSS tích hợp sẵn của NocoBase: Region, AccessKey, Bucket, timeout, dùng cho Aliyun Object Storage."
keywords: "Aliyun OSS,Aliyun,AccessKey,Bucket,Object Storage,Cấu hình OSS,NocoBase"
---

# Storage engine: Aliyun OSS

Storage engine dựa trên Aliyun OSS, cần chuẩn bị tài khoản và quyền liên quan trước khi sử dụng.

## Tham số cấu hình

![Ví dụ cấu hình storage engine Aliyun OSS](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Mẹo}
Chỉ giới thiệu các tham số dành riêng cho storage engine Aliyun OSS. Đối với các tham số chung, vui lòng tham khảo [Tham số chung của engine](./index#tham-số-chung).
:::

### Region

Điền Region của OSS, ví dụ: `oss-cn-hangzhou`.

:::info{title=Mẹo}
Có thể xem thông tin Region của Bucket tại [Aliyun OSS Console](https://oss.console.aliyun.com/), chỉ cần lấy phần tiền tố Region (không cần tên miền đầy đủ).
:::

### AccessKey ID

Điền ID của khóa truy cập được ủy quyền của Aliyun.

### AccessKey Secret

Điền Secret của khóa truy cập được ủy quyền của Aliyun.

### Bucket

Điền tên Bucket của OSS.

### Timeout

Điền thời gian timeout khi upload lên Aliyun OSS, đơn vị mili giây, mặc định là `60000` ms (tức 60 giây).
