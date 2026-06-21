---
pkg: "@nocobase/plugin-action-export-pro"
title: "Action Export Pro"
description: "Action Export Pro: tính năng xuất nâng cao, hỗ trợ mẫu tùy chỉnh, xuất nhiều Table, định dạng phức tạp."
keywords: "Export Pro,ExportPro,xuất nâng cao,mẫu tùy chỉnh,Interface Builder,NocoBase"
---
# Export Pro

## Giới thiệu

Plugin Export Pro cung cấp các tính năng nâng cao trên nền tảng tính năng xuất thông thường.

## Cài đặt

Plugin này phụ thuộc vào Plugin quản lý tác vụ bất đồng bộ, trước khi sử dụng cần bật Plugin quản lý tác vụ bất đồng bộ trước.

## Tính năng nâng cao

- Hỗ trợ Action xuất bất đồng bộ, thực thi trên thread độc lập, hỗ trợ xuất lượng dữ liệu lớn.
- Hỗ trợ xuất tập tin đính kèm.

## Hướng dẫn sử dụng

### Cấu hình chế độ xuất

![20251029172829](https://static-docs.nocobase.com/20251029172829.png)

![20251029172914](https://static-docs.nocobase.com/20251029172914.png)


Trên nút xuất, có thể cấu hình chế độ xuất, ba chế độ xuất có thể chọn:

- Tự động: Xác định chế độ xuất theo lượng dữ liệu khi xuất, nếu lượng dữ liệu nhỏ hơn 1000 bản ghi (xuất tập tin đính kèm là 100 bản ghi), thì sử dụng xuất đồng bộ, nếu lượng dữ liệu lớn hơn 1000 bản ghi (xuất tập tin đính kèm là 100 bản ghi), thì sử dụng xuất bất đồng bộ.
- Đồng bộ: Sử dụng xuất đồng bộ, khi xuất sẽ chạy trong thread chính, phù hợp với dữ liệu quy mô nhỏ, nếu thực hiện xuất dữ liệu quy mô lớn ở chế độ đồng bộ, có thể dẫn đến hệ thống bị chặn, lag và không thể xử lý yêu cầu của các người dùng khác.
- Bất đồng bộ: Sử dụng xuất bất đồng bộ, khi xuất sẽ thực thi trên thread nền độc lập, không chặn việc sử dụng hệ thống hiện tại.

### Xuất bất đồng bộ

Sau khi thực hiện xuất, quy trình xuất sẽ thực thi trên thread nền độc lập, không cần bạn cấu hình thủ công. Trong giao diện người dùng, sau khi thực hiện thao tác xuất, phía trên bên phải sẽ hiển thị tác vụ xuất đang thực thi và hiển thị tiến trình tác vụ theo thời gian thực.

![20251029173028](https://static-docs.nocobase.com/20251029173028.png)

Sau khi xuất kết thúc, có thể tải xuống tập tin xuất trong tác vụ xuất.

#### Xuất đồng thời
Khi có nhiều tác vụ xuất đồng thời, sẽ bị ảnh hưởng bởi cấu hình server, dẫn đến hệ thống phản hồi chậm hơn, do đó khuyến nghị nhà phát triển hệ thống cấu hình số lượng tác vụ xuất đồng thời tối đa (mặc định là 3), khi vượt quá số lượng đồng thời được cấu hình, sẽ vào trạng thái xếp hàng.
![20250505171706](https://static-docs.nocobase.com/20250505171706.png)

Cách cấu hình số lượng đồng thời: Biến môi trường ASYNC_TASK_MAX_CONCURRENCY=số_lượng_đồng_thời

Trong các thử nghiệm tổng hợp dưới các cấu hình và độ phức tạp dữ liệu khác nhau, số lượng đồng thời được khuyến nghị:
- 2 nhân CPU, số lượng đồng thời 3.
- 4 nhân CPU, số lượng đồng thời 5.

#### Về hiệu năng
Khi bạn phát hiện quá trình xuất chậm bất thường (tham khảo bên dưới), có thể là vấn đề hiệu năng do cấu trúc Table dữ liệu.

| Đặc điểm dữ liệu | Loại chỉ mục | Lượng dữ liệu | Thời gian xuất |
|---------|---------|--------|---------|
| Không có Field quan hệ | Khóa chính/Ràng buộc duy nhất | 1 triệu | 3-6 phút |
| Không có Field quan hệ | Chỉ mục thông thường | 1 triệu | 6-10 phút |
| Không có Field quan hệ | Chỉ mục liên hợp (không duy nhất) | 1 triệu | 30 phút |
| Field quan hệ<br>(một-một, một-nhiều,<br>nhiều-một, nhiều-nhiều) | Khóa chính/Ràng buộc duy nhất | 500.000 | 15-30 phút | Field quan hệ làm giảm hiệu năng |

Để đảm bảo xuất hiệu quả, khuyến nghị bạn:
1. Table dữ liệu phải đáp ứng các điều kiện sau:

| Loại điều kiện | Điều kiện cần thiết | Mô tả khác |
|---------|------------------------|------|
| Cấu trúc Table (đáp ứng ít nhất một) | Có khóa chính<br>Có ràng buộc duy nhất<br>Có chỉ mục (duy nhất, thông thường, liên hợp) | Ưu tiên: Khóa chính > Ràng buộc duy nhất > Chỉ mục
| Đặc tính Field | Khóa chính/Ràng buộc duy nhất/Chỉ mục (một trong số đó) phải có đặc tính có thể sắp xếp, như: ID tự tăng, ID Snowflake, UUID v1, dấu thời gian, số, v.v.<br>(Lưu ý: UUID v3/v4/v5, chuỗi thông thường, v.v. là các Field không thể sắp xếp sẽ ảnh hưởng đến hiệu năng) | Không có |

2. Giảm các Field xuất không cần thiết, đặc biệt là Field quan hệ (vấn đề hiệu năng do Field quan hệ vẫn đang được tối ưu hóa)
![20250506215940](https://static-docs.nocobase.com/20250506215940.png)
3. Nếu đã đáp ứng các điều kiện trên, vẫn có hiện tượng xuất chậm, có thể phân tích log, hoặc phản hồi cho đội ngũ chính thức.
![20250505182122](https://static-docs.nocobase.com/20250505182122.png)


- [Quy tắc liên kết](/interface-builder/actions/action-settings/linkage-rule): hiển thị/ẩn nút bấm động;
- [Chỉnh sửa nút bấm](/interface-builder/actions/action-settings/edit-button): chỉnh sửa tiêu đề, loại, biểu tượng của nút bấm;
