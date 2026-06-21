---
title: "Quyền Action"
description: "Quyền Action: cấu hình khả năng hiển thị và quyền thực thi của Action, hỗ trợ kiểm soát theo vai trò và phạm vi dữ liệu."
keywords: "quyền Action,permission,quyền vai trò,khả năng hiển thị,Interface Builder,NocoBase"
---

# Quyền Action

## Giới thiệu

Trong NocoBase 2.0, quyền Action hiện chủ yếu được kiểm soát bởi quyền tài nguyên Table dữ liệu:

- **Quyền tài nguyên Table dữ liệu**: Dùng để kiểm soát thống nhất quyền các thao tác cơ bản của các vai trò khác nhau đối với Table dữ liệu như thêm (Create), xem (View), sửa (Update), xóa (Delete). Quyền này áp dụng cho toàn bộ Table dữ liệu trong nguồn dữ liệu, đảm bảo các vai trò có quyền nhất quán đối với Table này trong các Block khác nhau trên các Trang hoặc Popup khác nhau.
<!-- - **Quyền Action độc lập**: Dùng để kiểm soát chi tiết các Action mà các vai trò khác nhau có thể thấy, phù hợp với việc quản lý quyền của các Action cụ thể, ví dụ như Kích hoạt workflow, Yêu cầu tùy chỉnh, Liên kết bên ngoài, v.v. Loại quyền này phù hợp với kiểm soát quyền cấp Action, cho phép các vai trò khác nhau thực thi các Action cụ thể mà không ảnh hưởng đến cấu hình quyền của toàn bộ Table dữ liệu. -->

### Quyền tài nguyên Table dữ liệu

Trong hệ thống quyền của NocoBase, quyền thao tác Table dữ liệu được phân chia cơ bản theo chiều CRUD để đảm bảo tính nhất quán và quy chuẩn của việc quản lý quyền. Ví dụ:

- **Quyền thêm (Create)**: Kiểm soát tất cả các thao tác thêm liên quan đến Table dữ liệu này, bao gồm Action thêm, Action nhân bản, v.v. Khi vai trò có quyền thêm với Table dữ liệu này, thì các Action thêm và Action nhân bản của Table này đều hiển thị trên tất cả các Trang hoặc Popup.
- **Quyền xóa (Delete)**: Kiểm soát Action xóa của Table dữ liệu này, dù là Action xóa hàng loạt trong Block Table, hay Action xóa từng bản ghi trên Block Chi tiết, quyền đều nhất quán.
- **Quyền cập nhật (Update)**: Kiểm soát các Action cập nhật của Table dữ liệu này, như Action chỉnh sửa, Action cập nhật bản ghi.
- **Quyền xem (View)**: Kiểm soát khả năng hiển thị dữ liệu của Table này, chỉ khi vai trò có quyền xem với Table dữ liệu này thì các Block dữ liệu liên quan (Table, danh sách, Chi tiết, v.v.) mới hiển thị.

Cách quản lý quyền chung này phù hợp với kiểm soát quyền dữ liệu chuẩn hóa, đảm bảo `cùng một Table dữ liệu` có `quy tắc quyền nhất quán` cho `cùng một Action` trong `các Trang, Popup, Block khác nhau`, có tính thống nhất và khả năng bảo trì.

#### Quyền toàn cục

Quyền Action toàn cục có hiệu lực với tất cả các Table dữ liệu trong nguồn dữ liệu, được phân chia theo loại tài nguyên như sau

![20250306204756](https://static-docs.nocobase.com/20250306204756.png)

#### Quyền Action Table dữ liệu cụ thể

Quyền Action Table dữ liệu cụ thể cao hơn quyền chung của nguồn dữ liệu, chi tiết hóa thêm quyền Action, có thể tùy chỉnh cấu hình quyền truy cập tài nguyên cho Table dữ liệu cụ thể. Các quyền này được chia thành hai phương diện:

1. Quyền Action: Quyền Action bao gồm các Action thêm, xem, chỉnh sửa, xóa, xuất và nhập. Các quyền này được cấu hình theo chiều phạm vi dữ liệu:

   - Tất cả dữ liệu: Cho phép người dùng thực hiện thao tác trên tất cả các bản ghi trong Table dữ liệu.
   - Dữ liệu của bản thân: Hạn chế người dùng chỉ thực hiện thao tác trên các bản ghi dữ liệu do mình tạo.

2. Quyền Field: Quyền Field cho phép cấu hình quyền cho mỗi Field trong các Action khác nhau. Ví dụ, một số Field có thể được cấu hình chỉ cho phép xem mà không cho phép chỉnh sửa.

![20250306205042](https://static-docs.nocobase.com/20250306205042.png)

<!-- ### Quyền Action độc lập

> **Lưu ý**: Tính năng này **được hỗ trợ từ phiên bản v1.6.0-beta.13**

Khác với quyền Action thống nhất, quyền Action độc lập chỉ kiểm soát chính Action đó, cho phép cùng một Action có cấu hình quyền khác nhau ở các vị trí khác nhau.

Cách thức quyền này phù hợp với các Action cá nhân hóa, ví dụ:

Action kích hoạt workflow có thể cần gọi các workflow khác nhau ở các Trang hoặc Block khác nhau, do đó cần kiểm soát quyền độc lập.
Các Action tùy chỉnh ở các vị trí khác nhau thực hiện logic nghiệp vụ cụ thể, phù hợp với quản lý quyền riêng biệt.

Hiện hỗ trợ cấu hình quyền độc lập cho các Action sau

- Popup (kiểm soát khả năng hiển thị và quyền thao tác của Action Popup)
- Liên kết (hạn chế vai trò có thể truy cập liên kết bên ngoài hoặc nội bộ hay không)
- Kích hoạt workflow (gọi các workflow khác nhau cho các Trang khác nhau)
- Action của Action Panel (ví dụ quét mã, Action Popup, kích hoạt workflow, liên kết bên ngoài)
- Yêu cầu tùy chỉnh (gửi yêu cầu đến bên thứ ba)

Bằng cách cấu hình quyền Action độc lập, có thể quản lý chi tiết hơn quyền Action của các vai trò khác nhau, làm cho việc kiểm soát quyền linh hoạt hơn.

![20250306215749](https://static-docs.nocobase.com/20250306215749.png)

Nếu không cài đặt vai trò, mặc định tất cả các vai trò đều có thể thấy.

![20250306215854](https://static-docs.nocobase.com/20250306215854.png) -->

## Tài liệu liên quan

[Cấu hình quyền]
<!-- (/users-and-permissions) -->
