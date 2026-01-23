---
pkg: "@nocobase/plugin-action-export-pro"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Xuất Pro

## Giới thiệu

Plugin Xuất Pro cung cấp các tính năng nâng cao dựa trên chức năng xuất dữ liệu tiêu chuẩn.

## Cài đặt

Plugin này phụ thuộc vào plugin Quản lý tác vụ bất đồng bộ. Bạn cần bật plugin Quản lý tác vụ bất đồng bộ trước khi sử dụng.

## Các cải tiến tính năng

- Hỗ trợ các thao tác xuất dữ liệu bất đồng bộ, được thực thi trong một luồng riêng biệt, cho phép xuất lượng lớn dữ liệu.
- Hỗ trợ xuất tệp đính kèm.

## Hướng dẫn sử dụng

### Cấu hình chế độ xuất dữ liệu

![20251029172829](https://static-docs.nocobase.com/20251029172829.png)

![20251029172914](https://static-docs.nocobase.com/20251029172914.png)

Trên nút xuất dữ liệu, bạn có thể cấu hình chế độ xuất. Có ba chế độ tùy chọn:

- Tự động: Chế độ xuất sẽ được xác định dựa trên khối lượng dữ liệu. Nếu số lượng bản ghi nhỏ hơn 1000 (hoặc 100 đối với xuất tệp đính kèm), hệ thống sẽ sử dụng chế độ xuất đồng bộ. Nếu số lượng bản ghi lớn hơn 1000 (hoặc 100 đối với xuất tệp đính kèm), hệ thống sẽ sử dụng chế độ xuất bất đồng bộ.
- Đồng bộ: Sử dụng chế độ xuất đồng bộ, quá trình xuất sẽ chạy trong luồng chính. Chế độ này phù hợp với dữ liệu quy mô nhỏ. Nếu xuất lượng lớn dữ liệu ở chế độ đồng bộ, hệ thống có thể bị tắc nghẽn, giật lag và không thể xử lý các yêu cầu khác từ người dùng.
- Bất đồng bộ: Sử dụng chế độ xuất bất đồng bộ, quá trình xuất sẽ được thực thi trong một luồng nền riêng biệt và không làm tắc nghẽn hoạt động của hệ thống hiện tại.

### Xuất dữ liệu bất đồng bộ

Sau khi bắt đầu xuất dữ liệu, quá trình này sẽ chạy trong một luồng nền riêng biệt mà không yêu cầu người dùng cấu hình thủ công. Trong giao diện người dùng, sau khi thực hiện thao tác xuất, tác vụ xuất đang chạy sẽ hiển thị ở góc trên bên phải, cùng với tiến độ thực thi theo thời gian thực.

![20251029173028](https://static-docs.nocobase.com/20251029173028.png)

Sau khi quá trình xuất hoàn tất, bạn có thể tải xuống tệp đã xuất từ các tác vụ xuất.

#### Xuất dữ liệu đồng thời

Khi có nhiều tác vụ xuất dữ liệu đồng thời, hiệu suất hệ thống có thể bị ảnh hưởng bởi cấu hình máy chủ, dẫn đến phản hồi chậm hơn. Do đó, khuyến nghị các nhà phát triển hệ thống cấu hình số lượng tác vụ xuất đồng thời tối đa (mặc định là 3). Khi số lượng tác vụ vượt quá giới hạn cấu hình, các tác vụ mới sẽ được đưa vào trạng thái chờ.

![20250505171706](https://static-docs.nocobase.com/20250505171706.png)

Cách cấu hình số lượng đồng thời: Biến môi trường `ASYNC_TASK_MAX_CONCURRENCY=số_lượng_đồng_thời`

Dựa trên các thử nghiệm toàn diện với nhiều cấu hình và độ phức tạp dữ liệu khác nhau, số lượng đồng thời được khuyến nghị là:
- CPU 2 lõi, số lượng đồng thời 3.
- CPU 4 lõi, số lượng đồng thời 5.

#### Về hiệu suất

Khi bạn nhận thấy quá trình xuất dữ liệu chậm bất thường (tham khảo bảng dưới đây), đây có thể là vấn đề về hiệu suất do cấu trúc của **bộ sưu tập** dữ liệu gây ra.

| Đặc điểm dữ liệu | Loại chỉ mục | Khối lượng dữ liệu | Thời gian xuất |
|---------|---------|--------|---------|
| Trường không có quan hệ | Khóa chính / Ràng buộc duy nhất | 1 triệu | 3～6 phút |  
| Trường không có quan hệ | Chỉ mục thông thường | 1 triệu | 6～10 phút | 
| Trường không có quan hệ | Chỉ mục tổng hợp (không duy nhất) | 1 triệu | 30 phút | 
| Trường có quan hệ<br>(Một-một, Một-nhiều,<br>Nhiều-một, Nhiều-nhiều) | Khóa chính / Ràng buộc duy nhất | 500 nghìn | 15～30 phút | Trường có quan hệ làm giảm hiệu suất |

Để đảm bảo quá trình xuất dữ liệu hiệu quả, chúng tôi khuyến nghị bạn:
1. **Bộ sưu tập** dữ liệu phải đáp ứng các điều kiện sau:

| Loại điều kiện | Điều kiện bắt buộc | Ghi chú khác |
|---------|------------------------|------|
| Cấu trúc **bộ sưu tập** (đáp ứng ít nhất một) | Có Khóa chính<br>Có Ràng buộc duy nhất<br>Có Chỉ mục (duy nhất, thông thường, tổng hợp) | Ưu tiên: Khóa chính > Ràng buộc duy nhất > Chỉ mục
| Đặc điểm trường | Khóa chính / Ràng buộc duy nhất / Chỉ mục (một trong số đó) phải có đặc tính có thể sắp xếp, ví dụ: ID tự tăng, ID Snowflake, UUID v1, dấu thời gian, số, v.v.<br>(Lưu ý: Các trường không thể sắp xếp như UUID v3/v4/v5, chuỗi thông thường, v.v., sẽ ảnh hưởng đến hiệu suất) | Không có |

2. Giảm số lượng trường không cần thiết cần xuất, đặc biệt là các trường có quan hệ (các vấn đề về hiệu suất do trường có quan hệ gây ra vẫn đang được tối ưu hóa).

![20250506215940](https://static-docs.nocobase.com/20250506215940.png)

3. Nếu đã đáp ứng các điều kiện trên mà quá trình xuất vẫn chậm, bạn có thể tiến hành phân tích nhật ký (log) hoặc gửi phản hồi cho đội ngũ chính thức.

![20250505182122](https://static-docs.nocobase.com/20250505182122.png)

- [Quy tắc liên kết](/interface-builder/actions/action-settings/linkage-rule): Hiển thị/ẩn nút động;
- [Chỉnh sửa nút](/interface-builder/actions/action-settings/edit-button): Chỉnh sửa tiêu đề, loại và biểu tượng của nút;