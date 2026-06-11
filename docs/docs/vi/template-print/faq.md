---
title: "Template In ấn - Câu hỏi thường gặp"
description: "Câu hỏi thường gặp về Template In ấn: ô trống Excel biến mất, ô gộp không hiệu quả, render vòng lặp lộn xộn... và các giải pháp."
keywords: "Template In ấn,FAQ,Câu hỏi thường gặp,Excel,NocoBase"
---

## Câu hỏi thường gặp và giải pháp

### 1. Cột trống và ô trống trong Template Excel biến mất trong kết quả render

**Mô tả vấn đề**: Trong Template Excel, nếu một ô không có nội dung hoặc kiểu dáng, có thể bị loại bỏ khi render, dẫn đến mất ô đó trong tài liệu cuối.

**Giải pháp**:

- **Tô màu nền**: Tô màu nền cho các ô trống trong vùng mục tiêu, đảm bảo ô vẫn hiển thị trong quá trình render.
- **Chèn khoảng trắng**: Chèn một ký tự khoảng trắng vào ô trống, dù không có nội dung thực, vẫn có thể giữ cấu trúc ô.
- **Thiết lập viền**: Thêm kiểu viền cho bảng, tăng cường ranh giới ô, tránh ô biến mất khi render.

**Ví dụ**:

Trong Template Excel, đặt nền màu xám nhạt cho tất cả ô mục tiêu, và chèn khoảng trắng vào các ô trống.

### 2. Ô gộp không hiệu quả khi xuất

**Mô tả vấn đề**: Khi sử dụng tính năng vòng lặp để xuất bảng, nếu trong Template có ô gộp, có thể dẫn đến kết quả render bất thường, như mất hiệu ứng gộp hoặc dữ liệu lệch vị trí.

**Giải pháp**:

- **Tránh sử dụng ô gộp**: Cố gắng tránh sử dụng ô gộp trong bảng xuất vòng lặp, để đảm bảo render dữ liệu chính xác.
- **Sử dụng căn giữa qua nhiều cột**: Nếu cần văn bản căn giữa ngang trong nhiều ô, có thể sử dụng tính năng "Căn giữa qua nhiều cột", thay vì gộp ô.
- **Giới hạn vị trí ô gộp**: Nếu phải sử dụng ô gộp, vui lòng chỉ gộp ở phía trên hoặc bên phải của bảng, tránh gộp ở dưới hoặc bên trái, để tránh mất hiệu ứng gộp khi render.



### 3. Nội dung dưới vùng render vòng lặp dẫn đến định dạng lộn xộn

**Mô tả vấn đề**: Trong Template Excel, nếu trong một vùng vòng lặp tăng động theo các mục dữ liệu (ví dụ, chi tiết Đơn hàng), bên dưới còn có nội dung khác (ví dụ, tổng kết Đơn hàng, ghi chú), thì khi render, các hàng dữ liệu sinh ra trong vòng lặp sẽ mở rộng xuống dưới, trực tiếp đè hoặc đẩy nội dung tĩnh ở dưới, dẫn đến định dạng tài liệu cuối lộn xộn, nội dung chồng chéo.

**Giải pháp**:

  * **Điều chỉnh bố cục, đặt vùng vòng lặp ở dưới cùng**: Đây là cách được khuyến nghị nhất. Đặt vùng bảng cần render vòng lặp ở dưới cùng của toàn bộ worksheet. Di chuyển tất cả thông tin tổng kết, chữ ký... ban đầu nằm bên dưới lên phía trên vùng vòng lặp. Như vậy, dữ liệu vòng lặp có thể tự do mở rộng xuống dưới mà không ảnh hưởng đến bất kỳ phần tử nào khác.
  * **Để đủ hàng trống**: Nếu phải đặt nội dung bên dưới vùng vòng lặp, có thể ước tính số hàng tối đa mà vòng lặp có thể sinh ra, và chèn thủ công đủ nhiều hàng trống làm vùng đệm giữa vùng vòng lặp và nội dung bên dưới. Nhưng cách này có rủi ro, một khi dữ liệu thực vượt quá số hàng ước tính, vấn đề sẽ lại xuất hiện.
  * **Sử dụng Template Word**: Nếu yêu cầu bố cục phức tạp, không thể giải quyết bằng cách điều chỉnh cấu trúc Excel, có thể xem xét sử dụng tài liệu Word làm Template. Bảng trong Word khi tăng số hàng, sẽ tự động đẩy nội dung bên dưới ra sau, không xảy ra vấn đề chồng chéo nội dung, phù hợp hơn cho việc sinh tài liệu động loại này.

**Ví dụ**:

**Cách sai**: Đặt thông tin "Tổng kết Đơn hàng" ngay sau bảng vòng lặp "Chi tiết Đơn hàng".
![20250820080712](https://static-docs.nocobase.com/20250820080712.png)

**Cách đúng 1 (Điều chỉnh bố cục)**: Di chuyển thông tin "Tổng kết Đơn hàng" lên phía trên bảng "Chi tiết Đơn hàng", để vùng vòng lặp trở thành phần tử ở dưới cùng của trang.
![20250820082226](https://static-docs.nocobase.com/20250820082226.png)

**Cách đúng 2 (Để hàng trống)**: Để nhiều hàng trống giữa "Chi tiết Đơn hàng" và "Tổng kết Đơn hàng", đảm bảo nội dung vòng lặp có đủ không gian mở rộng.
![20250820081510](https://static-docs.nocobase.com/20250820081510.png)

**Cách đúng 3**: Sử dụng Template Word.






### 4. Xuất hiện thông báo lỗi khi render Template

**Mô tả vấn đề**: Trong quá trình render Template, hệ thống hiển thị thông báo lỗi, dẫn đến render thất bại.

**Nguyên nhân có thể**:

- **Lỗi placeholder**: Tên placeholder không khớp với trường dataset hoặc lỗi cú pháp.
- **Thiếu dữ liệu**: Dataset thiếu trường được tham chiếu trong Template.
- **Sử dụng Formatter không đúng**: Tham số Formatter sai hoặc loại Định dạng không hỗ trợ.

**Giải pháp**:

- **Kiểm tra placeholder**: Đảm bảo tên placeholder trong Template khớp với tên trường trong dataset, và cú pháp đúng.
- **Xác minh dataset**: Xác nhận dataset chứa tất cả trường được tham chiếu trong Template, và định dạng dữ liệu đáp ứng yêu cầu.
- **Điều chỉnh Formatter**: Kiểm tra cách sử dụng Formatter, đảm bảo tham số đúng, và sử dụng loại Định dạng được hỗ trợ.

**Ví dụ**:

**Template lỗi**:
```
Mã Đơn hàng: {d.orderId}
Ngày Đơn hàng: {d.orderDate:format('YYYY/MM/DD')}
Tổng giá trị: {d.totalAmount:format('0.00')}
```

**Dataset**:
```json
{
  "orderId": "A123456789",
  "orderDate": "2025-01-01T10:00:00Z"
  // Thiếu trường totalAmount
}
```

**Giải pháp**: Thêm trường `totalAmount` vào dataset, hoặc loại bỏ tham chiếu đến `totalAmount` khỏi Template.
