:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Nhật ký máy chủ, Nhật ký kiểm toán và Lịch sử bản ghi

## Nhật ký máy chủ

### Nhật ký hệ thống

> Xem thêm [Nhật ký hệ thống](#)

- Ghi lại thông tin hoạt động của hệ thống ứng dụng, theo dõi chuỗi thực thi logic mã, và truy vết các lỗi hoặc ngoại lệ trong quá trình chạy mã.
- Nhật ký được phân cấp và phân loại theo các module chức năng.
- Xuất ra terminal hoặc lưu trữ dưới dạng tệp.
- Chủ yếu dùng để chẩn đoán và khắc phục sự cố hệ thống trong quá trình hoạt động.

### Nhật ký yêu cầu

> Xem thêm [Nhật ký yêu cầu](#)

- Ghi lại chi tiết yêu cầu và phản hồi HTTP API, tập trung vào ID yêu cầu, đường dẫn API, tiêu đề, mã trạng thái phản hồi và thời gian xử lý.
- Xuất ra terminal hoặc lưu trữ dưới dạng tệp.
- Chủ yếu dùng để theo dõi các lời gọi API và hiệu suất thực thi.

## Nhật ký kiểm toán

> Xem thêm [Nhật ký kiểm toán](../security/audit-logger/index.md)

- Ghi lại các hành động của người dùng (hoặc API) trên tài nguyên hệ thống, tập trung vào loại tài nguyên, đối tượng mục tiêu, loại thao tác, thông tin người dùng và trạng thái thao tác.
- Để theo dõi tốt hơn nội dung và kết quả cụ thể của các thao tác người dùng, các tham số yêu cầu và phản hồi yêu cầu được ghi lại dưới dạng thông tin siêu dữ liệu (Metadata). Phần thông tin này có một số điểm trùng lặp với nhật ký yêu cầu nhưng không hoàn toàn giống nhau — ví dụ, nhật ký yêu cầu hiện tại thường không ghi lại toàn bộ phần thân yêu cầu.
- Các tham số yêu cầu và phản hồi yêu cầu **không tương đương** với các bản chụp nhanh (snapshot) dữ liệu. Chúng có thể tiết lộ loại thao tác đã xảy ra nhưng không thể cho biết chính xác dữ liệu trước khi sửa đổi là gì, do đó không thể dùng để kiểm soát phiên bản hoặc khôi phục dữ liệu sau các thao tác sai.
- Được lưu trữ dưới dạng tệp và bảng cơ sở dữ liệu.

![](https://static-docs.nocobase.com/202501031627922.png)

## Lịch sử bản ghi

> Xem thêm [Lịch sử bản ghi](/record-history/index.md)

- Ghi lại **lịch sử thay đổi** của nội dung dữ liệu.
- Nội dung chính được ghi lại bao gồm loại tài nguyên, đối tượng tài nguyên, loại thao tác, các trường đã thay đổi và giá trị trước/sau khi thay đổi.
- Hữu ích cho việc **so sánh và kiểm toán dữ liệu**.
- Được lưu trữ trong các bảng cơ sở dữ liệu.

![](https://static-docs.nocobase.com/202511011338499.png)