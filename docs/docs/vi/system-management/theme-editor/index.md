---
title: "Theme Editor"
description: "Theme Editor: tùy chỉnh SeedToken/MapToken/AliasToken dựa trên Ant Design 5.x, hỗ trợ chế độ dark/compact, thêm/sửa/xóa theme, đặt theme mặc định và theme người dùng có thể chọn."
keywords: "Theme Editor,Ant Design theme,dark mode,compact mode,SeedToken,MapToken,AliasToken,theme tùy chỉnh,Quản lý hệ thống,NocoBase"
---

# Theme Editor

> Tính năng theme hiện tại được triển khai dựa trên Ant Design phiên bản 5.x. Khuyến nghị tìm hiểu các khái niệm liên quan đến [Tùy chỉnh theme](https://ant.design/docs/react/customize-theme-cn#%E8%87%AA%E5%AE%9A%E4%B9%89%E4%B8%BB%E9%A2%98) trước khi đọc tài liệu này.

## Giới thiệu

Plugin Theme Editor dùng để chỉnh sửa style của toàn bộ trang frontend. Hiện tại hỗ trợ chỉnh sửa [SeedToken](https://ant.design/docs/react/customize-theme-cn#seedtoken), [MapToken](https://ant.design/docs/react/customize-theme-cn#maptoken), [AliasToken](https://ant.design/docs/react/customize-theme-cn#aliastoken) ở phạm vi toàn cục, và hỗ trợ [chuyển đổi](https://ant.design/docs/react/customize-theme-cn#%E4%BD%BF%E7%94%A8%E9%A2%84%E8%AE%BE%E7%AE%97%E6%B3%95) sang `dark mode` và `compact mode`. Sau này có thể hỗ trợ tùy chỉnh theme ở [cấp component](https://ant.design/docs/react/customize-theme-cn#%E4%BF%AE%E6%94%B9%E7%BB%84%E4%BB%B6%E5%8F%98%E9%87%8F-component-token).

## Hướng dẫn sử dụng

### Kích hoạt plugin theme

Trước tiên cập nhật NocoBase lên phiên bản mới nhất (v0.11.1 trở lên), sau đó tìm card `Theme Editor` trong trang quản lý plugin, click nút `Kích hoạt` ở góc dưới bên phải card, đợi trang refresh.

![20240409132838](https://static-docs.nocobase.com/20240409132838.png)

### Vào trang cấu hình theme

Sau khi kích hoạt plugin, click nút cài đặt ở góc dưới bên trái card để chuyển đến trang chỉnh sửa theme. Mặc định cung cấp bốn tùy chọn theme: `Theme mặc định`, `Theme tối`, `Theme compact` và `Theme compact tối`.

![20240409133020](https://static-docs.nocobase.com/20240409133020.png)

### Thêm theme mới

Click nút `Thêm theme mới`, chọn `Thêm một theme hoàn toàn mới`, theme editor sẽ xuất hiện ở phía bên phải trang, hỗ trợ chỉnh sửa các tùy chọn `Màu sắc`, `Kích thước`, `Phong cách`, v.v. Sau khi chỉnh sửa xong, nhập tên theme và click lưu để hoàn tất việc thêm theme.

![20240409133147](https://static-docs.nocobase.com/20240409133147.png)

### Áp dụng theme mới

Đưa chuột đến góc trên bên phải trang, có thể thấy mục chuyển đổi theme, click để chuyển sang theme khác, ví dụ theme vừa thêm.

![20240409133247](https://static-docs.nocobase.com/20240409133247.png)

### Chỉnh sửa theme đã có

Click nút `Chỉnh sửa` ở góc dưới bên trái card, theme editor sẽ xuất hiện ở phía bên phải trang (giống với thêm theme mới), sau khi chỉnh sửa xong click lưu để hoàn tất chỉnh sửa theme.

![20240409134413](https://static-docs.nocobase.com/20240409134413.png)

### Đặt theme người dùng có thể chọn

Theme mới được thêm mặc định cho phép người dùng chuyển đổi. Nếu không muốn cho người dùng chuyển sang một theme nào đó, có thể tắt công tắc `Có thể được người dùng chọn` ở góc dưới bên phải card theme, người dùng sẽ không thể chuyển sang theme đó.

![20240409133331](https://static-docs.nocobase.com/20240409133331.png)

### Đặt làm theme mặc định

Ở trạng thái ban đầu, theme mặc định là `Theme mặc định`. Nếu cần đặt một theme nào đó làm theme mặc định, có thể bật công tắc `Theme mặc định` ở góc dưới bên phải card theme, người dùng sẽ thấy theme này khi mở trang lần đầu. Lưu ý: theme mặc định không thể xóa.

![20240409133409](https://static-docs.nocobase.com/20240409133409.png)

### Xóa theme

Click nút `Xóa` ở phía dưới card, click xác nhận trong popup xác nhận để xóa theme.

![20240409133435](https://static-docs.nocobase.com/20240409133435.png)
