---
title: 'Phạm vi dữ liệu và quy tắc'
---

# Phạm vi dữ liệu và quy tắc

Phạm vi dữ liệu quyết định một thao tác được truy cập những bản ghi nào. Nhân viên quản lý khách hàng xem các đơn mình phụ trách, còn tài xế xem các chuyến được giao.

## Các trường sở hữu khác nhau

Giới hạn phạm vi bản ghi theo quyền sở hữu, việc phân công hoặc các điều kiện nghiệp vụ khác. Những người có cùng quyền thao tác vẫn có thể truy cập các bản ghi khác nhau tùy theo trách nhiệm của họ.

```text
Allow account managers to view and edit orders using the owner field linked to the current user.
Allow drivers to view and handle tasks using the assigned driver's employee account.
Allow dispatchers to view all orders needed for coordination, with assignment subject to current order state.
Provide per-action scope choices in Team access and enforce consistent rules on lists, details, and mutations.
```

Hãy định nghĩa “của tôi” nghĩa là gì. Người phụ trách, người tạo và tài xế có thể là những người khác nhau; đừng dùng người tạo làm chủ sở hữu cho mọi công việc.

| Phạm vi               | Cách dùng trong vận tải                                |
| ------------------- | -------------------------------------------- |
| Do tôi phụ trách         | Nhân viên quản lý khách hàng theo dõi                    |
| Được giao cho tôi      | Chuyến của tài xế                         |
| Tất cả bản ghi         | Phối hợp điều phối                        |
| Điều kiện nghiệp vụ | Điều kiện theo giai đoạn, khu vực hoặc số tiền          |
| Nhóm hoặc phòng ban  | Trách nhiệm dựa trên tư cách thành viên thực tế |

Xem, sửa, phân công và phê duyệt đều cần thao tác và phạm vi riêng. Kiểm tra phía server cũng phải bảo vệ trang chi tiết và các thao tác được gửi lên, không chỉ bộ lọc của danh sách.

[Quyền truy cập mặc định](./default-access.md) bổ sung một phạm vi chung, [chia sẻ](./sharing-rules.md) bổ sung các bản ghi được chọn, còn [hạn chế](./restriction-rules.md) thu hẹp kết quả. Không cái nào thay thế được quyền trên trang và thao tác.

## So sánh phạm vi theo công việc

Trước khi thêm quyền truy cập chung, chia sẻ hay hạn chế, Alice thấy sáu đơn hàng của mình. Điều phối viên Emma thấy cả mười đơn hàng trên cùng một trang. Server trả về các bản ghi mà từng nhân viên được phép xem.

![Alice thấy sáu đơn hàng của mình](../assets/northstar-alice-orders-en.png)

**Chỉ với phạm vi theo công việc, Alice thấy sáu đơn hàng của mình.**

![Emma thấy cả mười đơn hàng](../assets/northstar-dispatch-orders-en.png)

**Điều phối viên Emma thấy cả mười đơn hàng.**

Các quy tắc sau thay đổi bản ghi hiển thị mà không thay đổi chủ sở hữu của chúng.
