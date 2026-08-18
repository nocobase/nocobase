---
pkg: '@nocobase/plugin-auth-dingtalk'
title: "Đồng bộ dữ liệu người dùng từ DingTalk"
description: "Đồng bộ người dùng và phòng ban DingTalk vào NocoBase, đồng thời nhận thay đổi qua callback HTTP hoặc chế độ Stream."
keywords: "DingTalk,đồng bộ người dùng,đồng bộ phòng ban,chế độ Stream,đăng ký sự kiện,NocoBase"
---

# Đồng bộ dữ liệu người dùng từ DingTalk

<PluginInfo commercial="true" name="auth-dingtalk"></PluginInfo>

## Giới thiệu

Plugin **DingTalk** đồng bộ người dùng và phòng ban của tổ chức DingTalk vào NocoBase. Plugin hỗ trợ đồng bộ toàn bộ thủ công và cập nhật tăng dần qua callback HTTP hoặc kết nối Stream.

## Chuẩn bị

1. Cài đặt và kích hoạt plugin **DingTalk** và **Đồng bộ dữ liệu người dùng**.
2. Tạo ứng dụng nội bộ doanh nghiệp trong bảng điều khiển nhà phát triển DingTalk.
3. Cấp quyền danh bạ và cấu hình phạm vi quyền dữ liệu theo hướng dẫn bên dưới.
4. Sao chép Client ID và Client Secret. Xem [Xác thực: DingTalk](/auth-verification/auth-dingtalk/).

## Cấu hình quyền danh bạ và phạm vi quyền dữ liệu

Mở **Quản lý quyền** của ứng dụng trong DingTalk và cấp các quyền sau:

| Quyền | Mã quyền | Bắt buộc | Mục đích |
| --- | --- | --- | --- |
| Đọc thông tin phòng ban | `qyapi_get_department_list` | Có | Đọc danh sách, tên và cấu trúc phòng ban. |
| Đọc thành viên phòng ban | `qyapi_get_department_member` | Có | Đọc thành viên của từng phòng ban. |
| Đọc thông tin thành viên | `qyapi_get_member` | Có | Đọc chi tiết người dùng và phòng ban trực thuộc. |
| Số điện thoại nhân viên | `fieldMobile` | Khi dùng số điện thoại | Đồng bộ số điện thoại; bắt buộc khi định danh duy nhất là `mobile`. |
| Email và thông tin cá nhân khác | `fieldEmail` | Không | Cần thiết khi đồng bộ địa chỉ email. |

Đồng thời cấu hình **Phạm vi quyền dữ liệu** để bao gồm các phòng ban và nhân viên được phép đồng bộ. Chọn tất cả nhân viên nếu muốn đồng bộ toàn bộ tổ chức.

:::warning
Quyền API quyết định các trường có thể đọc; phạm vi dữ liệu quyết định phòng ban và nhân viên có thể đọc. Cả hai đều phải được cấu hình. Đăng ký sự kiện không thay thế quyền đọc danh bạ.
:::

Nếu ứng dụng cũng được dùng để đăng nhập, hãy cấp thêm quyền thông tin cá nhân theo [Xác thực: DingTalk](/auth-verification/auth-dingtalk/).

## Thêm nguồn đồng bộ DingTalk

Vào **Người dùng & Quyền > Đồng bộ**, nhấp **Thêm** và chọn **DingTalk**.

| Trường | Mô tả |
| --- | --- |
| Tên nguồn | Tên duy nhất của nguồn đồng bộ. |
| Kích hoạt | Bắt đầu nhận sự kiện và cho phép chạy nhiệm vụ đồng bộ. |
| Client ID | Client ID của ứng dụng; hỗ trợ biến môi trường và secret. |
| Client Secret | Client Secret của ứng dụng; hỗ trợ biến môi trường và secret. |
| Định danh người dùng duy nhất | `mobile` hoặc `unionId`. Không thay đổi sau lần đồng bộ đầu tiên. Người dùng thiếu giá trị được chọn sẽ bị bỏ qua. |
| Chế độ nhận sự kiện | **Callback HTTP** hoặc **chế độ Stream** cho thay đổi tăng dần. |

Lưu và kích hoạt nguồn, sau đó nhấp **Đồng bộ** để chạy đồng bộ toàn bộ lần đầu.

## Chọn chế độ nhận sự kiện

### Chế độ Stream

Chế độ Stream thiết lập kết nối duy trì từ máy chủ NocoBase đến DingTalk. Không cần URL callback công khai, Token hoặc EncodingAESKey.

1. Chọn **chế độ Stream** trong cấu hình đăng ký sự kiện DingTalk.
2. Đăng ký các sự kiện thay đổi người dùng và phòng ban cần thiết.
3. Chọn **chế độ Stream** trong NocoBase, lưu và kích hoạt nguồn.

Client Stream khởi động khi nguồn được kích hoạt. Khi cập nhật, tắt hoặc xóa nguồn, kết nối sẽ được làm mới hoặc đóng.

:::info
Máy chủ NocoBase phải có thể kết nối ra ngoài đến DingTalk. Không cần reverse proxy hoặc endpoint nhận công khai.
:::

### Callback HTTP

1. Chọn **Callback HTTP** trong NocoBase.
2. Nhập Token và EncodingAESKey đã cấu hình trong DingTalk.
3. Lưu nguồn và sao chép **URL callback sự kiện** được tạo.
4. Cấu hình URL trong DingTalk và đăng ký các sự kiện người dùng, phòng ban.

URL phải được DingTalk truy cập được. Trong môi trường production, sử dụng HTTPS và đảm bảo reverse proxy chuyển tiếp nguyên đường dẫn.

## Sự kiện tăng dần được hỗ trợ

| Sự kiện | Xử lý trong NocoBase |
| --- | --- |
| `user_add_org` | Tạo hoặc cập nhật người dùng. |
| `user_modify_org` | Cập nhật người dùng. |
| `user_leave_org` | Xóa người dùng đã đồng bộ. |
| `org_dept_create` | Tạo hoặc cập nhật phòng ban. |
| `org_dept_modify` | Cập nhật phòng ban và đồng bộ người dùng của phòng ban. |
| `org_dept_remove` | Xóa phòng ban đã đồng bộ. |

## Các trường được đồng bộ

### Trường phòng ban

| Trường DingTalk | Trường hoặc mục đích trong NocoBase |
| --- | --- |
| `dept_id` | Định danh duy nhất của phòng ban tại nguồn. |
| `name` | Tên phòng ban. |
| `parent_id` | Phòng ban cấp trên. Nếu nằm ngoài phạm vi dữ liệu, phòng ban sẽ được đồng bộ như phòng ban gốc. |

### Trường người dùng

| Trường DingTalk | Trường hoặc mục đích trong NocoBase |
| --- | --- |
| `mobile` hoặc `unionid` | Định danh duy nhất tại nguồn và tên người dùng theo cấu hình. |
| `name` | Biệt danh người dùng. |
| `mobile` | Số điện thoại. Yêu cầu `fieldMobile`. |
| `email`, dự phòng bằng `org_email` | Địa chỉ email. Yêu cầu `fieldEmail`. |
| `dept_id_list` | Các phòng ban của người dùng trong phạm vi quyền dữ liệu. |
| `dept_order_list` | Phòng ban chính. |
| `leader_in_dept` | Người dùng có phải là người phụ trách phòng ban tương ứng hay không. |

### Người phụ trách phòng ban

NocoBase đồng bộ `leader_in_dept` riêng cho từng phòng ban. Một người dùng có thể phụ trách nhiều phòng ban và không nhất thiết là phòng ban chính. Khi trạng thái bị xóa trong DingTalk, lần đồng bộ tiếp theo cũng xóa trạng thái trong NocoBase. Thay đổi thủ công có thể bị ghi đè.

Đồng bộ toàn bộ và tăng dần dùng cùng ánh xạ trường. Avatar, chức danh và mã nhân viên hiện chưa được đồng bộ.

## Khắc phục sự cố

- Nếu dữ liệu trống hoặc thiếu, kiểm tra ba quyền bắt buộc và phạm vi quyền dữ liệu.
- Nếu thiếu số điện thoại hoặc email, kiểm tra `fieldMobile` và `fieldEmail`.
- Người dùng thiếu định danh duy nhất đã cấu hình sẽ bị bỏ qua.
- Với Stream, kiểm tra log `Dingtalk stream client starting`, `Dingtalk stream client started` và lỗi kết nối.
- Với callback HTTP, kiểm tra khả năng truy cập công khai, Token và EncodingAESKey.
- Chạy lại đồng bộ toàn bộ sau khi thay đổi quyền hoặc phạm vi dữ liệu.
