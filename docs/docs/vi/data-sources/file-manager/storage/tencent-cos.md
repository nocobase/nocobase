---
title: "腾讯云 COS"
description: "腾讯云 COS 存储引擎配置：Bucket、Region、SecretId，对象存储文件上传。"
keywords: "腾讯云 COS,腾讯云对象存储,COS 存储,云存储,NocoBase"
---

# 腾讯云 COS

Dựa trên công cụ lưu trữ腾讯云 COS, bạn cần chuẩn bị tài khoản và quyền liên quan trước khi sử dụng.

## Các tham số cấu hình

![Ví dụ cấu hình công cụ lưu trữ 腾讯 COS](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=提示}
Chỉ giới thiệu các tham số riêng của công cụ lưu trữ腾讯云 COS; để biết các tham số chung, vui lòng tham khảo [Các tham số chung của công cụ](./index.md#引擎通用参数).
:::

### Khu vực

Nhập khu vực lưu trữ COS, ví dụ: `ap-chengdu`.

:::info{title=提示}
Bạn có thể xem thông tin khu vực của không gian lưu trữ trong [bảng điều khiển腾讯云 COS](https://console.cloud.tencent.com/cos); chỉ cần trích xuất phần tiền tố của khu vực (không cần tên miền đầy đủ).
:::

### SecretId

Nhập ID của khóa truy cập được腾讯云 cấp quyền.

### SecretKey

Nhập Secret của khóa truy cập được腾讯云 cấp quyền.

### Buckеt lưu trữ

Nhập tên bucket của bộ nhớ COS, ví dụ: `qing-cdn-1234189398`.