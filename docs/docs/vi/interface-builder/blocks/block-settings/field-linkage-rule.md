---
title: "Quy tắc liên kết Field"
description: "Cấu hình Block: cài đặt Quy tắc liên kết Field, thực hiện liên kết dữ liệu giữa các Field, hiển thị/ẩn, liên kết tùy chọn."
keywords: "Quy tắc liên kết Field,liên kết Field,liên kết tùy chọn,cấu hình Block,Interface Builder,NocoBase"
---

# Quy tắc liên kết Field

## Giới thiệu

Quy tắc liên kết Field cho phép điều chỉnh động trạng thái Field của Block Form/Chi tiết theo hành vi của bạn, hiện các Block hỗ trợ Quy tắc liên kết Field bao gồm:

- [Block Form](/interface-builder/blocks/data-blocks/form)
- [Block Chi tiết](/interface-builder/blocks/data-blocks/details)
- [Sub-Form](/interface-builder/fields/specific/sub-form)

## Hướng dẫn sử dụng

### **Block Form**

Trong Block Form, Quy tắc liên kết có thể điều chỉnh động hành vi Field theo điều kiện cụ thể:

- **Kiểm soát hiển thị/ẩn Field**: Quyết định Field hiện tại có hiển thị hay không dựa trên giá trị của các Field khác.
- **Cài đặt Field bắt buộc hay không**: Trong điều kiện cụ thể, cài đặt động Field thành bắt buộc hoặc không bắt buộc.
- **Gán giá trị**: Tự động gán giá trị cho Field theo điều kiện.
- **Thực thi javaScript chỉ định**: Viết javaScript theo nhu cầu nghiệp vụ.

### **Block Chi tiết**

Trong Block Chi tiết, Quy tắc liên kết chủ yếu được dùng để kiểm soát động hiển thị và ẩn Field trên Block Chi tiết.

![20251029114859](https://static-docs.nocobase.com/20251029114859.png)

## Liên kết thuộc tính

### Gán giá trị

Ví dụ: Khi đơn hàng được đánh dấu là đơn bổ sung, trạng thái đơn hàng tự động gán giá trị thành "Chờ phê duyệt".

![20251029115348](https://static-docs.nocobase.com/20251029115348.png)

### Bắt buộc

Ví dụ: Khi trạng thái đơn hàng là "Đã thanh toán", số tiền đơn hàng bắt buộc.

![20251029115031](https://static-docs.nocobase.com/20251029115031.png)

### Hiển thị/Ẩn

Ví dụ: Chỉ khi trạng thái đơn hàng là "Chờ thanh toán" mới hiển thị tài khoản thanh toán và tổng số tiền.

![20251030223710](https://static-docs.nocobase.com/20251030223710.png)

![20251030223801](https://static-docs.nocobase.com/20251030223801.gif)
