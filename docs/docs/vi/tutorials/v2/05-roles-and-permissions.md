# Chương 5: Người dùng và quyền — Ai có thể xem cái gì

Chương trước chúng ta đã xây xong form và trang chi tiết, hệ thống ticket đã có thể nhập và xem dữ liệu bình thường. Nhưng hiện tại có một vấn đề — tất cả mọi người sau khi đăng nhập đều thấy cùng một thứ. Nhân viên submit ticket có thể thấy trang quản lý, kỹ thuật viên có thể xóa phân loại… Như vậy không ổn.

Chương này, chúng ta sẽ thêm "barrier" cho hệ thống: tạo [vai trò](/users-permissions/acl/role), cấu hình [quyền menu](/users-permissions/acl/permissions) và [phạm vi dữ liệu](/users-permissions/acl/permissions), thực hiện **người khác nhau, thấy menu khác nhau, thao tác dữ liệu khác nhau**.

## 5.1 Hiểu [vai trò](/users-permissions/acl/role) (Role)

Trong NocoBase, **vai trò chính là một tập hợp các [quyền](/users-permissions/acl/role)**. Bạn không cần cấu hình quyền riêng cho từng Người dùng, mà định nghĩa trước một vài vai trò, rồi cho Người dùng vào vai trò tương ứng.

NocoBase sau khi cài đặt tự mang ba vai trò:

- **Root**: Super admin, có tất cả quyền, không thể xóa
- **Admin**: Admin, mặc định có quyền cấu hình giao diện
- **Member**: Thành viên thông thường, mặc định ít quyền

Nhưng ba vai trò tích hợp này không đủ dùng. Hệ thống ticket của chúng ta cần phân chia chi tiết hơn, nên tiếp theo chúng ta tạo 3 vai trò tùy chỉnh.

## 5.2 Tạo ba vai trò

Mở menu cài đặt ở góc trên bên phải, vào **Người dùng và quyền → Quản lý vai trò**.

Click **Thêm vai trò**, lần lượt tạo:

| Tên vai trò | Mã vai trò | Mô tả |
|---------|---------|------|
| Admin | admin-helpdesk | Có thể xem tất cả ticket, quản lý phân loại, phân công người xử lý |
| Kỹ thuật viên | technician | Chỉ xem ticket được phân cho mình, có thể xử lý và đóng |
| Người dùng thông thường | user | Chỉ có thể submit ticket, chỉ có thể xem ticket mình đã submit |

![05-roles-and-permissions-2026-03-13-19-03-14](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-03-14.png)

> **Mã vai trò** là ID duy nhất dùng nội bộ trong hệ thống, sau khi tạo không thể đổi, khuyến nghị dùng chữ thường tiếng Anh. Tên vai trò có thể sửa bất cứ lúc nào.

![05-roles-and-permissions-2026-03-13-18-57-47](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-18-57-47.png)

Sau khi tạo xong, trong danh sách vai trò có thể thấy ba vai trò mới của chúng ta.


## 5.3 Cấu hình quyền menu

Vai trò đã tạo xong, tiếp theo cho hệ thống biết: Mỗi vai trò có thể thấy những menu nào.

Click vào một vai trò để vào trang cấu hình quyền, tìm tab **Quyền truy cập menu**. Ở đây sẽ liệt kê tất cả menu item trong hệ thống, đánh dấu là cho phép truy cập, bỏ đánh dấu là ẩn.

**Admin (admin-helpdesk)**: Đánh dấu tất cả
- Quản lý ticket, quản lý phân loại, dashboard — đều có thể thấy

**Kỹ thuật viên (technician)**: Đánh dấu một phần
- ✅ Quản lý ticket
- ✅ Dashboard
- ❌ Quản lý phân loại (kỹ thuật viên không cần quản lý phân loại)

**Người dùng thông thường (user)**: Quyền tối thiểu
- ✅ Quản lý ticket (chỉ thấy ticket của mình)
- ❌ Quản lý phân loại
- ❌ Dashboard

![05-roles-and-permissions-2026-03-13-19-09-11](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-09-11.png)

> **Mẹo nhỏ**: NocoBase có một cài đặt tiện lợi — "menu item mới mặc định cho phép truy cập". Nếu bạn không muốn mỗi lần thêm trang mới phải đánh dấu thủ công, có thể bật tùy chọn này cho vai trò admin. Đối với vai trò Người dùng thông thường, khuyến nghị tắt nó.

## 5.4 Cấu hình quyền dữ liệu

Quyền menu quản lý "có thể vào trang này hay không", quyền dữ liệu quản lý "sau khi vào trang có thể thấy dữ liệu nào".

Khái niệm chính: **[Phạm vi dữ liệu](/users-permissions/acl/permissions) (Data Scope)**.

Trong cấu hình quyền của vai trò, chuyển sang tab **Quyền thao tác [bảng dữ liệu](/data-sources/data-modeling/collection)**. Tìm bảng "Ticket" của chúng ta, click vào để cấu hình riêng.

![05-roles-and-permissions-2026-03-13-19-51-06](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-51-06.png)

### Người dùng thông thường: Chỉ xem ticket mình đã submit

1. Tìm quyền **Xem** của bảng "Ticket"
2. Phạm vi dữ liệu chọn → **Dữ liệu của mình**
3. Như vậy Người dùng thông thường chỉ có thể thấy ticket "có người tạo là chính mình" (cần lưu ý, tùy chọn mặc định lấy theo Field người tạo của hệ thống, không phải Field người submit, tuy nhiên có thể sửa)

Tương tự, cài quyền "chỉnh sửa" và "xóa" cũng thành **Dữ liệu của mình** (hoặc đơn giản không cấp quyền xóa).

![05-roles-and-permissions-2026-03-13-19-53-02](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-53-02.png)


Về cấu hình toàn cục: Nếu chỉ cấu hình bảng ticket, có thể dẫn đến không thấy được dữ liệu khác, các tùy chọn cấu hình (như bảng phân loại, người xử lý). Hệ thống của chúng ta hiện tại tương đối đơn giản, lần này trong toàn cục đánh dấu trực tiếp "Xem tất cả dữ liệu", với các bảng nhạy cảm về phạm vi dữ liệu, sẽ cấu hình quyền riêng

![05-roles-and-permissions-2026-03-13-19-57-24](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-57-24.png)


### Kỹ thuật viên: Chỉ xem ticket được phân cho mình

1. Tìm quyền **Xem** của bảng "Ticket"
2. Phạm vi dữ liệu chọn → **Dữ liệu của mình**
3. Nhưng ở đây có một chi tiết — "Dữ liệu của mình" của NocoBase mặc định lọc theo người tạo. Nếu chúng ta muốn lọc theo "người xử lý", có thể điều chỉnh thêm trong [quyền thao tác](/users-permissions/acl/permissions) toàn cục, hoặc trong trang frontend dùng **điều kiện lọc của [Block](/interface-builder/blocks) dữ liệu** kết hợp để thực hiện

![05-roles-and-permissions-2026-03-13-20-01-54](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-20-01-54.png)

> **Kỹ thuật thực dụng**: Còn có thể cài điều kiện lọc mặc định trên Block bảng để hỗ trợ kiểm soát quyền, ví dụ "người xử lý = Người dùng hiện tại". Tuy nhiên cấu hình trang là có hiệu lực toàn cục, admin cũng sẽ bị giới hạn. Phương án dung hòa: cấu hình "người xử lý = Người dùng hiện tại **hoặc** người submit = Người dùng hiện tại", tương thích với Người dùng thông thường và kỹ thuật viên; admin nếu cần view toàn cục, lại tạo riêng một trang không có lọc.

![05-roles-and-permissions-2026-03-13-22-21-34](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-22-21-34.png)

### Admin: Thấy tất cả dữ liệu

Phạm vi dữ liệu của vai trò admin chọn **Tất cả dữ liệu**, mở tất cả các thao tác. Đơn giản trực tiếp.

![05-roles-and-permissions-2026-03-13-21-45-14](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-21-45-14.png)

## 5.5 Action phân công ticket

Trước khi cấu hình quyền xong, chúng ta thêm trước một tính năng thực dụng cho danh sách ticket: **phân công người xử lý**. Admin có thể trực tiếp phân công ticket cho một kỹ thuật viên nào đó trong danh sách, không cần vào trang chỉnh sửa để sửa cả đống Field.

Thực hiện rất đơn giản — thêm một nút popup tùy chỉnh vào cột Action của bảng:

1. Vào chế độ UI editor, trong cột Action của bảng danh sách ticket, click **"+"** để thêm một nút Action **"Popup"**.

![05-roles-and-permissions-2026-03-14-13-57-31](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-13-57-31.png)

2. Đổi tiêu đề nút thành **"Phân công"** (click tùy chọn cấu hình nút để sửa tiêu đề).

![05-roles-and-permissions-2026-03-14-13-59-22](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-13-59-22.png)


Vì chỉ có một thông tin phân công đơn giản, chúng ta chọn popup đơn giản phù hợp hơn, không phải drawer, ở góc trên bên phải nút chọn cài đặt popup, chọn dialog hẹp > xác nhận
![05-roles-and-permissions-2026-03-14-14-08-16](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-14-08-16.png)


3. Click nút "Phân công" để mở popup, trong popup **"Tạo Block → Block dữ liệu → Form (Edit)"**, chọn bảng dữ liệu hiện tại.
4. Trong form chỉ đánh dấu một Field **"Người xử lý"**, và trong tùy chọn cấu hình Field cài thành **bắt buộc**.
5. Thêm nút Action **"Submit"**.

![05-roles-and-permissions-2026-03-14-14-10-50](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-14-10-50.png)

Như vậy, admin trong danh sách ticket click "Phân công", sẽ bật một form cực đơn giản, chọn người xử lý xong submit là được. Nhanh chóng, chính xác, không sửa nhầm các Field khác.

### Dùng linkage rule để kiểm soát hiển thị/ẩn nút

Nút "Phân công" chỉ admin mới cần dùng, Người dùng thông thường và kỹ thuật viên thấy nó ngược lại gây bối rối. Chúng ta có thể dùng **linkage rule** dựa vào vai trò của Người dùng hiện tại để kiểm soát hiển thị/ẩn của nút:

1. Trong chế độ UI editor, click tùy chọn cấu hình của nút "Phân công", tìm **"Linkage rule"**.
2. Thêm một rule, điều kiện cài thành: **Người dùng hiện tại / Vai trò / Tên vai trò** không bằng **Admin** (tức là tên tương ứng với vai trò admin-helpdesk).
3. Action khi thỏa mãn điều kiện: **Ẩn** nút này.

Như vậy, chỉ Người dùng có vai trò admin mới có thể thấy nút "Phân công", các vai trò khác sau khi đăng nhập nút này sẽ tự động ẩn.

![05-roles-and-permissions-2026-03-14-14-17-37](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-14-17-37.png)

## 5.6 Tạo Người dùng test và trải nghiệm

Quyền đã cấu hình xong, chúng ta thực tế kiểm chứng một chút.

Vào **Quản lý Người dùng** (trung tâm cài đặt hoặc trang quản lý Người dùng bạn đã xây trước đó), tạo 3 Người dùng test:

| Tên Người dùng | Vai trò |
|-------|------|
| Alice | Admin (admin-helpdesk) |
| Bob | Kỹ thuật viên (technician) |
| Charlie | Người dùng thông thường (user) |

![05-roles-and-permissions-2026-03-13-22-23-47](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-22-23-47.png)

Sau khi tạo xong, lần lượt dùng ba tài khoản này đăng nhập hệ thống, kiểm tra hai việc:

**1. Menu có hiển thị đúng như dự kiến không?**
- Alice → Có thể thấy tất cả menu

![05-roles-and-permissions-2026-03-14-14-19-29](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-14-19-29.png)

- Bob → Chỉ thấy Quản lý ticket và Dashboard

![05-roles-and-permissions-2026-03-13-22-26-50](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-22-26-50.png)

- Charlie → Chỉ thấy "Ticket của tôi"

![05-roles-and-permissions-2026-03-13-22-30-57](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-22-30-57.png)

**2. Dữ liệu có được lọc đúng như dự kiến không?**
- Trước tiên dùng Alice tạo vài ticket, lần lượt phân cho người xử lý khác nhau
- Chuyển sang Bob đăng nhập → Chỉ thấy ticket được phân cho mình
- Chuyển sang Charlie đăng nhập → Chỉ thấy ticket mình đã submit

Có ngầu không? Cùng một hệ thống, Người dùng khác nhau thấy nội dung hoàn toàn khác nhau! Đây chính là sức mạnh của quyền.

## Tóm tắt

Chương này chúng ta đã hoàn thành hệ thống quyền của hệ thống ticket:

- **3 vai trò**: Admin, kỹ thuật viên, Người dùng thông thường
- **Quyền menu**: Kiểm soát mỗi vai trò có thể vào những trang nào
- **Quyền dữ liệu**: Kiểm soát mỗi vai trò có thể thấy dữ liệu nào (thực hiện qua phạm vi dữ liệu)
- **Test kiểm chứng**: Dùng các tài khoản khác nhau đăng nhập, xác nhận quyền có hiệu lực

Đến đây, hệ thống ticket đã ra dáng — có thể nhập, có thể xem, có thể kiểm soát truy cập theo vai trò. Nhưng tất cả thao tác đều là thủ công.

## Xem trước chương sau

Chương sau chúng ta học **Workflow** — cho hệ thống tự động làm việc giúp chúng ta. Ví dụ ticket sau khi submit tự động thông báo người xử lý, khi trạng thái thay đổi tự động ghi log.

## Tài nguyên liên quan

- [Quản lý Người dùng](/users-permissions/user) — Quản lý Người dùng chi tiết
- [Vai trò và quyền](/users-permissions/acl/role) — Mô tả cấu hình vai trò
- [Phạm vi dữ liệu](/users-permissions/acl/permissions) — Kiểm soát quyền cấp dữ liệu
