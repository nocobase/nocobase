---
versions:
  - label: Phiên bản mới nhất (Ổn định)
    features: Tính năng ổn định, đã được kiểm thử kỹ lưỡng, chỉ sửa lỗi.
    audience: Người dùng muốn trải nghiệm ổn định, triển khai cho môi trường sản xuất.
    stability: ★★★★★
    production_recommendation: Khuyên dùng
  - label: Beta (Thử nghiệm)
    features: Bao gồm các tính năng mới sắp ra mắt, đã được kiểm thử sơ bộ, có thể còn một vài vấn đề nhỏ.
    audience: Người dùng muốn trải nghiệm sớm các tính năng mới và cung cấp phản hồi.
    stability: ★★★★☆
    production_recommendation: Cần thận trọng
  - label: Alpha (Phát triển)
    features: Phiên bản đang trong quá trình phát triển, có các tính năng mới nhất nhưng có thể chưa hoàn chỉnh hoặc không ổn định.
    audience: Người dùng kỹ thuật, người đóng góp quan tâm đến phát triển tiên tiến.
    stability: ★★☆☆☆
    production_recommendation: Cần thận trọng

install_methods:
  - label: Cài đặt bằng Docker (Khuyên dùng)
    features: Không cần viết mã, cài đặt đơn giản, phù hợp để trải nghiệm nhanh.
    scenarios: Người dùng không cần viết mã, người muốn triển khai nhanh lên máy chủ.
    technical_requirement: ★☆☆☆☆
    upgrade_method: Kéo image mới nhất và khởi động lại container
  - label: Cài đặt bằng create-nocobase-app
    features: Mã nguồn ứng dụng độc lập, hỗ trợ mở rộng plugin và tùy chỉnh giao diện.
    scenarios: Nhà phát triển front-end/full-stack, dự án nhóm, phát triển low-code.
    technical_requirement: ★★★☆☆
    upgrade_method: Sử dụng yarn để cập nhật các dependency
  - label: Cài đặt từ mã nguồn Git
    features: Trực tiếp lấy mã nguồn mới nhất, có thể tham gia đóng góp và gỡ lỗi.
    scenarios: Nhà phát triển kỹ thuật, người muốn trải nghiệm các phiên bản chưa phát hành.
    technical_requirement: ★★★★★
    upgrade_method: Đồng bộ hóa cập nhật thông qua quy trình Git
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::



# So sánh các phương thức cài đặt và phiên bản

Bạn có thể cài đặt NocoBase theo nhiều cách khác nhau.

## So sánh các phiên bản

| Tiêu chí | **Phiên bản mới nhất (Ổn định)** | **Beta (Thử nghiệm)** | **Alpha (Phát triển)** |
|------|------------------------|----------------------|-----------------------|
| **Đặc điểm** | Tính năng ổn định, đã được kiểm thử kỹ lưỡng, chỉ sửa lỗi. | Bao gồm các tính năng mới sắp ra mắt, đã được kiểm thử sơ bộ, có thể còn một vài vấn đề nhỏ. | Phiên bản đang trong quá trình phát triển, có các tính năng mới nhất nhưng có thể chưa hoàn chỉnh hoặc không ổn định. |
| **Đối tượng sử dụng** | Người dùng muốn trải nghiệm ổn định, triển khai cho môi trường sản xuất. | Người dùng muốn trải nghiệm sớm các tính năng mới và cung cấp phản hồi. | Người dùng kỹ thuật, người đóng góp quan tâm đến phát triển tiên tiến. |
| **Độ ổn định** | ★★★★★ | ★★★★☆ | ★★☆☆☆ |
| **Có khuyên dùng cho môi trường sản xuất không** | Khuyên dùng | Cần thận trọng | Cần thận trọng |

## So sánh các phương thức cài đặt

| Tiêu chí | **Cài đặt bằng Docker (Khuyên dùng)** | **Cài đặt bằng create-nocobase-app** | **Cài đặt từ mã nguồn Git** |
|------|--------------------------|------------------------------|------------------|
| **Đặc điểm** | Không cần viết mã, cài đặt đơn giản, phù hợp để trải nghiệm nhanh. | Mã nguồn ứng dụng độc lập, hỗ trợ mở rộng plugin và tùy chỉnh giao diện. | Trực tiếp lấy mã nguồn mới nhất, có thể tham gia đóng góp và gỡ lỗi. |
| **Trường hợp áp dụng** | Người dùng không cần viết mã, người muốn triển khai nhanh lên máy chủ. | Nhà phát triển front-end/full-stack, dự án nhóm, phát triển low-code. | Nhà phát triển kỹ thuật, người muốn trải nghiệm các phiên bản chưa phát hành. |
| **Yêu cầu kỹ thuật** | ★☆☆☆☆ | ★★★☆☆ | ★★★★★ |
| **Cách nâng cấp** | Kéo image mới nhất và khởi động lại container | Sử dụng yarn để cập nhật các dependency | Đồng bộ hóa cập nhật thông qua quy trình Git |
| **Hướng dẫn** | [<code>Cài đặt</code>](#) [<code>Nâng cấp</code>](#) [<code>Triển khai</code>](#) | [<code>Cài đặt</code>](#) [<code>Nâng cấp</code>](#) [<code>Triển khai</code>](#) | [<code>Cài đặt</code>](#) [<code>Nâng cấp</code>](#) [<code>Triển khai</code>](#) |