:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Câu hỏi thường gặp

## Vấn đề chọn biểu đồ
### Làm thế nào để chọn biểu đồ phù hợp?
Trả lời: Hãy chọn dựa trên mục tiêu dữ liệu của bạn:
- Xu hướng và sự thay đổi: biểu đồ đường hoặc biểu đồ vùng
- So sánh giá trị: biểu đồ cột hoặc biểu đồ thanh
- Cấu trúc tỷ lệ: biểu đồ tròn hoặc biểu đồ vành khuyên
- Tương quan và phân phối: biểu đồ phân tán
- Cấu trúc phân cấp và tiến độ: biểu đồ phễu

Để biết thêm các loại biểu đồ, vui lòng tham khảo [ví dụ ECharts](https://echarts.apache.org/examples).

### NocoBase hỗ trợ những loại biểu đồ nào?
Trả lời: Chế độ cấu hình trực quan tích hợp sẵn các biểu đồ phổ biến (biểu đồ đường, biểu đồ vùng, biểu đồ cột, biểu đồ thanh, biểu đồ tròn, biểu đồ vành khuyên, biểu đồ phễu, biểu đồ phân tán, v.v.); chế độ cấu hình tùy chỉnh cho phép sử dụng tất cả các loại biểu đồ của ECharts.

## Vấn đề truy vấn dữ liệu
### Chế độ cấu hình trực quan và chế độ cấu hình SQL có tương thích với nhau không?
Trả lời: Không tương thích. Các cấu hình được lưu trữ độc lập. Chế độ cấu hình được sử dụng khi bạn lưu lần cuối sẽ có hiệu lực.

## Vấn đề tùy chọn biểu đồ
### Làm thế nào để cấu hình các trường dữ liệu cho biểu đồ?
Trả lời: Trong chế độ cấu hình trực quan, hãy chọn các trường dữ liệu tương ứng với loại biểu đồ. Ví dụ, biểu đồ đường/biểu đồ cột cần cấu hình trường trục X và trục Y, biểu đồ tròn cần cấu hình trường danh mục và trường giá trị.
Chúng tôi khuyên bạn nên chạy "Truy vấn" trước để kiểm tra xem dữ liệu có đúng như mong đợi không, vì mặc định các trường dữ liệu biểu đồ sẽ được tự động khớp.

## Vấn đề xem trước/lưu
### Sau khi sửa đổi cấu hình có cần xem trước thủ công không?
Trả lời: Ở chế độ cấu hình trực quan, sau khi sửa đổi cấu hình sẽ tự động xem trước. Đối với chế độ SQL và cấu hình tùy chỉnh, để tránh làm mới liên tục, vui lòng hoàn tất việc chỉnh sửa và nhấp vào "Xem trước" thủ công.

### Tại sao hiệu ứng xem trước biểu đồ bị mất sau khi đóng cửa sổ bật lên?
Trả lời: Hiệu ứng xem trước chỉ dùng để xem tạm thời. Sau khi sửa đổi cấu hình, vui lòng lưu trước khi đóng. Các thay đổi chưa được lưu sẽ không được giữ lại.