---
pkg: "@nocobase/plugin-block-list"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Khối Danh sách

## Giới thiệu

Khối Danh sách hiển thị dữ liệu dưới dạng danh sách, phù hợp cho các tình huống hiển thị dữ liệu như danh sách công việc, tin tức và thông tin sản phẩm.

## Cấu hình Khối

![20251023202835](https://static-docs.nocobase.com/20251023202835.png)

### Thiết lập Phạm vi Dữ liệu

Như hình minh họa: Lọc các đơn hàng có trạng thái "Đã hủy".

![20251023202927](https://static-docs.nocobase.com/20251023202927.png)

Để biết thêm chi tiết, vui lòng tham khảo [Thiết lập Phạm vi Dữ liệu](/interface-builder/blocks/block-settings/data-scope)

### Thiết lập Quy tắc Sắp xếp

Như hình minh họa: Sắp xếp theo số tiền đơn hàng giảm dần.

![20251023203022](https://static-docs.nocobase.com/20251023203022.png)

Để biết thêm chi tiết, vui lòng tham khảo [Thiết lập Quy tắc Sắp xếp](/interface-builder/blocks/block-settings/sorting-rule)

## Cấu hình Trường

### Trường từ bộ sưu tập hiện tại

> **Lưu ý**: Các trường từ bộ sưu tập kế thừa (tức là các trường từ bộ sưu tập cha) sẽ tự động được hợp nhất và hiển thị trong danh sách trường hiện tại.

![20251023203103](https://static-docs.nocobase.com/20251023203103.png)

### Trường từ bộ sưu tập liên kết

> **Lưu ý**: Có thể hiển thị các trường từ bộ sưu tập liên kết (hiện tại chỉ hỗ trợ mối quan hệ một-một).

![20251023203611](https://static-docs.nocobase.com/20251023203611.png)

Để cấu hình trường danh sách, vui lòng tham khảo [Trường Chi tiết](/interface-builder/fields/generic/detail-form-item)

## Cấu hình Thao tác

### Thao tác Toàn cục

![20251023203918](https://static-docs.nocobase.com/20251023203918.png)

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
- [JS Action](/interface-builder/actions/types/js-action)
- [Nhân viên AI](/interface-builder/actions/types/ai-employee)

### Thao tác trên Dòng

![20251023204329](https://static-docs.nocobase.com/20251023204329.png)

- [Chỉnh sửa](/interface-builder/actions/types/edit)
- [Xóa](/interface-builder/actions/types/delete)
- [Liên kết](/interface-builder/actions/types/link)
- [Cửa sổ bật lên](/interface-builder/actions/types/pop-up)
- [Cập nhật Bản ghi](/interface-builder/actions/types/update-record)
- [In Mẫu](/template-print/index)
- [Kích hoạt luồng công việc](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [Nhân viên AI](/interface-builder/actions/types/ai-employee)