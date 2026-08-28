---
title: "OSS Alibaba Cloud"
description: "Cấu hình công cụ lưu trữ OSS Alibaba Cloud: Bucket, Endpoint, AccessKey, hỗ trợ truy cập qua mạng công cộng và mạng nội bộ."
keywords: "OSS Alibaba Cloud,Lưu trữ đối tượng Alibaba Cloud,Lưu trữ OSS,Lưu trữ đám mây,NocoBase"
---

# OSS Alibaba Cloud

Công cụ lưu trữ dựa trên OSS Alibaba Cloud, cần chuẩn bị tài khoản và quyền liên quan trước khi sử dụng.

## Các tham số cấu hình

![Ví dụ cấu hình công cụ lưu trữ OSS Alibaba Cloud](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Gợi ý}
Chỉ giới thiệu các tham số chuyên dụng của công cụ lưu trữ OSS Alibaba Cloud. Để biết các tham số chung, vui lòng tham khảo[tham số chung của công cụ](./index.md#引擎通用参数).
:::

### Khu vực

Nhập khu vực lưu trữ OSS, ví dụ: `oss-cn-hangzhou`.

:::info{title=Gợi ý}
Bạn có thể xem thông tin khu vực của không gian lưu trữ trong[trang quản trị OSS Alibaba Cloud](https://oss.console.aliyun.com/). Chỉ cần lấy phần tiền tố của khu vực (không cần tên miền đầy đủ).
:::

### AccessKey ID

Nhập ID của khóa truy cập được Alibaba Cloud cấp quyền.

### AccessKey Secret

Nhập Secret của khóa truy cập được Alibaba Cloud cấp quyền.

### Bucket

Nhập tên Bucket của bộ nhớ lưu trữ OSS.
