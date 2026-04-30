---
pkg: '@nocobase/plugin-verification'
title: "Kiểm tra: SMS"
description: "SMS code: loại kiểm tra SMS OTP, hỗ trợ nhà cung cấp SMS Aliyun, Tencent Cloud, người dùng gắn số điện thoại, cấu hình quản trị viên, quy trình hủy gắn."
keywords: "SMS code,SMS OTP,Aliyun SMS,Tencent SMS,gắn số điện thoại,NocoBase"
---

# Kiểm tra: SMS

## Giới thiệu

SMS code là loại kiểm tra tích hợp sẵn, dùng để sinh One-Time Password (OTP) và gửi đến người dùng qua SMS.

## Thêm SMS verifier

Vào trang quản lý kiểm tra.

![](https://static-docs.nocobase.com/202502271726791.png)

Thêm - SMS OTP

![](https://static-docs.nocobase.com/202502271726056.png)

## Cấu hình quản trị viên

![](https://static-docs.nocobase.com/202502271727711.png)

Các nhà cung cấp SMS hiện được hỗ trợ:

- <a href="https://www.aliyun.com/product/sms" target="_blank">Aliyun SMS</a>
- <a href="https://cloud.tencent.com/product/sms" target="_blank">Tencent Cloud SMS</a>

Khi cấu hình mẫu SMS trong console của nhà cung cấp, bạn cần để trống tham số cho SMS code.

- Ví dụ cấu hình Aliyun: `Mã xác minh của bạn là: ${code}`

- Ví dụ cấu hình Tencent: `Mã xác minh của bạn là: {1}`

Bạn cũng có thể mở rộng các nhà cung cấp SMS khác dưới dạng plugin. Tham khảo: [Mở rộng nhà cung cấp SMS](./dev/sms-type)

## Người dùng gắn

Sau khi thêm verifier, người dùng có thể gắn số điện thoại kiểm tra trong phần quản lý kiểm tra cá nhân.

![](https://static-docs.nocobase.com/202502271737016.png)

![](https://static-docs.nocobase.com/202502271737769.png)

![](https://static-docs.nocobase.com/202502271738515.png)

Sau khi gắn thành công, có thể kiểm tra danh tính trong các kịch bản kiểm tra đã gắn verifier này.

![](https://static-docs.nocobase.com/202502271739607.png)

## Người dùng hủy gắn

Hủy gắn số điện thoại cần kiểm tra qua phương thức kiểm tra đã gắn.

![](https://static-docs.nocobase.com/202502282103205.png)
