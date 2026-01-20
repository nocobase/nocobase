---
pkg: '@nocobase/plugin-workflow'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Tổng quan

## Giới thiệu

Plugin luồng công việc giúp bạn tổ chức các quy trình nghiệp vụ tự động trong NocoBase, chẳng hạn như phê duyệt hàng ngày, đồng bộ dữ liệu, nhắc nhở và các tác vụ khác. Trong một luồng công việc, bạn có thể triển khai logic nghiệp vụ phức tạp chỉ bằng cách cấu hình các trình kích hoạt và các nút liên quan thông qua giao diện trực quan, mà không cần viết bất kỳ dòng mã nào.

### Ví dụ

Mỗi luồng công việc được tổ chức với một trình kích hoạt và một số nút. Trình kích hoạt đại diện cho một sự kiện trong hệ thống, và mỗi nút đại diện cho một bước thực thi. Tổng thể, chúng mô tả logic nghiệp vụ cần được xử lý sau khi sự kiện xảy ra. Hình ảnh dưới đây minh họa một quy trình trừ kho điển hình sau khi một đơn hàng sản phẩm được đặt:

![Ví dụ về luồng công việc](https://static-docs.nocobase.com/20251029222146.png)

Khi người dùng gửi đơn hàng, luồng công việc tự động kiểm tra kho. Nếu kho đủ, hệ thống sẽ trừ kho và tiến hành tạo đơn hàng; nếu không, quy trình sẽ kết thúc.

### Các trường hợp sử dụng

Từ góc độ tổng quát hơn, các luồng công việc trong ứng dụng NocoBase có thể giải quyết vấn đề trong nhiều tình huống khác nhau:

- Tự động hóa các tác vụ lặp đi lặp lại: Duyệt đơn hàng, đồng bộ kho, làm sạch dữ liệu, tính toán điểm số, v.v., không còn yêu cầu thao tác thủ công.
- Hỗ trợ cộng tác giữa người và máy: Sắp xếp phê duyệt hoặc xem xét lại tại các nút quan trọng, và tiếp tục các bước tiếp theo dựa trên kết quả xử lý.
- Kết nối với các hệ thống bên ngoài: Gửi yêu cầu HTTP, nhận thông báo đẩy từ các dịch vụ bên ngoài, và đạt được tự động hóa xuyên hệ thống.
- Nhanh chóng thích ứng với thay đổi nghiệp vụ: Điều chỉnh cấu trúc quy trình, điều kiện hoặc các cấu hình nút khác, và đưa vào sử dụng mà không cần phát hành phiên bản mới.

## Cài đặt

Luồng công việc là một plugin tích hợp sẵn của NocoBase. Không yêu cầu cài đặt hoặc cấu hình bổ sung.

## Tìm hiểu thêm

- [Bắt đầu nhanh](./getting-started)
- [Trình kích hoạt](./triggers/index)
- [Các nút](./nodes/index)
- [Sử dụng biến](./advanced/variables)
- [Kế hoạch thực thi](./advanced/executions)
- [Quản lý phiên bản](./advanced/revisions)
- [Cấu hình nâng cao](./advanced/options)
- [Phát triển mở rộng](./development/index)