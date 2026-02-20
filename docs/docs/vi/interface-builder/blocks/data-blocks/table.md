:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Khối Bảng

## Giới thiệu

Khối Bảng là một trong những khối dữ liệu cốt lõi được tích hợp sẵn trong **NocoBase**, chủ yếu dùng để hiển thị và quản lý dữ liệu có cấu trúc dưới dạng bảng. Khối này cung cấp các tùy chọn cấu hình linh hoạt, cho phép người dùng tùy chỉnh các cột, độ rộng cột, quy tắc sắp xếp và phạm vi dữ liệu của bảng theo nhu cầu, đảm bảo dữ liệu hiển thị phù hợp với yêu cầu nghiệp vụ cụ thể.

#### Các tính năng chính:
- **Cấu hình cột linh hoạt**: Bạn có thể tùy chỉnh các cột và độ rộng cột của bảng để phù hợp với các yêu cầu hiển thị dữ liệu khác nhau.
- **Quy tắc sắp xếp**: Hỗ trợ sắp xếp dữ liệu trong bảng. Người dùng có thể sắp xếp dữ liệu theo thứ tự tăng dần hoặc giảm dần dựa trên các trường khác nhau.
- **Thiết lập phạm vi dữ liệu**: Bằng cách thiết lập phạm vi dữ liệu, người dùng có thể kiểm soát phạm vi dữ liệu được hiển thị, tránh sự can thiệp của dữ liệu không liên quan.
- **Cấu hình thao tác**: Khối Bảng tích hợp nhiều tùy chọn thao tác. Người dùng có thể dễ dàng cấu hình các thao tác như lọc, tạo mới, chỉnh sửa, xóa để quản lý dữ liệu nhanh chóng.
- **Chỉnh sửa nhanh**: Hỗ trợ chỉnh sửa dữ liệu trực tiếp trong bảng, giúp đơn giản hóa quy trình thao tác và nâng cao hiệu quả công việc.

## Cấu hình Khối

![20251023150819](https://static-docs.nocobase.com/20251023150819.png)

### Quy tắc Liên kết Khối

Kiểm soát hành vi của khối (ví dụ: có hiển thị hay thực thi JavaScript hay không) thông qua các quy tắc liên kết.

![20251023194550](https://static-docs.nocobase.com/20251023194550.png)

Tham khảo thêm tại [Quy tắc Liên kết](/interface-builder/linkage-rule)

### Thiết lập Phạm vi Dữ liệu

Ví dụ: Mặc định lọc các đơn hàng có "Trạng thái" là "Đã thanh toán".

![20251023150936](https://static-docs.nocobase.com/20251023150936.png)

Tham khảo thêm tại [Thiết lập Phạm vi Dữ liệu](/interface-builder/blocks/block-settings/data-scope)

### Thiết lập Quy tắc Sắp xếp

Ví dụ: Hiển thị đơn hàng theo ngày giảm dần.

![20251023155114](https://static-docs.nocobase.com/20251023155114.png)

Tham khảo thêm tại [Thiết lập Quy tắc Sắp xếp](/interface-builder/blocks/block-settings/sorting-rule)

### Bật Chỉnh sửa Nhanh

Kích hoạt tùy chọn "Bật chỉnh sửa nhanh" trong cấu hình khối và cấu hình cột bảng để tùy chỉnh những cột nào có thể được chỉnh sửa nhanh.

![20251023190149](https://static-docs.nocobase.com/20251023190149.png)

![20251023190519](https://static-docs.nocobase.com/20251023190519.gif)

### Bật Bảng Dạng Cây

Khi bảng dữ liệu là bảng phân cấp (dạng cây), khối bảng có thể chọn bật tính năng "Bật bảng dạng cây". Theo mặc định, tùy chọn này được tắt. Sau khi bật, khối sẽ hiển thị dữ liệu dưới cấu trúc dạng cây, đồng thời hỗ trợ các tùy chọn cấu hình và chức năng thao tác tương ứng.

![20251125205918](https://static-docs.nocobase.com/20251125205918.png)

### Mặc định mở rộng tất cả các hàng

Khi bật bảng dạng cây, khối hỗ trợ mở rộng tất cả các dữ liệu con theo mặc định khi được tải.

## Cấu hình Trường

### Trường của bộ sưu tập này

> **Lưu ý**: Các trường từ các bộ sưu tập kế thừa (tức là các trường của bộ sưu tập cha) sẽ tự động được hợp nhất và hiển thị trong danh sách trường hiện tại.

![20251023185113](https://static-docs.nocobase.com/20251023185113.png)

### Trường của các bộ sưu tập liên kết

> **Lưu ý**: Hỗ trợ hiển thị các trường từ các bộ sưu tập liên kết (hiện tại chỉ hỗ trợ quan hệ một-một).

![20251023185239](https://static-docs.nocobase.com/20251023185239.png)

### Các cột tùy chỉnh khác

![20251023185425](https://static-docs.nocobase.com/20251023185425.png)

- [Trường JS](/interface-builder/fields/specific/js-field)
- [Cột JS](/interface-builder/fields/specific/js-column)

## Cấu hình Thao tác

### Thao tác Toàn cục

![20251023171655](https://static-docs.nocobase.com/20251023171655.png)

- [Lọc](/interface-builder/actions/types/filter)
- [Thêm mới](/interface-builder/actions/types/add-new)
- [Xóa](/interface-builder/actions/types/delete)
- [Làm mới](/interface-builder/actions/types/refresh)
- [Nhập](/interface-builder/actions/types/import)
- [Xuất](/interface-builder/actions/types/export)
- [In Mẫu](/template-print/index)
- [Cập nhật Hàng loạt](/interface-builder/actions/types/bulk-update)
- [Xuất Tệp đính kèm](/interface-builder/actions/types/export-attachments)
- [Kích hoạt luồng công việc](/interface-builder/actions/types/trigger-workflow)
- [Thao tác JS](/interface-builder/actions/types/js-action)
- [Nhân viên AI](/interface-builder/actions/types/ai-employee)

### Thao tác trên Hàng

![20251023181019](https://static-docs.nocobase.com/20251023181019.png)

- [Xem](/interface-builder/actions/types/view)
- [Chỉnh sửa](/interface-builder/actions/types/edit)
- [Xóa](/interface-builder/actions/types/delete)
- [Cửa sổ bật lên](/interface-builder/actions/types/pop-up)
- [Liên kết](/interface-builder/actions/types/link)
- [Cập nhật Bản ghi](/interface-builder/actions/types/update-record)
- [In Mẫu](/template-print/index)
- [Kích hoạt luồng công việc](/interface-builder/actions/types/trigger-workflow)
- [Thao tác JS](/interface-builder/actions/types/js-action)
- [Nhân viên AI](/interface-builder/actions/types/ai-employee)