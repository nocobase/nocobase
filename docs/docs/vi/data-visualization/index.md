---
pkg: "@nocobase/plugin-data-visualization"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Tổng quan

Plugin trực quan hóa dữ liệu của NocoBase cung cấp khả năng truy vấn dữ liệu trực quan và bộ thành phần biểu đồ phong phú. Người dùng có thể nhanh chóng xây dựng các bảng điều khiển trực quan, trình bày thông tin chi tiết về dữ liệu và hỗ trợ phân tích, hiển thị dữ liệu đa chiều chỉ với vài thao tác cấu hình đơn giản.

![clipboard-image-1761749573](https://static-docs.nocobase.com/clipboard-image-1761749573.png)

## Các khái niệm cơ bản
- **Khối biểu đồ:** Một thành phần biểu đồ có thể cấu hình trên trang, hỗ trợ truy vấn dữ liệu, tùy chọn biểu đồ và các sự kiện tương tác.
- **Truy vấn dữ liệu (Builder / SQL):** Cấu hình trực quan bằng Builder hoặc viết SQL để lấy dữ liệu.
- **Đo lường (Measures) và Chiều (Dimensions):** Đo lường dùng để tổng hợp giá trị số; Chiều dùng để nhóm dữ liệu (ví dụ: ngày, danh mục, khu vực).
- **Ánh xạ trường:** Ánh xạ các cột kết quả truy vấn tới các trường cốt lõi của biểu đồ, như `xField`, `yField`, `seriesField` hoặc `Category / Value`.
- **Tùy chọn biểu đồ (Basic / Custom):** Basic cấu hình các thuộc tính phổ biến một cách trực quan; Custom trả về một `option` ECharts hoàn chỉnh thông qua JS.
- **Chạy truy vấn:** Chạy truy vấn và lấy dữ liệu trong bảng cấu hình; có thể chuyển đổi giữa Table / JSON để xem dữ liệu trả về.
- **Xem trước và Lưu:** Xem trước chỉ là hiệu ứng tạm thời; sau khi nhấp vào "Lưu", cấu hình sẽ được ghi vào cơ sở dữ liệu và chính thức có hiệu lực.
- **Biến ngữ cảnh:** Tái sử dụng thông tin ngữ cảnh của trang, người dùng, bộ lọc, v.v. (ví dụ: `{{ ctx.user.id }}`) để cấu hình truy vấn và biểu đồ.
- **Bộ lọc trang và liên kết:** Các "khối bộ lọc" cấp trang thu thập các điều kiện đầu vào thống nhất, tự động hợp nhất vào các truy vấn biểu đồ và làm mới các biểu đồ liên kết.
- **Sự kiện tương tác:** Đăng ký các sự kiện thông qua `chart.on` để kích hoạt các hành vi như làm nổi bật, điều hướng và truy sâu (drill-down).

## Cài đặt
Trực quan hóa dữ liệu là một plugin tích hợp sẵn của NocoBase; nó hoạt động ngay lập tức mà không cần cài đặt riêng.