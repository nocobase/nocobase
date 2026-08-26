---
pkg: '@nocobase/plugin-acl'
title: "Cấu hình quyền NocoBase"
description: "Cấu hình quyền NocoBase: cấu hình giao diện, cài đặt plugin, cấu hình quyền plugin, kế thừa quyền, quyền thao tác tài nguyên, quy tắc allow/deny."
keywords: "Cấu hình quyền,ACL,quyền tài nguyên,kế thừa quyền,allow,deny,NocoBase"
---

# Cấu hình quyền

## Cấu hình quyền chung

![](https://static-docs.nocobase.com/119a9650259f9be71210121d0d3a435d.png)

### Cấu hình quyền

1. Cho phép cấu hình giao diện: Quyền này điều khiển việc người dùng có được phép cấu hình giao diện hay không. Sau khi kích hoạt quyền này, nút cấu hình UI sẽ xuất hiện. Vai trò "admin" mặc định đã kích hoạt quyền này.
2. Cho phép cài đặt, kích hoạt, vô hiệu hóa plugin: Quyền này điều khiển việc người dùng có được phép kích hoạt hoặc vô hiệu hóa plugin hay không. Sau khi kích hoạt quyền này, người dùng có thể truy cập giao diện trình quản lý plugin. Vai trò "admin" mặc định đã kích hoạt quyền này.
3. Cho phép cấu hình plugin: Quyền này điều khiển việc người dùng có được phép cấu hình tham số plugin hoặc quản lý dữ liệu backend của plugin hay không. Vai trò "admin" mặc định đã kích hoạt quyền này.
4. Cho phép xóa cache, khởi động lại ứng dụng: Quyền này điều khiển quyền vận hành hệ thống của người dùng: xóa cache và khởi động lại ứng dụng. Sau khi kích hoạt, các nút thao tác liên quan sẽ xuất hiện trong trung tâm cá nhân, mặc định không kích hoạt.
5. Mục menu mới mặc định cho phép truy cập: Mặc định menu mới tạo cho phép truy cập, mặc định bật.

### Quyền thao tác toàn cục

Quyền thao tác toàn cục có hiệu lực trên toàn cục (tất cả các bảng dữ liệu) được phân chia theo loại thao tác, hỗ trợ cấu hình theo chiều phạm vi dữ liệu: tất cả dữ liệu và dữ liệu của riêng bạn. Cái trước cho phép thực hiện thao tác trên toàn bộ bảng dữ liệu, trong khi cái sau giới hạn chỉ có thể xử lý dữ liệu liên quan đến chính mình.

## Quyền thao tác bảng dữ liệu

![](https://static-docs.nocobase.com/6a6e0281391cecdea5b5218e6173c5d7.png)

![](https://static-docs.nocobase.com/9814140434ff9e1bf028a6c282a5a165.png)

Quyền thao tác bảng dữ liệu chi tiết hơn so với quyền thao tác toàn cục, có thể cấu hình quyền truy cập tài nguyên riêng biệt cho từng bảng dữ liệu. Các quyền này được chia thành hai khía cạnh:

1. Quyền thao tác: Quyền thao tác bao gồm thêm, xem, chỉnh sửa, xóa, xuất và nhập. Các quyền này được cấu hình theo chiều phạm vi dữ liệu:
   - Tất cả dữ liệu: Cho phép người dùng thực hiện thao tác trên tất cả các bản ghi trong bảng dữ liệu.
   - Dữ liệu của riêng bạn: Giới hạn người dùng chỉ thực hiện thao tác trên các bản ghi dữ liệu do chính họ tạo ra.

2. Quyền field: Quyền field cho phép cấu hình quyền cho từng field trong các thao tác khác nhau. Ví dụ, một số field có thể được cấu hình chỉ cho phép xem mà không cho phép chỉnh sửa.

## Quyền truy cập menu

Quyền truy cập menu điều khiển quyền truy cập theo chiều menu

![](https://static-docs.nocobase.com/28eddfc843d27641162d9129e3b6e33f.png)

## Quyền cấu hình plugin

Quyền cấu hình plugin được dùng để điều khiển quyền cấu hình tham số của plugin cụ thể. Khi quyền cấu hình plugin được tích chọn, giao diện quản lý plugin tương ứng sẽ xuất hiện trong trung tâm quản lý.

![](https://static-docs.nocobase.com/5a742ae20a9de93dc2722468b9fd7475.png)
