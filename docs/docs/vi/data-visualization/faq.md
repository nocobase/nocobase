---
title: "Câu hỏi thường gặp về Trực quan hóa Dữ liệu"
description: "Các câu hỏi thường gặp về lựa chọn biểu đồ, sự tương tác giữa Builder/SQL trong truy vấn dữ liệu, ánh xạ field, preview và lưu, các loại biểu đồ ECharts, v.v."
keywords: "FAQ trực quan hóa dữ liệu,lựa chọn biểu đồ,line chart,bar chart,pie chart,Builder,SQL mode,preview save,NocoBase"
---

# Câu hỏi thường gặp

## Vấn đề lựa chọn biểu đồ
### Tôi nên chọn biểu đồ phù hợp như thế nào?
Trả lời: Chọn dựa trên mục tiêu dữ liệu:
- Xu hướng và biến động: line chart hoặc area chart
- So sánh giá trị: bar chart hoặc column chart
- Cấu trúc tỷ lệ: pie chart hoặc doughnut chart
- Tương quan và phân bố: scatter chart
- Cấu trúc phân cấp và tiến trình: funnel chart

Để xem thêm các loại biểu đồ, vui lòng tham khảo [ECharts Examples](https://echarts.apache.org/examples).

### NocoBase hỗ trợ những biểu đồ nào?
Trả lời: Cấu hình trực quan có sẵn các biểu đồ thông dụng (line, area, bar, column, pie, doughnut, funnel, scatter, v.v.); cấu hình tùy chỉnh có thể sử dụng tất cả các loại biểu đồ của ECharts.

## Vấn đề truy vấn dữ liệu
### Cấu hình trực quan và cấu hình SQL có tương thích với nhau không?
Trả lời: Không tương thích, các cấu hình được lưu trữ độc lập. Chế độ cấu hình tại lần lưu cuối cùng sẽ có hiệu lực.

## Vấn đề tùy chọn biểu đồ
### Tôi nên cấu hình field biểu đồ như thế nào?
Trả lời: Trong cấu hình trực quan, chọn các field dữ liệu tương ứng theo loại biểu đồ. Ví dụ, line chart/bar chart cần cấu hình field trục X và trục Y, pie chart cần cấu hình field phân loại và field giá trị.
Khuyến nghị thực hiện "Chạy truy vấn" trước để xem dữ liệu có đúng như mong đợi không, mặc định sẽ tự động khớp các field biểu đồ.

## Vấn đề preview/lưu
### Có cần preview thủ công sau khi sửa cấu hình không?
Trả lời: Trong chế độ cấu hình trực quan, sau khi sửa cấu hình sẽ tự động preview. Trong chế độ SQL, cấu hình tùy chỉnh, để tránh refresh thường xuyên, hãy click "Preview" thủ công sau khi viết xong.

### Hiệu quả preview biểu đồ bị mất sau khi đóng popup?
Trả lời: Hiệu quả preview chỉ dùng để xem tạm thời, sau khi sửa cấu hình vui lòng lưu trước khi đóng, các thay đổi chưa lưu sẽ không được giữ lại.
