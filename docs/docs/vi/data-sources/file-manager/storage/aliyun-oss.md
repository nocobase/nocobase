---
title: "Aliyun OSS"
description: "Cấu hình Aliyun OSS storage engine: Bucket, Endpoint, AccessKey, hỗ trợ truy cập public và intranet."
keywords: "Aliyun OSS,Aliyun Object Storage,OSS Storage,Cloud storage,NocoBase"
---

# Aliyun OSS

Storage engine dựa trên Aliyun OSS, trước khi sử dụng cần chuẩn bị tài khoản và quyền liên quan.

## Tham số cấu hình

![Ví dụ cấu hình Aliyun OSS Storage Engine](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Mẹo}
Chỉ giới thiệu các tham số chuyên dụng của Aliyun OSS storage engine, các tham số chung vui lòng tham khảo [Tham số chung của engine](./index.md#tham-số-chung-của-engine).
:::

### Region

Điền region của OSS storage, ví dụ: `oss-cn-hangzhou`.

:::info{title=Mẹo}
Bạn có thể xem thông tin region của storage space tại [Aliyun OSS Console](https://oss.console.aliyun.com/), và chỉ cần lấy phần tiền tố region (không cần domain đầy đủ).
:::

### AccessKey ID

Điền ID của Access Key ủy quyền truy cập Aliyun.

### AccessKey Secret

Điền Secret của Access Key ủy quyền truy cập Aliyun.

### Bucket

Điền tên bucket của OSS storage.
