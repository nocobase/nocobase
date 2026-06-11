---
pkg: '@nocobase/plugin-app-supervisor'
title: "Chế độ Multi-app Shared Memory"
description: "Chế độ shared memory: instance đơn nhiều ứng dụng, APP_DISCOVERY_ADAPTER=local, APP_PROCESS_ADAPTER=local, database/Schema độc lập, JWT secret, tên miền tùy chỉnh, truy cập /apps/:appName/admin."
keywords: "shared memory,chế độ local,APP_DISCOVERY_ADAPTER,APP_PROCESS_ADAPTER,sub-app,AppSupervisor,NocoBase"
---
# Chế độ Shared Memory

## Giới thiệu

Khi bạn muốn chia nghiệp vụ ở cấp ứng dụng nhưng không muốn đưa vào kiến trúc triển khai và vận hành phức tạp, có thể sử dụng chế độ multi-app shared memory.

Trong chế độ này, một instance NocoBase có thể chạy nhiều ứng dụng cùng lúc. Mỗi ứng dụng là độc lập, có thể kết nối với database độc lập, có thể tạo, khởi động và dừng riêng, nhưng chúng chia sẻ cùng một process và memory space, bạn vẫn chỉ cần duy trì một instance NocoBase.

## Hướng dẫn sử dụng

### Cấu hình biến môi trường

Trước khi sử dụng tính năng multi-app, hãy đảm bảo đã đặt các biến môi trường sau khi NocoBase khởi động:

```bash
APP_DISCOVERY_ADAPTER=local
APP_PROCESS_ADAPTER=local
```

### Tạo ứng dụng

Trong menu System Settings, click "AppSupervisor" để vào trang quản lý ứng dụng.

![](https://static-docs.nocobase.com/202512291056215.png)

Click nút "Thêm mới" để tạo một ứng dụng mới.

![](https://static-docs.nocobase.com/202512291057696.png)

#### Mô tả các mục cấu hình

| Mục cấu hình         | Mô tả                                                                                                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Tên ứng dụng**   | Tên hiển thị của ứng dụng trong giao diện                                                                                                                                                                                       |
| **Định danh ứng dụng**   | Định danh ứng dụng, duy nhất toàn cục                                                                                                                                                                                           |
| **Phương thức khởi động**   | - Khởi động khi truy cập lần đầu: Sub-app sẽ khởi động khi người dùng truy cập qua URL lần đầu<br>- Khởi động cùng ứng dụng chính: Khởi động sub-app khi ứng dụng chính khởi động (sẽ tăng thời gian khởi động ứng dụng chính)                                                                        |
| **Môi trường**       | Trong chế độ shared memory, chỉ có môi trường local khả dụng, tức `local`                                                                                                                                                               |
| **Kết nối database** | Dùng để cấu hình data source chính của ứng dụng, hỗ trợ ba phương thức sau:<br>- Database mới: Tái sử dụng dịch vụ database hiện tại, tạo database độc lập<br>- Kết nối dữ liệu mới: Kết nối với dịch vụ database khác<br>- Chế độ Schema: Khi data source chính hiện tại là PostgreSQL, tạo Schema độc lập cho ứng dụng |
| **Nâng cấp**       | Nếu trong database đã kết nối có dữ liệu ứng dụng NocoBase phiên bản thấp hơn, có cho phép tự động nâng cấp lên phiên bản ứng dụng hiện tại hay không                                                                                                                             |
| **JWT Secret**   | Tự động tạo JWT secret độc lập cho ứng dụng để đảm bảo session ứng dụng độc lập với ứng dụng chính và các ứng dụng khác                                                                                                                                            |
| **Tên miền tùy chỉnh** | Cấu hình tên miền truy cập độc lập cho ứng dụng                                                                                                                                                                                       |

### Khởi động ứng dụng

Click nút **Khởi động** để khởi động sub-app.

> Nếu khi tạo có tích chọn _"Khởi động khi truy cập lần đầu"_, sẽ tự động khởi động khi truy cập lần đầu.

![](https://static-docs.nocobase.com/202512291121065.png)

### Truy cập ứng dụng

Click nút **Truy cập**, sub-app sẽ được mở trong tab mới.

Mặc định sử dụng `/apps/:appName/admin/` để truy cập sub-app, ví dụ

```bash
http://localhost:13000/apps/a_7zkxoarusnx/admin/
```

Đồng thời, cũng có thể cấu hình tên miền độc lập cho sub-app, cần phải parse tên miền đến IP hiện tại, nếu sử dụng nginx, cũng cần thêm tên miền trong cấu hình nginx.

### Dừng ứng dụng

Click nút **Dừng** để dừng sub-app.

![](https://static-docs.nocobase.com/202512291122113.png)

### Trạng thái ứng dụng

Trong danh sách có thể xem trạng thái hiện tại của từng ứng dụng.

![](https://static-docs.nocobase.com/202512291122339.png)

### Xóa ứng dụng

Click nút **Xóa** để loại bỏ ứng dụng.

![](https://static-docs.nocobase.com/202512291122178.png)

## Câu hỏi thường gặp

### 1. Quản lý plugin

Các plugin mà các ứng dụng khác có thể sử dụng giống với ứng dụng chính (bao gồm phiên bản), nhưng có thể cấu hình và sử dụng plugin độc lập.

### 2. Cô lập database

Các ứng dụng khác có thể cấu hình database độc lập. Nếu muốn chia sẻ dữ liệu giữa các ứng dụng, có thể thực hiện qua data source bên ngoài.

### 3. Sao lưu và migrate dữ liệu

Hiện tại sao lưu dữ liệu trên ứng dụng chính không hỗ trợ chứa dữ liệu của các ứng dụng khác (chỉ chứa thông tin cơ bản của ứng dụng), cần sao lưu và migrate thủ công trong các ứng dụng khác.

### 4. Triển khai và cập nhật

Trong chế độ shared memory, phiên bản của các ứng dụng khác sẽ tự động nâng cấp theo ứng dụng chính, đảm bảo phiên bản ứng dụng nhất quán tự động.

### 5. Session ứng dụng

- Nếu ứng dụng sử dụng JWT secret độc lập, session ứng dụng sẽ độc lập với ứng dụng chính và các ứng dụng khác. Nếu truy cập các ứng dụng khác nhau qua sub-path của cùng một tên miền, do TOKEN ứng dụng được cache trong LocalStorage, khi chuyển đổi giữa các ứng dụng khác nhau cần đăng nhập lại. Khuyến nghị cấu hình tên miền độc lập cho các ứng dụng khác nhau để cô lập session tốt hơn.
- Nếu ứng dụng không sử dụng JWT secret độc lập, sẽ chia sẻ session với ứng dụng chính. Sau khi truy cập các ứng dụng khác trong cùng một trình duyệt rồi quay lại ứng dụng chính, không cần đăng nhập lại. Nhưng có nguy cơ bảo mật, nếu ID người dùng của các ứng dụng khác nhau bị trùng, có thể dẫn đến người dùng truy cập trái phép dữ liệu của các ứng dụng khác.
