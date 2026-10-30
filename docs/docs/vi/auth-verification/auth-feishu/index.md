---
pkg: '@nocobase/plugin-feishu'
title: "Xác thực: Feishu / Lark"
description: "Đăng nhập Feishu NocoBase: hỗ trợ đăng nhập bằng tài khoản Feishu / Lark qua OAuth, tự động đăng ký và đăng nhập tự động, cấu hình App ID, App Secret, URL chuyển hướng."
keywords: "Feishu,Lark,đăng nhập Feishu,OAuth,App ID,URL chuyển hướng,đăng nhập tự động,NocoBase"
---

# Xác thực: Feishu / Lark

## Giới thiệu

Plugin **Feishu / Lark** cho phép người dùng đăng nhập NocoBase bằng tài khoản Feishu hoặc Lark, tùy chọn đăng nhập tự động không cần xác nhận.

## Kích hoạt plugin

Feishu / Lark là plugin thương mại. Cài đặt và kích hoạt trong trình quản lý plugin, cùng với plugin **Xác thực người dùng**.

## Tạo ứng dụng trên nền tảng mở

Truy cập [nền tảng mở Feishu](https://open.feishu.cn/) và tạo **ứng dụng tự xây của doanh nghiệp** (với Lark dùng [nền tảng mở Lark](https://open.larksuite.com/)). Ghi lại **App ID** và **App Secret**.

Đăng nhập không cần thêm quyền API nào. Để đồng bộ danh bạ, xem [Đồng bộ dữ liệu người dùng từ Feishu](/users-permissions/sync/sources/feishu).

## Cấu hình URL chuyển hướng

Trong **Cài đặt bảo mật** → **URL chuyển hướng** của ứng dụng, thêm URL callback do NocoBase hiển thị:

```
https://ten-mien-cua-ban/api/feishu:redirect
```

Cách đơn giản nhất là copy **URL chuyển hướng** hiển thị trên trang cấu hình authenticator trong NocoBase.

:::warning
Khi NocoBase được triển khai dưới đường dẫn con (ví dụ `APP_PUBLIC_PATH=/nocobase/`), URL callback sẽ có tiền tố, ví dụ `https://ten-mien-cua-ban/nocobase/api/feishu:redirect`. URL trong danh sách cho phép trên nền tảng phải trùng khớp tuyệt đối với URL thực tế.
:::

## Thêm xác thực Feishu trong NocoBase

Vào trang **Xác thực người dùng**, thêm authenticator **Feishu / Lark**:

| Trường | Mô tả |
| --- | --- |
| Tự động đăng ký | Tự động tạo tài khoản khi đăng nhập lần đầu. Bật mặc định. |
| Khu vực | `Feishu China` hoặc `Lark Global`. |
| App ID / App Secret | Thông tin xác thực của ứng dụng Feishu. Hỗ trợ biến môi trường và secret. |
| Origin | Địa chỉ công khai của site, ví dụ `https://example.com`. Chỉ giao thức và tên miền, không kèm đường dẫn (gạch chéo cuối tùy ý); để trống thì dùng địa chỉ yêu cầu hiện tại. |
| Trường định danh duy nhất | Khóa định danh người dùng, xem bên dưới. |
| Đăng nhập tự động | Đăng nhập im lặng khi mở ứng dụng trong Feishu, xem bên dưới. |

## Chọn trường định danh duy nhất

| Trường | Mô tả |
| --- | --- |
| `union_id` | Khuyến nghị. Ổn định và dùng chung cho mọi ứng dụng của cùng tài khoản nhà phát triển. |
| `open_id` | Riêng từng ứng dụng; thay đổi khi đổi ứng dụng. |
| `user_id` | Duy nhất trong tenant; có thể xung đột trong môi trường nhiều tenant. |
| `mobile` / `email` | Có thể thay đổi và để trống; không phù hợp làm định danh. |

Giữ nguyên lựa chọn này sau khi đã có người dùng đăng nhập. Nếu dùng đồng bộ dữ liệu, chọn cùng trường trong nguồn đồng bộ.

## Đăng nhập và tự động đăng ký

Người dùng nhấn nút **Feishu / Lark** trên trang đăng nhập để hoàn tất OAuth. Khi bật tự động đăng ký:

- Người dùng được tìm hoặc tạo theo **trường định danh duy nhất**;
- Điện thoại, email và biệt danh chỉ được điền khi hồ sơ trống; giá trị sẵn có không bị ghi đè.

## Đăng nhập tự động

Khi bật **Đăng nhập tự động**, mở ứng dụng trong client Feishu sẽ tự động bắt đầu OAuth mà không cần nhấn nút. Chỉ một authenticator Feishu được bật tính năng này tại một thời điểm.

Điều kiện:

- URL callback nằm trong danh sách cho phép **URL chuyển hướng**;
- Ứng dụng đã phát hành và người dùng nằm trong phạm vi khả dụng;
- Ứng dụng được mở trong client Feishu.

Lần đầu sẽ xuất hiện trang xác nhận của Feishu; các lần sau là im lặng. Mở trong trình duyệt hệ thống không kích hoạt đăng nhập tự động — đây là hành vi dự kiến.

## Lối vào từ Feishu Workbench (tùy chọn)

Cấu hình trang chủ desktop/mobile trong **Chức năng ứng dụng** → **Ứng dụng web** để người dùng mở NocoBase trực tiếp từ workbench Feishu. URL phải trùng với địa chỉ NocoBase thực tế (bao gồm tiền tố đường dẫn con nếu có).
