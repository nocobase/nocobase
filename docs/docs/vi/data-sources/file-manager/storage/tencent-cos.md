---
title: "Tencent COS"
description: "Cấu hình Tencent COS storage engine: Bucket, Region, SecretId, upload file đối tượng."
keywords: "Tencent COS,Tencent Cloud Object Storage,COS Storage,Cloud storage,NocoBase"
---

# Tencent COS

Storage engine dựa trên Tencent COS, trước khi sử dụng cần chuẩn bị tài khoản và quyền liên quan.

## Tham số cấu hình

![Ví dụ cấu hình Tencent COS Storage Engine](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Mẹo}
Chỉ giới thiệu các tham số chuyên dụng của Tencent COS storage engine, các tham số chung vui lòng tham khảo [Tham số chung của engine](./index.md#tham-số-chung-của-engine).
:::

### Region

Điền region của COS storage, ví dụ: `ap-chengdu`.

:::info{title=Mẹo}
Bạn có thể xem thông tin region của storage space tại [Tencent Cloud COS Console](https://console.cloud.tencent.com/cos), và chỉ cần lấy phần tiền tố region (không cần domain đầy đủ).
:::

### SecretId

Điền ID của Access Key ủy quyền truy cập Tencent Cloud.

### SecretKey

Điền Secret của Access Key ủy quyền truy cập Tencent Cloud.

### Bucket

Điền tên bucket của COS storage, ví dụ: `qing-cdn-1234189398`.
