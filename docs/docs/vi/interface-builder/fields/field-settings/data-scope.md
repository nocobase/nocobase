---
title: "Phạm vi dữ liệu Field"
description: "Cấu hình Field: cài đặt phạm vi dữ liệu của Field liên kết, lọc dữ liệu có thể chọn, hỗ trợ lọc theo quyền."
keywords: "phạm vi dữ liệu,data scope,bộ lọc liên kết,cấu hình Field,Interface Builder,NocoBase"
---

# Cài đặt phạm vi dữ liệu

## Giới thiệu

Cài đặt phạm vi dữ liệu của Field quan hệ tương tự như cài đặt phạm vi dữ liệu của Block, đặt điều kiện lọc mặc định cho dữ liệu quan hệ.

## Hướng dẫn sử dụng

![20251028211328](https://static-docs.nocobase.com/20251028211328.png)

### Giá trị tĩnh

Ví dụ: chỉ có thể chọn liên kết với sản phẩm chưa bị xóa.

> Danh sách Field là các Field của Table mục tiêu Field quan hệ

![20251028211434](https://static-docs.nocobase.com/20251028211434.png)

### Giá trị biến

Ví dụ: chỉ có thể chọn liên kết với sản phẩm có ngày dịch vụ muộn hơn ngày đơn hàng.

![20251028211727](https://static-docs.nocobase.com/20251028211727.png)

Xem thêm về biến tại [Biến](/interface-builder/variables)

### Liên kết Field quan hệ

Các Field quan hệ liên kết với nhau bằng cách cài đặt phạm vi dữ liệu.

Ví dụ: Trong Table đơn hàng có Field quan hệ một-nhiều "Sản phẩm cơ hội" và Field quan hệ nhiều-một "Cơ hội", Sản phẩm cơ hội có Field quan hệ nhiều-một "Cơ hội", trong Block Form đơn hàng, dữ liệu có thể chọn của sản phẩm cơ hội là sản phẩm cơ hội liên kết với cơ hội đã chọn trong Form hiện tại.

![20251028212943](https://static-docs.nocobase.com/20251028212943.png)

![20240422154145](https://static-docs.nocobase.com/20240422154145.png)

![20251028213408](https://static-docs.nocobase.com/20251028213408.gif)
