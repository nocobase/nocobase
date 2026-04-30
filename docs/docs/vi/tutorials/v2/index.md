# Hướng dẫn nhập môn NocoBase 2.0

Hướng dẫn này sẽ đưa bạn từ con số 0, dùng NocoBase 2.0 xây dựng một **hệ thống Ticket IT (HelpDesk) cực kỳ tinh giản**. Toàn bộ hệ thống chỉ cần **2 bảng dữ liệu**, không viết một dòng code, đã có thể triển khai tính năng gửi ticket, quản lý phân loại, theo dõi thay đổi, kiểm soát quyền và Dashboard dữ liệu.

## Định vị hướng dẫn

- **Đối tượng độc giả**: Nhân viên nghiệp vụ, kỹ thuật hoặc bất kỳ ai quan tâm đến NocoBase (khuyến nghị có kiến thức cơ bản về máy tính)
- **Dự án mẫu**: Hệ thống Ticket IT (HelpDesk) cực tinh giản, chỉ 2 bảng
- **Thời gian dự kiến**: 2-3 giờ (người không kỹ thuật), 1-1.5 giờ (người có kỹ thuật)
- **Yêu cầu trước**: Môi trường Docker hoặc [Demo trực tuyến](https://demo-cn.nocobase.com/new) (hiệu lực 24 giờ, không cần cài đặt)
- **Phiên bản**: NocoBase 2.0

## Bạn sẽ học được gì

Qua 7 chương thực hành, bạn sẽ nắm vững các khái niệm cốt lõi và quy trình xây dựng của NocoBase:

| # | Chương | Trọng tâm |
|---|------|------|
| 1 | [Làm quen với NocoBase - 5 phút chạy lên](./01-getting-started) | Cài đặt Docker, chế độ cấu hình vs chế độ sử dụng |
| 2 | [Mô hình hóa dữ liệu - Xây dựng khung hệ thống Ticket](./02-data-modeling) | Collection/Field, quan hệ liên kết |
| 3 | [Xây dựng trang - Hiển thị dữ liệu](./03-building-pages) | Block, Block bảng, lọc và sắp xếp |
| 4 | [Biểu mẫu và chi tiết - Nhập dữ liệu](./04-forms-and-details) | Block biểu mẫu, liên động trường, lịch sử bản ghi |
| 5 | [Người dùng và Quyền - Ai được xem gì](./05-roles-and-permissions) | Vai trò, quyền menu, quyền dữ liệu |
| 6 | [Workflow - Để hệ thống tự vận hành](./06-workflows) | Tự động thông báo, kích hoạt khi đổi trạng thái |
| 7 | [Dashboard - Nhìn toàn cảnh trong một cái nhìn](./07-dashboard) | Biểu đồ tròn/đường/cột, Block Markdown |

## Xem trước mô hình dữ liệu

Hướng dẫn này xoay quanh một mô hình dữ liệu cực tinh giản - chỉ có **2 bảng**, nhưng đủ bao quát các tính năng cốt lõi như mô hình hóa dữ liệu, xây dựng trang, thiết kế biểu mẫu, kiểm soát quyền, Workflow và Dashboard.

| Bảng dữ liệu | Trường chính |
|--------|---------|
| Ticket (tickets) | Tiêu đề, mô tả, trạng thái, độ ưu tiên |
| Phân loại Ticket (categories) | Tên phân loại, màu sắc |

## Câu hỏi thường gặp

### NocoBase phù hợp với những tình huống nào?

Phù hợp với các công cụ nội bộ doanh nghiệp, hệ thống quản lý dữ liệu, quy trình phê duyệt, CRM, ERP và các tình huống cần tùy chỉnh linh hoạt, hỗ trợ triển khai riêng.

### Hoàn thành hướng dẫn này cần kiến thức nền tảng gì?

Không cần biết lập trình, nhưng nên có kiến thức cơ bản về máy tính. Hướng dẫn sẽ giải thích từng bước các khái niệm như bảng dữ liệu, trường, quan hệ liên kết. Có kinh nghiệm dùng database hoặc Excel sẽ dễ làm quen hơn.

### Hệ thống trong hướng dẫn có thể mở rộng được không?

Được. Hướng dẫn này chỉ dùng 2 bảng, nhưng NocoBase hỗ trợ liên kết đa bảng phức tạp, tích hợp API bên ngoài, Plugin tùy chỉnh, v.v.

### Cần môi trường triển khai gì?

Khuyến nghị Docker (Docker Desktop hoặc server Linux), tối thiểu 2 core 4GB bộ nhớ. Cũng hỗ trợ chạy từ mã nguồn Git. Nếu chỉ là học và trải nghiệm, có thể đăng ký trực tiếp [Demo trực tuyến](https://demo-cn.nocobase.com/new), không cần cài đặt, hiệu lực 24 giờ.

### Phiên bản miễn phí có giới hạn gì?

Các tính năng cốt lõi hoàn toàn miễn phí và mã nguồn mở. Phiên bản thương mại cung cấp thêm các Plugin nâng cao và hỗ trợ kỹ thuật, xem chi tiết tại [Giá phiên bản thương mại](https://www.nocobase.com/cn/commercial).

## Stack công nghệ liên quan

NocoBase 2.0 được xây dựng dựa trên các công nghệ sau:

- **Framework frontend**: React + [Ant Design](https://ant.design/) 5.0
- **Backend**: Node.js + Koa
- **Database**: PostgreSQL (cũng hỗ trợ [MySQL](/get-started/installation/docker), MariaDB)
- **Phương thức triển khai**: [Docker](/get-started/installation/docker), Kubernetes

## Tham khảo nền tảng tương tự

Nếu bạn đang đánh giá nền tảng no-code/low-code, dưới đây là một số tham khảo so sánh:

| Nền tảng | Đặc điểm | Khác biệt với NocoBase |
|------|------|-------------------|
| [Appsmith](https://www.appsmith.com/) | No-code mã nguồn mở, khả năng tùy chỉnh frontend mạnh | NocoBase tập trung hơn vào mô hình dữ liệu |
| [Retool](https://retool.com/) | Nền tảng công cụ nội bộ | NocoBase mã nguồn mở hoàn toàn, không giới hạn sử dụng |
| [Airtable](https://airtable.com/) | Database cộng tác trực tuyến | NocoBase hỗ trợ triển khai riêng, dữ liệu tự chủ |
| [Budibase](https://budibase.com/) | Low-code mã nguồn mở, hỗ trợ self-host | Kiến trúc Plugin của NocoBase, khả năng mở rộng mạnh hơn |

## Tài liệu liên quan

### Hướng dẫn nhập môn
- [NocoBase hoạt động như thế nào](/get-started/how-nocobase-works) - Giới thiệu các khái niệm cốt lõi
- [Bắt đầu nhanh](/get-started/quickstart) - Cài đặt và cấu hình ban đầu
- [Yêu cầu hệ thống](/get-started/system-requirements) - Yêu cầu cấu hình môi trường

### Hướng dẫn khác
- [Hướng dẫn NocoBase 1.x](/tutorials/v1/index.md) - Hướng dẫn nâng cao với hệ thống quản lý nhiệm vụ làm ví dụ

### Tham khảo giải pháp
- [Giải pháp hệ thống Ticket](/solution/ticket-system/index.md) - Giải pháp quản lý Ticket thông minh dựa trên AI
- [Giải pháp hệ thống CRM](/solution/crm/index.md) - Nền tảng quản lý quan hệ khách hàng
- [AI Employee](/ai-employees/quick-start) - Tích hợp khả năng AI vào hệ thống

Bạn đã sẵn sàng chưa? Hãy bắt đầu từ [Chương 1: Làm quen với NocoBase](./01-getting-started)!
