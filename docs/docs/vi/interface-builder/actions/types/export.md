---
pkg: "@nocobase/plugin-action-export"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Xuất dữ liệu

## Giới thiệu

Tính năng xuất cho phép xuất các bản ghi đã lọc ra định dạng **Excel**, đồng thời hỗ trợ cấu hình các trường dữ liệu cần xuất. Người dùng có thể chọn các trường dữ liệu cần xuất tùy theo nhu cầu để phân tích, xử lý hoặc lưu trữ dữ liệu sau này. Tính năng này nâng cao tính linh hoạt trong thao tác dữ liệu, đặc biệt hữu ích trong các trường hợp cần chuyển dữ liệu sang nền tảng khác hoặc xử lý thêm.

### Điểm nổi bật của tính năng:
- **Chọn trường dữ liệu**: Người dùng có thể cấu hình và chọn các trường dữ liệu cần xuất, đảm bảo dữ liệu xuất ra chính xác và gọn gàng.
- **Hỗ trợ định dạng Excel**: Dữ liệu xuất ra sẽ được lưu dưới dạng tệp Excel tiêu chuẩn, giúp dễ dàng tích hợp và phân tích với các dữ liệu khác.

Với tính năng này, người dùng có thể dễ dàng xuất các dữ liệu quan trọng từ công việc của mình để sử dụng bên ngoài, từ đó nâng cao hiệu quả công việc.

![20251029170811](https://static-docs.nocobase.com/20251029170811.png)

## Cấu hình hành động

![20251029171452](https://static-docs.nocobase.com/20251029171452.png)

### Các trường dữ liệu có thể xuất

- Cấp độ thứ nhất: Tất cả các trường của **bộ sưu tập** hiện tại;
- Cấp độ thứ hai: Nếu là trường quan hệ, cần chọn các trường từ **bộ sưu tập** liên quan;
- Cấp độ thứ ba: Chỉ xử lý ba cấp độ; các trường quan hệ ở cấp độ cuối cùng sẽ không hiển thị;

![20251029171557](https://static-docs.nocobase.com/20251029171557.png)

- [Quy tắc liên kết](/interface-builder/actions/action-settings/linkage-rule): Hiển thị/ẩn nút một cách linh hoạt;
- [Chỉnh sửa nút](/interface-builder/actions/action-settings/edit-button): Chỉnh sửa tiêu đề, loại và biểu tượng của nút;