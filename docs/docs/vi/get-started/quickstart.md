---
title: "So sánh phương thức cài đặt và phiên bản NocoBase"
description: "Ba phương thức cài đặt NocoBase: Docker (khuyến nghị), create-nocobase-app, mã nguồn Git; sự khác biệt giữa các phiên bản Latest/Beta/Alpha, tình huống áp dụng và cách nâng cấp."
keywords: "Cài đặt NocoBase, Cài đặt Docker, create-nocobase-app, mã nguồn Git, Latest, Beta, Alpha, so sánh phiên bản, NocoBase"
versions:
  - label: Latest (Phiên bản ổn định)
    features: Tính năng ổn định, kiểm thử kỹ lưỡng, chỉ vá lỗi.
    audience: Người dùng muốn trải nghiệm ổn định, triển khai môi trường sản xuất.
    stability: ★★★★★
    production_recommendation: Khuyến nghị
  - label: Beta (Phiên bản kiểm thử)
    features: Bao gồm các tính năng mới sắp phát hành, đã qua kiểm thử ban đầu, có thể còn ít vấn đề.
    audience: Người dùng muốn trải nghiệm sớm tính năng mới và phản hồi.
    stability: ★★★★☆
    production_recommendation: Sử dụng thận trọng
  - label: Alpha (Phiên bản phát triển)
    features: Phiên bản đang phát triển, tính năng mới nhất nhưng có thể chưa đầy đủ hoặc không ổn định.
    audience: Người dùng kỹ thuật quan tâm đến phát triển tiên tiến, người đóng góp.
    stability: ★★☆☆☆
    production_recommendation: Sử dụng thận trọng

install_methods:
  - label: Cài đặt Docker (Khuyến nghị)
    features: Không cần viết code, cài đặt đơn giản, phù hợp để trải nghiệm nhanh.
    scenarios: Người dùng no-code, người dùng muốn triển khai nhanh lên server.
    technical_requirement: ★☆☆☆☆
    upgrade_method: Pull image mới nhất và khởi động lại container
  - label: Cài đặt create-nocobase-app
    features: Code nghiệp vụ độc lập, hỗ trợ mở rộng Plugin và tùy chỉnh giao diện.
    scenarios: Lập trình viên frontend/full-stack, dự án nhóm, phát triển low-code.
    technical_requirement: ★★★☆☆
    upgrade_method: Dùng yarn để cập nhật phụ thuộc
  - label: Cài đặt từ mã nguồn Git
    features: Lấy trực tiếp mã nguồn mới nhất, có thể tham gia đóng góp và debug.
    scenarios: Lập trình viên kỹ thuật, người dùng muốn trải nghiệm phiên bản chưa phát hành.
    technical_requirement: ★★★★★
    upgrade_method: Đồng bộ cập nhật qua quy trình Git
---

# So sánh phương thức cài đặt và phiên bản

Bạn có thể cài đặt NocoBase bằng nhiều cách khác nhau.

## So sánh phiên bản

| Tiêu chí | **Latest (Phiên bản ổn định)** | **Beta (Phiên bản kiểm thử)** | **Alpha (Phiên bản phát triển)** |
|------|------------------------|----------------------|-----------------------|
| **Đặc điểm** | Tính năng ổn định, kiểm thử kỹ lưỡng, chỉ vá lỗi. | Bao gồm các tính năng mới sắp phát hành, đã qua kiểm thử ban đầu, có thể còn ít vấn đề. | Phiên bản đang phát triển, tính năng mới nhất nhưng có thể chưa đầy đủ hoặc không ổn định. |
| **Đối tượng phù hợp** | Người dùng muốn trải nghiệm ổn định, triển khai môi trường sản xuất. | Người dùng muốn trải nghiệm sớm tính năng mới và phản hồi. | Người dùng kỹ thuật quan tâm đến phát triển tiên tiến, người đóng góp. |
| **Độ ổn định** | ★★★★★ | ★★★★☆ | ★★☆☆☆ |
| **Khuyến nghị dùng sản xuất** | Khuyến nghị | Sử dụng thận trọng | Sử dụng thận trọng |

## So sánh phương thức cài đặt

| Tiêu chí | **Cài đặt Docker (Khuyến nghị)** | **Cài đặt create-nocobase-app** | **Cài đặt từ mã nguồn Git** |
|------|--------------------------|------------------------------|------------------|
| **Đặc điểm** | Không cần viết code, cài đặt đơn giản, phù hợp để trải nghiệm nhanh. | Code nghiệp vụ độc lập, hỗ trợ mở rộng Plugin và tùy chỉnh giao diện. | Lấy trực tiếp mã nguồn mới nhất, có thể tham gia đóng góp và debug. |
| **Tình huống áp dụng** | Người dùng no-code, người dùng muốn triển khai nhanh lên server. | Lập trình viên frontend/full-stack, dự án nhóm, phát triển low-code. | Lập trình viên kỹ thuật, người dùng muốn trải nghiệm phiên bản chưa phát hành. |
| **Yêu cầu kỹ thuật** | ★☆☆☆☆ | ★★★☆☆ | ★★★★★ |
| **Cách nâng cấp** | Pull image mới nhất và khởi động lại container | Dùng yarn để cập nhật phụ thuộc | Đồng bộ cập nhật qua quy trình Git |
| **Hướng dẫn** | [<code>Cài đặt</code>](#) [<code>Nâng cấp</code>](#) [<code>Triển khai</code>](#) | [<code>Cài đặt</code>](#) [<code>Nâng cấp</code>](#) [<code>Triển khai</code>](#) | [<code>Cài đặt</code>](#) [<code>Nâng cấp</code>](#) [<code>Triển khai</code>](#) |
