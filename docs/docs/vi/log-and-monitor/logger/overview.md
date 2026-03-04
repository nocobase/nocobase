:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/log-and-monitor/logger/overview).
:::

# Nhật ký máy chủ, Nhật ký kiểm tra và Lịch sử bản ghi

## Nhật ký máy chủ

### Nhật ký hệ thống

> Tham khảo [Nhật ký hệ thống](./index.md#nhật-ký-hệ-thống)

- Ghi lại thông tin vận hành của hệ thống ứng dụng, theo dõi chuỗi thực thi logic của mã nguồn, truy vết các thông tin bất thường như lỗi vận hành mã nguồn.
- Nhật ký được phân cấp và phân loại theo các mô-đun chức năng.
- Xuất qua terminal hoặc lưu trữ dưới dạng tệp tin.
- Chủ yếu được sử dụng để khắc phục các tình huống bất thường phát sinh trong quá trình hệ thống vận hành.

### Nhật ký yêu cầu

> Tham khảo [Nhật ký yêu cầu](./index.md#nhật-ký-yêu-cầu)

- Ghi lại thông tin yêu cầu và phản hồi của HTTP API, tập trung vào ID yêu cầu, đường dẫn API (API Path), tiêu đề yêu cầu (headers), mã trạng thái phản hồi, thời gian thực thi, v.v.
- Xuất qua terminal hoặc lưu trữ dưới dạng tệp tin.
- Chủ yếu dùng để theo dõi việc gọi và thực thi API.

## Nhật ký kiểm tra

> Tham khảo [Nhật ký kiểm tra](/security/audit-logger/index.md)

- Ghi lại hành vi thao tác của người dùng (API) đối với tài nguyên hệ thống, tập trung vào loại tài nguyên, đối tượng tài nguyên, loại thao tác, thông tin người dùng, trạng thái thao tác, v.v.
- Để theo dõi tốt hơn nội dung và kết quả cụ thể của các thao tác người dùng, các tham số yêu cầu và phản hồi yêu cầu sẽ được ghi lại dưới dạng thông tin MetaData. Phần thông tin này trùng lặp một phần với nhật ký yêu cầu nhưng không hoàn toàn giống nhau, ví dụ: trong nhật ký yêu cầu hiện tại thường không ghi lại toàn bộ nội dung (body) của yêu cầu.
- Tham số yêu cầu và phản hồi yêu cầu không tương đương với ảnh chụp nhanh (snapshot) của tài nguyên. Thông qua tham số và logic mã nguồn, có thể biết thao tác đó đã tạo ra những thay đổi gì, nhưng không thể biết chính xác nội dung của bản ghi trong bảng dữ liệu trước khi sửa đổi là gì để thực hiện kiểm soát phiên bản và khôi phục dữ liệu sau khi thao tác sai.
- Lưu trữ dưới dạng tệp tin và bảng dữ liệu.

![](https://static-docs.nocobase.com/202501031627922.png)

## Lịch sử bản ghi

> Tham khảo [Lịch sử bản ghi](/record-history/index.md)

- Ghi lại lịch sử thay đổi nội dung dữ liệu.
- Nội dung ghi lại chính bao gồm loại tài nguyên, đối tượng tài nguyên, loại thao tác, các trường thay đổi, giá trị trước và sau khi thay đổi.
- Có thể được sử dụng để so sánh dữ liệu.
- Lưu trữ dưới dạng bảng dữ liệu.

![](https://static-docs.nocobase.com/202511011338499.png)