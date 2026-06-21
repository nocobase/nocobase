---
title: "Quy tắc liên kết Action"
description: "Cấu hình Action: cài đặt Quy tắc liên kết của Action, kiểm soát hiển thị/ẩn, vô hiệu hóa/kích hoạt Action."
keywords: "Quy tắc liên kết Action,Quy tắc liên kết,hiển thị Action,cấu hình Action,Interface Builder,NocoBase"
---

# Quy tắc liên kết của Action

## Giới thiệu

Quy tắc liên kết Action cho phép bạn kiểm soát động trạng thái Action (như hiển thị, kích hoạt, ẩn, vô hiệu hóa, v.v.) theo điều kiện cụ thể. Bằng cách cấu hình các quy tắc này, bạn có thể thực hiện liên kết hành vi nút Action với bản ghi hiện tại, vai trò người dùng hoặc dữ liệu ngữ cảnh.

![20251029150224](https://static-docs.nocobase.com/20251029150224.png)

## Hướng dẫn sử dụng

Khi đáp ứng điều kiện (không có điều kiện mặc định là pass), kích hoạt thực thi cài đặt thuộc tính/thực thi JavaScript, hỗ trợ sử dụng hằng số/biến trong điều kiện đánh giá.

![20251030224601](https://static-docs.nocobase.com/20251030224601.png)

Hỗ trợ sửa đổi thuộc tính nút bấm.

![20251029150452](https://static-docs.nocobase.com/20251029150452.png)

## Hằng số

Ví dụ: Đơn hàng đã thanh toán không cho phép chỉnh sửa.

![20251029150638](https://static-docs.nocobase.com/20251029150638.png)

## Biến

### Biến hệ thống

![20251029150014](https://static-docs.nocobase.com/20251029150014.png)

Ví dụ 1: Kiểm soát hiển thị nút bấm theo loại thiết bị hiện tại.

![20251029151057](https://static-docs.nocobase.com/20251029151057.png)

Ví dụ 2: Nút Cập nhật hàng loạt trên đầu Table của Block đơn hàng chỉ giới hạn cho vai trò admin sử dụng, các vai trò khác không thể thực hiện Action này.

![20251029151209](https://static-docs.nocobase.com/20251029151209.png)

### Biến ngữ cảnh

Ví dụ: Nút Thêm trên cơ hội đơn hàng (Block quan hệ) chỉ kích hoạt khi trạng thái đơn hàng là "Chờ thanh toán" và "Bản nháp", trong các trạng thái khác nút sẽ bị vô hiệu hóa.

![20251029151520](https://static-docs.nocobase.com/20251029151520.png)

![20251029152200](https://static-docs.nocobase.com/20251029152200.png)

Xem thêm về biến tại [Biến](/interface-builder/variables).
