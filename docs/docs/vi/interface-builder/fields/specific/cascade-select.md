:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Chọn theo cấp bậc (Cascading Selection)

## Giới thiệu

Bộ chọn theo cấp bậc được thiết kế cho các trường liên kết mà `bộ sưu tập` đích là một bảng dạng cây. Nó cho phép người dùng chọn dữ liệu theo cấu trúc phân cấp của `bộ sưu tập` dạng cây và hỗ trợ tìm kiếm mờ (fuzzy search) để lọc nhanh chóng.

## Hướng dẫn sử dụng

- Đối với liên kết **một-một**, bộ chọn theo cấp bậc là **chọn đơn**.

![20251125214656](https://static-docs.nocobase.com/20251125214656.png)

- Đối với liên kết **một-nhiều**, bộ chọn theo cấp bậc là **chọn đa**.

![20251125215318](https://static-docs.nocobase.com/20251125215318.png)

## Tùy chọn cấu hình trường

### Trường tiêu đề

Trường tiêu đề xác định nhãn hiển thị cho mỗi tùy chọn.

![20251125214923](https://static-docs.nocobase.com/20251125214923.gif)

> Hỗ trợ tìm kiếm nhanh dựa trên trường tiêu đề

![20251125215026](https://static-docs.nocobase.com/20251125215026.gif)

Để biết thêm chi tiết, hãy xem:
[Trường tiêu đề](/interface-builder/fields/field-settings/title-field)

### Phạm vi dữ liệu

Kiểm soát phạm vi dữ liệu của danh sách dạng cây (nếu một bản ghi con khớp với các điều kiện, bản ghi cha của nó cũng sẽ được bao gồm).

![20251125215111](https://static-docs.nocobase.com/20251125215111.png)

Để biết thêm chi tiết, hãy xem:
[Phạm vi dữ liệu](/interface-builder/fields/field-settings/data-scope)

Các thành phần trường khác:
[Các thành phần trường](/interface-builder/fields/association-field)