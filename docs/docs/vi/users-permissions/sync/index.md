---
pkg: '@nocobase/plugin-user-data-sync'
title: "Đồng bộ dữ liệu người dùng NocoBase"
description: "Đồng bộ dữ liệu người dùng NocoBase: đăng ký nguồn đồng bộ, HTTP API, WeCom, đồng bộ bảng người dùng và phòng ban, mở rộng nguồn dữ liệu thông qua plugin."
keywords: "Đồng bộ dữ liệu người dùng,đồng bộ dữ liệu,HTTP API,WeCom,nguồn đồng bộ,plugin-user-data-sync,NocoBase"
---

# Đồng bộ dữ liệu người dùng

## Giới thiệu

Đăng ký và quản lý các nguồn đồng bộ dữ liệu người dùng. Mặc định cung cấp HTTP API, có thể mở rộng các nguồn dữ liệu khác thông qua plugin. Mặc định hỗ trợ đồng bộ dữ liệu vào bảng **người dùng** và **phòng ban**, cũng có thể mở rộng các tài nguyên đích đồng bộ khác thông qua plugin.

## Quản lý nguồn dữ liệu và đồng bộ dữ liệu

![](https://static-docs.nocobase.com/202412041043465.png)

:::info
Khi chưa cài đặt plugin cung cấp nguồn đồng bộ dữ liệu người dùng, bạn có thể sử dụng HTTP API để đồng bộ dữ liệu người dùng. Tham khảo [Nguồn dữ liệu - HTTP API](./sources/api.md).
:::

## Thêm nguồn dữ liệu

Sau khi cài đặt plugin cung cấp nguồn đồng bộ dữ liệu người dùng, bạn có thể thêm nguồn dữ liệu tương ứng. Chỉ những nguồn dữ liệu được kích hoạt mới hiển thị nút đồng bộ và nhiệm vụ.

> Lấy WeCom làm ví dụ

![](https://static-docs.nocobase.com/202412041053785.png)

## Đồng bộ dữ liệu

Click nút "Đồng bộ" để bắt đầu đồng bộ dữ liệu.

![](https://static-docs.nocobase.com/202412041055022.png)

Click nút "Nhiệm vụ" để xem trạng thái đồng bộ. Sau khi đồng bộ thành công, bạn có thể vào danh sách người dùng và phòng ban để xem dữ liệu.

![](https://static-docs.nocobase.com/202412041202337.png)

Đối với các nhiệm vụ đồng bộ thất bại, bạn có thể click "Thử lại".

![](https://static-docs.nocobase.com/202412041058337.png)

Khi đồng bộ thất bại, bạn có thể thông qua log hệ thống để tìm nguyên nhân. Đồng thời, các bản ghi đồng bộ dữ liệu gốc được lưu trong thư mục `user-data-sync` dưới thư mục log của ứng dụng.

![](https://static-docs.nocobase.com/202412041205655.png)
