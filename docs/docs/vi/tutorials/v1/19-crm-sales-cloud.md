# Hệ thống CRM Sales Cloud

## 1.1 Bối cảnh

- **Mô tả bối cảnh** Cùng với việc tăng tốc chuyển đổi số của doanh nghiệp, việc xây dựng một nền tảng bán hàng thống nhất để quản lý Lead, Khách hàng, Cơ hội, Báo giá, Đơn hàng và các hoạt động hàng ngày là điều không thể thiếu. Giải pháp này dựa trên NocoBase để xây dựng một hệ thống CRM (Sales Cloud), thực hiện quản lý dữ liệu tập trung và quy trình thông minh.
- > Lưu ý: Giải pháp này là phần đầu tiên của hệ thống CRM nhẹ, không bao gồm mua sắm, vận chuyển, quản lý nhà cung cấp. Chủ yếu giới thiệu giải pháp triển khai chức năng, chỉ mang tính tham khảo.
  >

## 1.2 Mục tiêu và phạm vi dự án

- **Mục tiêu** Xây dựng một hệ thống CRM tích hợp Lead, Khách hàng, Liên hệ, Cơ hội, Sản phẩm, Báo giá, Đơn hàng và quản lý hoạt động, nâng cao hiệu quả bán hàng và độ chính xác của dữ liệu.
- **Phạm vi** Bao phủ việc nhập, theo dõi, chuyển đổi và phân tích báo cáo trên toàn bộ chuỗi bán hàng; trong đó quản lý Chiến dịch Marketing là module tùy chọn, mua sắm, vận chuyển, quản lý nhà cung cấp tạm thời không bao gồm.

## 1.3 Tổng quan vai trò người dùng và quyền hạn

- **Đại diện bán hàng**: Chịu trách nhiệm nhập và theo dõi Lead, tạo Khách hàng, Liên hệ, Cơ hội, Báo giá, Đơn hàng và ghi lại các hoạt động hàng ngày.
- **Quản lý bán hàng**: Chịu trách nhiệm giám sát tiến độ bán hàng, phê duyệt báo giá và đơn hàng, xem các loại báo cáo dữ liệu.
- **Quản trị viên hệ thống**: Chịu trách nhiệm cấu hình quyền người dùng, bảo trì dữ liệu, thiết lập hệ thống và quản lý interface.

## 1.4 Tổng quan các module chức năng

- Tìm hiểu nhanh các chức năng cốt lõi mà hệ thống bao gồm:


| Module chức năng                  | Module con/Chức năng con                                                                  | Mô tả                                                                                  |
| --------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Quản lý Lead**                  | Nhập Lead, Theo dõi & Quản lý trạng thái, Chuyển đổi Lead                                 | Thu thập, theo dõi thông tin Khách hàng tiềm năng và chuyển Lead đủ điều kiện thành Khách hàng, Liên hệ, Cơ hội. |
| **Quản lý Khách hàng & Liên hệ**  | Quản lý Khách hàng, Quản lý Liên hệ                                                       | Xây dựng hồ sơ Khách hàng, ghi lại thông tin công ty và Liên hệ.                       |
| **Quản lý Cơ hội**                | Tạo Cơ hội, Quản lý giai đoạn bán hàng, Phân tích dự đoán, Quản lý sản phẩm, Lý do đóng, Quản lý dự kiến thu hồi | Ghi lại cơ hội bán hàng, theo dõi quy trình bán hàng và dự đoán xu hướng bán hàng.     |
| **Quản lý Sản phẩm & Bảng giá**   | Quản lý danh mục sản phẩm, Quản lý bảng giá                                               | Quản lý thông tin sản phẩm, tồn kho và định giá.                                       |
| **Quản lý Báo giá**               | Tạo Báo giá, Quy trình phê duyệt, Quản lý chi tiết Báo giá                                | Tạo và quản lý báo giá chính thức, hỗ trợ phê duyệt và tự động tính tổng số tiền.     |
| **Quản lý Đơn hàng bán**          | Tạo đơn hàng, Theo dõi trạng thái, Quản lý vận chuyển đơn hàng                            | Ghi lại việc tạo đơn hàng, phê duyệt và trạng thái vận chuyển.                         |
| **Quản lý Hoạt động**             | Quản lý nhiệm vụ, Ghi chép cuộc họp, Ghi chép cuộc gọi, Lịch và nhắc nhở                  | Quản lý nhiệm vụ bán hàng, cuộc họp và cuộc gọi, hỗ trợ lập lịch.                      |
| **Báo cáo & Phân tích Dữ liệu**   | Báo cáo hiệu suất bán hàng, Phân tích chuyển đổi Cơ hội, Phân tích phễu bán hàng          | Tạo báo cáo thống kê bán hàng đa chiều, hỗ trợ phân tích dữ liệu.                      |
| **Quản lý Chiến dịch Marketing (Tùy chọn)** | Lập kế hoạch hoạt động marketing, Theo dõi hiệu quả hoạt động                       | Lập kế hoạch và đánh giá các hoạt động marketing.                                      |

---

Đang tiếp tục cập nhật...
