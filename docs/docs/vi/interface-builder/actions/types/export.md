---
pkg: "@nocobase/plugin-action-export"
title: "Action xuất"
description: "Action xuất: xuất dữ liệu sang định dạng Excel và các định dạng khác, hỗ trợ xuất Trang hiện tại/tất cả dữ liệu."
keywords: "Action xuất,Export,xuất Excel,xuất dữ liệu,Interface Builder,NocoBase"
---
# Xuất

## Giới thiệu

Tính năng xuất cho phép xuất các bản ghi đã lọc sang định dạng **Excel**, hỗ trợ cấu hình Field xuất. Bạn có thể chọn các Field cần xuất theo nhu cầu, để phục vụ phân tích, xử lý hoặc lưu trữ dữ liệu sau này. Tính năng này nâng cao tính linh hoạt của thao tác dữ liệu, đặc biệt phù hợp với các trường hợp cần chuyển dữ liệu sang nền tảng khác hoặc xử lý thêm.

### Điểm nổi bật của tính năng:
- **Chọn Field**: Bạn có thể cấu hình chọn các Field xuất, đảm bảo dữ liệu xuất ra chính xác và gọn gàng.
- **Hỗ trợ định dạng Excel**: Dữ liệu xuất ra sẽ được lưu thành file Excel chuẩn, thuận tiện để tích hợp phân tích với dữ liệu khác.

Thông qua tính năng này, bạn có thể dễ dàng xuất dữ liệu quan trọng trong công việc và sử dụng bên ngoài, nâng cao hiệu suất công việc.

![20251029170811](https://static-docs.nocobase.com/20251029170811.png)
## Tùy chọn cấu hình Action

![20251029171452](https://static-docs.nocobase.com/20251029171452.png)

### Field có thể xuất

- Cấp đầu tiên: Tất cả Field của collection hiện tại;
- Cấp thứ hai: Nếu là Field quan hệ, cần chọn Field của Table liên kết;
- Cấp thứ ba: Chỉ xử lý ba cấp, Field quan hệ ở cấp cuối không hiển thị;

![20251029171557](https://static-docs.nocobase.com/20251029171557.png)

- [Quy tắc liên kết](/interface-builder/actions/action-settings/linkage-rule): hiển thị/ẩn nút bấm động;
- [Chỉnh sửa nút bấm](/interface-builder/actions/action-settings/edit-button): chỉnh sửa tiêu đề, loại, biểu tượng của nút bấm;
