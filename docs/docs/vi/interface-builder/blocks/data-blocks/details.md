:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Khối Chi tiết

## Giới thiệu

Khối Chi tiết dùng để hiển thị các giá trị trường của từng bản ghi dữ liệu. Khối này hỗ trợ bố cục trường linh hoạt và tích hợp sẵn nhiều chức năng thao tác dữ liệu, giúp người dùng dễ dàng xem và quản lý thông tin.

## Cài đặt Khối

![20251029202614](https://static-docs.nocobase.com/20251029202614.png)

### Quy tắc Liên kết Khối

Kiểm soát hành vi của khối (ví dụ: có hiển thị hay thực thi JavaScript hay không) thông qua các quy tắc liên kết.

![20251023195004](https://static-docs.nocobase.com/20251023195004.png)
Để biết thêm chi tiết, tham khảo [Quy tắc Liên kết](/interface-builder/linkage-rule)

### Đặt Phạm vi Dữ liệu

Ví dụ: Chỉ hiển thị các đơn hàng đã thanh toán

![20251023195051](https://static-docs.nocobase.com/20251023195051.png)

Để biết thêm chi tiết, tham khảo [Đặt Phạm vi Dữ liệu](/interface-builder/blocks/block-settings/data-scope)

### Quy tắc Liên kết Trường

Các quy tắc liên kết trong khối Chi tiết hỗ trợ thiết lập động việc hiển thị/ẩn các trường.

Ví dụ: Không hiển thị số tiền khi trạng thái đơn hàng là "Đã hủy".

![20251023200739](https://static-docs.nocobase.com/20251023200739.png)

Để biết thêm chi tiết, tham khảo [Quy tắc Liên kết](/interface-builder/linkage-rule)

## Cấu hình Trường

### Trường từ bộ sưu tập này

> **Lưu ý**: Các trường từ các bộ sưu tập kế thừa (tức là các trường của bộ sưu tập cha) sẽ tự động được hợp nhất và hiển thị trong danh sách trường hiện tại.

![20251023201012](https://static-docs.nocobase.com/20251023201012.png)

### Trường từ các bộ sưu tập liên kết

> **Lưu ý**: Hỗ trợ hiển thị các trường từ các bộ sưu tập liên kết (hiện tại chỉ hỗ trợ quan hệ một-một).

![20251023201258](https://static-docs.nocobase.com/20251023201258.png)

### Các Trường Khác
- JS Field
- JS Item
- Dòng phân cách
- Markdown

![20251023201514](https://static-docs.nocobase.com/20251023201514.png)

> **Mẹo**: Bạn có thể viết JavaScript để triển khai nội dung hiển thị tùy chỉnh, cho phép bạn trình bày thông tin phức tạp hơn.  
> Ví dụ, bạn có thể hiển thị các hiệu ứng khác nhau dựa trên các loại dữ liệu, điều kiện hoặc logic khác nhau.

![20251023202017](https://static-docs.nocobase.com/20251023202017.png)

## Cấu hình Thao tác

![20251023200529](https://static-docs.nocobase.com/20251023200529.png)

- [Chỉnh sửa](/interface-builder/actions/types/edit)
- [Xóa](/interface-builder/actions/types/delete)
- [Liên kết](/interface-builder/actions/types/link)
- [Cửa sổ bật lên](/interface-builder/actions/types/pop-up)
- [Cập nhật Bản ghi](/interface-builder/actions/types/update-record)
- [Kích hoạt luồng công việc](/interface-builder/actions/types/trigger-workflow)
- [Thao tác JS](/interface-builder/actions/types/js-action)
- [Nhân viên AI](/interface-builder/actions/types/ai-employee)