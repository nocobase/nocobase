---
pkg: '@nocobase/plugin-feishu'
title: "Đồng bộ dữ liệu người dùng từ Feishu"
description: "Đồng bộ người dùng và phòng ban từ Feishu vào NocoBase, nhận thay đổi tăng dần qua HTTP callback hoặc chế độ Stream."
keywords: "Feishu,Lark,đồng bộ người dùng,đồng bộ phòng ban,chế độ Stream,callback sự kiện,NocoBase"
---

# Đồng bộ dữ liệu người dùng từ Feishu

<PluginInfo commercial="true" name="feishu"></PluginInfo>

## Giới thiệu

Plugin **Feishu / Lark** đồng bộ người dùng và phòng ban từ tổ chức Feishu vào NocoBase. Hỗ trợ đồng bộ toàn bộ theo yêu cầu và cập nhật tăng dần qua HTTP callback hoặc kết nối Stream.

## Chuẩn bị

1. Cài đặt và kích hoạt plugin **Feishu / Lark** và **Đồng bộ dữ liệu người dùng**.
2. Tạo ứng dụng tự xây trên nền tảng mở Feishu, xem [Xác thực: Feishu / Lark](/auth-verification/auth-feishu/).
3. Cấp quyền danh bạ và cấu hình phạm vi hiển thị danh bạ như bên dưới.

## Quyền danh bạ và phạm vi hiển thị

Trong **Quản lý quyền** của ứng dụng, bật các quyền sau:

| Quyền | Phạm vi (scope) | Bắt buộc | Mục đích |
| --- | --- | --- | --- |
| Lấy thông tin cơ bản người dùng | `contact:user.base:readonly` | Có | Đọc tên, `open_id` / `union_id` và các trường cơ bản khác. |
| Lấy thông tin cơ bản phòng ban | `contact:department.base:readonly` | Có | Đọc tên và phân cấp phòng ban. |
| Lấy cấu trúc tổ chức phòng ban | `contact:department.organize:readonly` | Có | Duyệt phòng ban con; đọc người phụ trách. |
| Lấy cấu trúc tổ chức người dùng | `contact:user.department:readonly` | Có | Đọc phòng ban và phòng ban chính của người dùng. |
| Lấy user ID người dùng | `contact:user.id:readonly` | Khi định danh là `user_id` | Đọc trường `user_id`. |
| Lấy số điện thoại người dùng | `contact:user.phone:readonly` | Khi đồng bộ điện thoại | Đọc số điện thoại; bắt buộc khi định danh là `mobile`. |
| Lấy email người dùng | `contact:user.email:readonly` | Khi đồng bộ email | Đọc email; bắt buộc khi định danh là `email`. |

Tiếp theo cấu hình **phạm vi quyền danh bạ** (phòng ban và thành viên ứng dụng được truy cập):

1. Tại trang **Cấu hình phát triển → Quản lý quyền**, nhấn **Cấu hình** ở cột "Phạm vi dữ liệu truy cập" (khi bật quyền danh bạ sẽ tự chuyển tới đây).
2. Chọn phòng ban và thành viên; lần đầu nên chọn **Tất cả thành viên** để kiểm chứng, sau đó thu hẹp nếu cần.
3. Nhấn **OK** để lưu.

:::warning
Thiếu quyền **Lấy thông tin cơ bản người dùng**, API không trả về tên và biệt danh sau đồng bộ sẽ trống. Phạm vi quyền danh bạ và "phạm vi khả dụng của ứng dụng" (ai được dùng ứng dụng) là hai cấu hình độc lập; chỉ phạm vi quyền danh bạ ảnh hưởng đồng bộ. Quyền API quyết định đọc được trường nào, phạm vi quyền quyết định đọc được phòng ban/người dùng nào — cần cấu hình cả hai. Sau khi thay đổi, chạy lại đồng bộ toàn bộ. Đăng ký sự kiện không thay thế quyền đọc: mỗi sự kiện NocoBase vẫn gọi API Feishu để lấy dữ liệu mới nhất.
:::

## Thêm nguồn đồng bộ Feishu

Vào **Người dùng & Quyền** → **Đồng bộ**, thêm nguồn loại **Feishu / Lark**:

| Trường | Mô tả |
| --- | --- |
| Tên nguồn | Tên duy nhất của nguồn đồng bộ. |
| Kích hoạt | Bật nhận sự kiện của nguồn và cho phép chạy tác vụ đồng bộ. |
| Khu vực | `Feishu China` hoặc `Lark Global`. |
| App ID / App Secret | Thông tin ứng dụng Feishu. Hỗ trợ biến môi trường và secret. |
| Trường định danh duy nhất | `user_id`, `union_id`, `open_id`, `mobile` hoặc `email`; khuyến nghị `union_id`. Phải trùng với authenticator; người dùng thiếu giá trị sẽ bị bỏ qua. |
| Chế độ nhận sự kiện | **HTTP callback** hoặc **Chế độ Stream**, xem bên dưới. |

Lưu và kích hoạt nguồn, nhấn **Đồng bộ** để chạy đồng bộ toàn bộ lần đầu.

## Chọn chế độ nhận sự kiện

### Chế độ Stream

Chế độ Stream duy trì kết nối WebSocket do máy chủ NocoBase chủ động thiết lập. Không cần URL callback công khai, token hay khóa mã hóa.

1. Chọn **Chế độ Stream** trong NocoBase, lưu và kích hoạt nguồn.
2. Trên nền tảng, tại **Sự kiện & Callback**, chuyển chế độ nhận sang **Kết nối dài (WebSocket)** và đăng ký các sự kiện danh bạ.

Kết nối tự động khởi động khi nguồn được kích hoạt (tự động kết nối lại) và được làm mới/đóng khi nguồn cập nhật, tắt hoặc xóa.

:::info
Chế độ Stream không cần địa chỉ vào công khai và không cần reverse proxy — phù hợp triển khai nội bộ. Trạng thái kết nối kiểm tra qua log ứng dụng với từ khóa `Feishu stream client`.
:::

### HTTP callback

1. Chọn **HTTP callback** trong NocoBase, cấu hình **Verification Token** và tùy chọn **Encrypt Key** — cần ít nhất một.
2. Lưu nguồn và copy **URL callback sự kiện** hiển thị trên giao diện.
3. Trên nền tảng, tại **Sự kiện & Callback** → **Cấu hình sự kiện**, chọn đẩy sự kiện về máy chủ, dán URL và đăng ký sự kiện danh bạ.

URL callback phải Feishu truy cập được (HTTPS ở môi trường production). Có Encrypt Key thì nội dung callback được mã hóa.

:::warning
Thiếu Verification Token hoặc Encrypt Key, yêu cầu callback bị từ chối (401). Sau khi nguồn chuyển sang chế độ Stream, endpoint HTTP đóng (403).
:::

## Sự kiện tăng dần được hỗ trợ

| Sự kiện | Xử lý trong NocoBase |
| --- | --- |
| `contact.user.created_v3` | Tạo hoặc cập nhật người dùng. |
| `contact.user.updated_v3` | Cập nhật người dùng. |
| `contact.user.deleted_v3` | Xóa người dùng đã đồng bộ. |
| `contact.department.created_v3` | Tạo hoặc cập nhật phòng ban. |
| `contact.department.updated_v3` | Cập nhật phòng ban. |
| `contact.department.deleted_v3` | Xóa phòng ban đã đồng bộ. |

Người dùng có vai trò Root không bao giờ bị xóa bởi đồng bộ.

## Các trường đồng bộ

### Trường phòng ban

| Trường Feishu | Trường / mục đích trong NocoBase |
| --- | --- |
| `open_department_id` | Định danh nguồn của phòng ban. |
| `name` | Tên phòng ban. |
| `parent_department_id` | Phòng ban cha để dựng phân cấp. Phòng ban cha ngoài phạm vi được đồng bộ làm gốc. |

### Trường người dùng

| Trường Feishu | Trường / mục đích trong NocoBase |
| --- | --- |
| Giá trị trường định danh | Định danh nguồn và tên người dùng sinh từ **trường định danh duy nhất**. |
| `name`, nếu thiếu dùng `en_name` | Biệt danh; để trống nếu cả hai thiếu. |
| `mobile` | Số điện thoại. |
| `email` | Email. |
| `department_ids` | Phòng ban của người dùng; chỉ trong phạm vi hiển thị. |
| `main_department_id` | Phòng ban chính. |

### Người phụ trách phòng ban

Người phụ trách (leader) từ dữ liệu phòng ban được đồng bộ thành chủ phòng ban trong NocoBase: một người có thể phụ trách nhiều phòng ban, phòng ban phụ trách chưa chắc là phòng ban chính. Chỉ phòng ban trong phạm vi tham gia. Người phụ trách bị gỡ phía Feishu sẽ bị gỡ ở lần đồng bộ tiếp theo; thay đổi thủ công trong NocoBase có thể bị ghi đè.

Các trường khác của người dùng Feishu như ảnh đại diện, chức danh, mã nhân viên hiện chưa đồng bộ.

## Xử lý sự cố

- Kết quả trống hoặc thiếu phòng ban: kiểm tra quyền danh bạ và phòng ban có trong phạm vi hiển thị không.
- Biệt danh trống: bật **Lấy thông tin cơ bản người dùng** (`contact:user.base:readonly`) và chạy lại đồng bộ toàn bộ.
- Người dùng bị bỏ qua: kiểm tra giá trị của trường định danh và trùng khớp với authenticator.
- HTTP callback trả 401: chưa cấu hình Verification Token / Encrypt Key hoặc sai; 403: nguồn đã chuyển sang chế độ Stream.
- Lỗi `redirect_uri` hoặc URL callback: URL trên nền tảng phải trùng khớp tuyệt đối với NocoBase hiển thị (kể cả tiền tố `APP_PUBLIC_PATH`).
- Tác vụ thất bại do giới hạn tần suất API: chờ hết giới hạn và chạy lại thủ công.
