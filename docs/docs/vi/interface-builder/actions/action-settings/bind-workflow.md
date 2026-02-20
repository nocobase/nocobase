:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Gắn luồng công việc

## Giới thiệu

Trên một số nút thao tác, quý vị có thể cấu hình để gắn một luồng công việc. Việc này giúp liên kết thao tác gửi dữ liệu với luồng công việc, từ đó tự động hóa quá trình xử lý dữ liệu.

![20251029144822](https://static-docs.nocobase.com/20251029144822.png)

![20251029145017](https://static-docs.nocobase.com/20251029145017.png)

## Các thao tác và loại luồng công việc được hỗ trợ

Các nút thao tác và loại luồng công việc hiện được hỗ trợ để gắn kết bao gồm:

| Nút thao tác \ Loại luồng công việc | Sự kiện trước thao tác | Sự kiện sau thao tác | Sự kiện phê duyệt | Sự kiện thao tác tùy chỉnh |
| --- | --- | --- | --- | --- |
| Nút "Gửi", "Lưu" của biểu mẫu | ✅ | ✅ | ✅ | ❌ |
| Nút "Cập nhật bản ghi" trong các hàng dữ liệu (Bảng, Danh sách, v.v.) | ✅ | ✅ | ✅ | ❌ |
| Nút "Xóa" trong các hàng dữ liệu (Bảng, Danh sách, v.v.) | ✅ | ❌ | ❌ | ❌ |
| Nút "Kích hoạt luồng công việc" | ❌ | ❌ | ❌ | ✅ |

## Gắn nhiều luồng công việc cùng lúc

Một nút thao tác có thể được gắn với nhiều luồng công việc. Khi có nhiều luồng công việc được gắn, thứ tự thực thi của chúng sẽ tuân theo các quy tắc sau:

1. Đối với các luồng công việc cùng loại kích hoạt, các luồng công việc đồng bộ sẽ được thực thi trước, sau đó là các luồng công việc bất đồng bộ.
2. Các luồng công việc cùng loại kích hoạt sẽ được thực thi theo thứ tự đã cấu hình.
3. Giữa các luồng công việc thuộc các loại kích hoạt khác nhau:
    1. Các sự kiện trước thao tác luôn được thực thi trước các sự kiện sau thao tác và sự kiện phê duyệt.
    2. Các sự kiện sau thao tác và sự kiện phê duyệt không có thứ tự cụ thể; logic nghiệp vụ không nên phụ thuộc vào thứ tự cấu hình.

## Xem thêm

Để biết thêm chi tiết về các loại sự kiện luồng công việc khác nhau, quý vị có thể tham khảo tài liệu chi tiết của các plugin liên quan:

* [Sự kiện sau thao tác]
* [Sự kiện trước thao tác]
* [Sự kiện phê duyệt]
* [Sự kiện thao tác tùy chỉnh]