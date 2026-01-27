:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Chế độ Cụm

## Giới thiệu

NocoBase từ phiên bản v1.6.0 đã hỗ trợ chạy ứng dụng ở chế độ cụm. Khi ứng dụng chạy ở chế độ cụm, hiệu suất xử lý truy cập đồng thời có thể được cải thiện đáng kể thông qua việc sử dụng nhiều phiên bản (instances) và chế độ đa lõi (multi-core).

## Kiến trúc Hệ thống

![20251031221530](https://static-docs.nocobase.com/20251031221530.png)

*   **Cụm Ứng dụng**: Là một cụm bao gồm nhiều phiên bản ứng dụng NocoBase. Cụm này có thể được triển khai trên nhiều máy chủ khác nhau hoặc chạy nhiều tiến trình ở chế độ đa lõi trên một máy chủ duy nhất.
*   **Cơ sở dữ liệu**: Nơi lưu trữ dữ liệu của ứng dụng. Có thể là cơ sở dữ liệu đơn nút (single-node) hoặc cơ sở dữ liệu phân tán (distributed).
*   **Bộ nhớ dùng chung**: Dùng để lưu trữ các tệp và dữ liệu của ứng dụng, hỗ trợ quyền truy cập đọc/ghi từ nhiều phiên bản.
*   **Middleware (Phần mềm trung gian)**: Bao gồm các thành phần như bộ nhớ đệm (cache), tín hiệu đồng bộ (synchronization signals), hàng đợi tin nhắn (message queue) và khóa phân tán (distributed locks), hỗ trợ giao tiếp và điều phối trong cụm ứng dụng.
*   **Bộ cân bằng tải (Load Balancer)**: Chịu trách nhiệm phân phối các yêu cầu từ client đến các phiên bản khác nhau trong cụm ứng dụng, đồng thời thực hiện kiểm tra tình trạng (health check) và chuyển đổi dự phòng (failover).

## Tìm hiểu thêm

Tài liệu này chỉ giới thiệu các khái niệm cơ bản và thành phần của chế độ cụm NocoBase. Để biết chi tiết triển khai cụ thể và các tùy chọn cấu hình khác, vui lòng tham khảo các tài liệu sau:

- Triển khai
  - [Chuẩn bị](./preparations)
  - [Triển khai trên Kubernetes](./kubernetes)
  - [Vận hành](./operations)
- Nâng cao
  - [Tách dịch vụ](./services-splitting)
- [Tham khảo dành cho nhà phát triển](./development)