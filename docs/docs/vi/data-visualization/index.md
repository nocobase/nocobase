---
pkg: "@nocobase/plugin-data-visualization"
title: "Tổng quan Trực quan hóa Dữ liệu"
description: "Trực quan hóa Dữ liệu NocoBase: chart block, truy vấn dữ liệu Builder/SQL, measure và dimension, cấu hình ECharts, sự kiện tương tác, liên kết với page filter, phân tích đa chiều."
keywords: "trực quan hóa dữ liệu,chart block,ECharts,dashboard,measure,dimension,Builder,truy vấn SQL,NocoBase"
---

# Tổng quan

Plugin Trực quan hóa Dữ liệu của NocoBase cung cấp khả năng truy vấn dữ liệu trực quan và các component biểu đồ phong phú.
Bạn có thể nhanh chóng xây dựng dashboard trực quan thông qua cấu hình đơn giản, hiển thị các insight dữ liệu và hỗ trợ phân tích, hiển thị dữ liệu đa chiều.

![clipboard-image-1761749573](https://static-docs.nocobase.com/clipboard-image-1761749573.png)

## Khái niệm cơ bản
- Chart block: Một component biểu đồ có thể cấu hình trong trang, hỗ trợ truy vấn dữ liệu, các tùy chọn biểu đồ và sự kiện tương tác.
- Truy vấn dữ liệu (Builder / SQL): Lấy dữ liệu thông qua cấu hình giao diện Builder, hoặc viết SQL.
- Measure (Độ đo) và Dimension (Chiều): Measure dùng để tổng hợp số liệu, dimension dùng để nhóm (như ngày, danh mục, khu vực).
- Ánh xạ field: Ánh xạ các cột kết quả truy vấn vào các field cốt lõi của biểu đồ, như `xField`, `yField`, `seriesField` hoặc `Category / Value`.
- Tùy chọn biểu đồ (Basic / Custom): Basic cấu hình các thuộc tính thông dụng theo cách trực quan; Custom trả về `option` ECharts đầy đủ qua JS.
- Chạy truy vấn: Chạy truy vấn để lấy dữ liệu trong panel cấu hình, có thể chuyển đổi xem dữ liệu trả về dưới dạng Table / JSON.
- Preview và lưu: Preview là hiệu ứng tạm thời; sau khi click "Lưu" cấu hình sẽ được ghi vào database và chính thức có hiệu lực.
- Biến context: Tái sử dụng các thông tin context như trang, người dùng, filter, v.v. (như `{{ ctx.user.id }}`) cho truy vấn và cấu hình biểu đồ.
- Page filter và liên kết: "Filter block" cấp trang nhận các điều kiện đầu vào thống nhất, tự động hợp nhất vào truy vấn biểu đồ và refresh liên kết.
- Sự kiện tương tác: Đăng ký sự kiện qua `chart.on` để thực hiện các hành vi như highlight, chuyển trang, drill-down.

## Cài đặt
Trực quan hóa Dữ liệu là plugin tích hợp sẵn của NocoBase, sử dụng được ngay, không cần cài đặt riêng.
