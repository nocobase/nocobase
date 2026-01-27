:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


## Các vấn đề thường gặp và giải pháp

### 1. Cột và ô trống trong mẫu Excel bị biến mất khi kết xuất

**Mô tả vấn đề**: Trong mẫu Excel, nếu một ô không có nội dung hoặc định dạng, nó có thể bị loại bỏ trong quá trình kết xuất, dẫn đến việc ô đó bị thiếu trong tài liệu cuối cùng.

**Giải pháp**:

- **Tô màu nền**: Tô màu nền cho các ô trống trong vùng mục tiêu để đảm bảo các ô vẫn hiển thị trong quá trình kết xuất.
- **Chèn khoảng trắng**: Chèn một ký tự khoảng trắng vào các ô trống, ngay cả khi không có nội dung thực tế, để duy trì cấu trúc của ô.
- **Đặt đường viền**: Thêm kiểu đường viền cho bảng để tăng cường cảm giác ranh giới của ô, tránh việc ô bị biến mất khi kết xuất.

**Ví dụ**:

Trong mẫu Excel, hãy đặt nền màu xám nhạt cho tất cả các ô mục tiêu và chèn khoảng trắng vào các ô trống.

### 2. Các ô đã hợp nhất không hoạt động khi xuất

**Mô tả vấn đề**: Khi sử dụng chức năng lặp để xuất bảng, nếu có các ô đã hợp nhất trong mẫu, có thể dẫn đến kết quả kết xuất bất thường, chẳng hạn như mất hiệu ứng hợp nhất hoặc dữ liệu bị lệch.

**Giải pháp**:

- **Tránh sử dụng các ô đã hợp nhất**: Cố gắng tránh sử dụng các ô đã hợp nhất trong bảng được xuất theo vòng lặp để đảm bảo dữ liệu được kết xuất chính xác.
- **Sử dụng căn giữa qua các cột**: Nếu bạn cần căn giữa văn bản theo chiều ngang qua nhiều ô, hãy sử dụng tính năng “Căn giữa qua các cột” thay vì hợp nhất các ô.
- **Hạn chế vị trí của các ô đã hợp nhất**: Nếu bắt buộc phải sử dụng các ô đã hợp nhất, chỉ hợp nhất ở phía trên hoặc bên phải của bảng, tránh hợp nhất ở phía dưới hoặc bên trái để ngăn ngừa việc mất hiệu ứng hợp nhất khi kết xuất.

### 3. Nội dung bên dưới vùng kết xuất lặp gây lỗi định dạng

**Mô tả vấn đề**: Trong mẫu Excel, nếu có nội dung khác (ví dụ: tóm tắt đơn hàng, ghi chú) bên dưới một vùng lặp (ví dụ: chi tiết đơn hàng) mà vùng này sẽ tự động mở rộng dựa trên số lượng mục dữ liệu, thì khi kết xuất, các hàng dữ liệu được tạo ra từ vòng lặp sẽ mở rộng xuống dưới, trực tiếp ghi đè hoặc đẩy nội dung tĩnh bên dưới, dẫn đến lỗi định dạng và chồng chéo nội dung trong tài liệu cuối cùng.

**Giải pháp**:

  * **Điều chỉnh bố cục, đặt vùng lặp ở phía dưới**: Đây là phương pháp được khuyến nghị nhất. Đặt vùng bảng cần kết xuất lặp ở cuối toàn bộ trang tính. Di chuyển tất cả thông tin ban đầu nằm bên dưới (tóm tắt, chữ ký, v.v.) lên phía trên vùng lặp. Bằng cách này, dữ liệu lặp có thể tự do mở rộng xuống dưới mà không ảnh hưởng đến bất kỳ yếu tố nào khác.
  * **Dự trữ đủ hàng trống**: Nếu bắt buộc phải đặt nội dung bên dưới vùng lặp, bạn có thể ước tính số hàng tối đa mà vòng lặp có thể tạo ra và chèn thủ công đủ số hàng trống làm vùng đệm giữa vùng lặp và nội dung bên dưới. Tuy nhiên, phương pháp này có rủi ro: nếu dữ liệu thực tế vượt quá số hàng ước tính, vấn đề sẽ tái diễn.
  * **Sử dụng mẫu Word**: Nếu yêu cầu bố cục phức tạp và không thể giải quyết bằng cách điều chỉnh cấu trúc Excel, bạn có thể cân nhắc sử dụng tài liệu Word làm mẫu. Các bảng trong Word khi số hàng tăng lên sẽ tự động đẩy nội dung bên dưới xuống, không gây ra vấn đề chồng chéo nội dung, phù hợp hơn cho việc tạo các tài liệu động như vậy.

**Ví dụ**:

**Cách làm sai**: Đặt thông tin “Tóm tắt đơn hàng” ngay bên dưới bảng “Chi tiết đơn hàng” đang lặp.
![20250820080712](https://static-docs.nocobase.com/20250820080712.png)

**Cách làm đúng 1 (Điều chỉnh bố cục)**: Di chuyển thông tin “Tóm tắt đơn hàng” lên phía trên bảng “Chi tiết đơn hàng”, để vùng lặp trở thành yếu tố ở cuối trang.
![20250820082226](https://static-docs.nocobase.com/20250820082226.png)

**Cách làm đúng 2 (Dự trữ hàng trống)**: Dự trữ nhiều hàng trống giữa “Chi tiết đơn hàng” và “Tóm tắt đơn hàng” để đảm bảo nội dung lặp có đủ không gian mở rộng.
![20250820081510](https://static-docs.nocobase.com/20250820081510.png)

**Cách làm đúng 3**: Sử dụng mẫu Word.

### 4. Thông báo lỗi xuất hiện khi kết xuất mẫu

**Mô tả vấn đề**: Trong quá trình kết xuất mẫu, hệ thống hiển thị thông báo lỗi, dẫn đến việc kết xuất thất bại.

**Nguyên nhân có thể**:

- **Lỗi giữ chỗ (placeholder)**: Tên giữ chỗ không khớp với trường dữ liệu hoặc có lỗi cú pháp.
- **Thiếu dữ liệu**: Tập dữ liệu thiếu các trường được tham chiếu trong mẫu.
- **Sử dụng bộ định dạng (formatter) không đúng cách**: Tham số của bộ định dạng sai hoặc loại định dạng không được hỗ trợ.

**Giải pháp**:

- **Kiểm tra giữ chỗ (placeholder)**: Đảm bảo tên giữ chỗ trong mẫu khớp với tên trường trong tập dữ liệu và cú pháp chính xác.
- **Xác thực tập dữ liệu**: Xác nhận rằng tập dữ liệu chứa tất cả các trường được tham chiếu trong mẫu và định dạng dữ liệu đáp ứng yêu cầu.
- **Điều chỉnh bộ định dạng (formatter)**: Kiểm tra cách sử dụng bộ định dạng, đảm bảo các tham số chính xác và sử dụng các loại định dạng được hỗ trợ.

**Ví dụ**:

**Mẫu bị lỗi**:
```
Order ID: {d.orderId}
Order Date: {d.orderDate:format('YYYY/MM/DD')}
Total Amount: {d.totalAmount:format('0.00')}
```

**Tập dữ liệu**:
```json
{
  "orderId": "A123456789",
  "orderDate": "2025-01-01T10:00:00Z"
  // Thiếu trường totalAmount
}
```

**Giải pháp**: Thêm trường `totalAmount` vào tập dữ liệu, hoặc loại bỏ tham chiếu đến `totalAmount` khỏi mẫu.