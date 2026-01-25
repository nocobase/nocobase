:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Xem trước và Lưu

*   **Xem trước**: Tạm thời hiển thị các thay đổi từ bảng cấu hình lên biểu đồ trang để xác minh kết quả.
*   **Lưu**: Lưu các thay đổi từ bảng cấu hình vào cơ sở dữ liệu.

## Điểm truy cập

![clipboard-image-1761479218](https://static-docs.nocobase.com/clipboard-image-1761479218.png)

-   Trong chế độ cấu hình đồ họa (Basic), các thay đổi mặc định sẽ tự động được áp dụng để xem trước.
-   Trong chế độ SQL và Custom, sau khi thực hiện thay đổi, bạn có thể nhấp vào nút **Xem trước** ở bên phải để áp dụng các thay đổi vào phần xem trước.
-   Một nút **Xem trước** thống nhất có sẵn ở cuối toàn bộ bảng cấu hình.

## Hành vi xem trước

-   Cấu hình sẽ được hiển thị tạm thời trên trang mà không ghi vào cơ sở dữ liệu. Sau khi làm mới trang hoặc hủy thao tác, kết quả xem trước sẽ không được giữ lại.
-   Chức năng chống rung (debounce) tích hợp: Nhiều lần kích hoạt làm mới trong thời gian ngắn chỉ thực hiện lần cuối cùng, tránh các yêu cầu thường xuyên.
-   Nhấp lại vào **Xem trước** sẽ ghi đè kết quả xem trước trước đó.

## Thông báo lỗi

-   Lỗi truy vấn hoặc xác thực thất bại: Thông báo lỗi sẽ được hiển thị trong khu vực "Xem dữ liệu".
-   Lỗi cấu hình biểu đồ (thiếu ánh xạ Basic, lỗi từ Custom JS): Lỗi sẽ được hiển thị trong khu vực biểu đồ hoặc bảng điều khiển, đồng thời giữ cho trang vẫn có thể thao tác.
-   Để giảm thiểu lỗi hiệu quả, hãy xác nhận tên cột và kiểu dữ liệu trong "Xem dữ liệu" trước khi thực hiện ánh xạ trường hoặc viết mã Custom.

## Lưu và Hủy

-   **Lưu**: Ghi các thay đổi hiện tại của bảng điều khiển vào cấu hình khối và áp dụng chúng ngay lập tức cho trang.
-   **Hủy**: Hủy bỏ các thay đổi chưa lưu của bảng điều khiển hiện tại, khôi phục về trạng thái đã lưu gần nhất.
-   Phạm vi lưu:
    -   Truy vấn dữ liệu: Các tham số truy vấn của Builder; trong chế độ SQL, văn bản SQL cũng sẽ được lưu.
    -   Tùy chọn biểu đồ: Loại Basic, ánh xạ trường và thuộc tính; văn bản JS của Custom.
    -   Sự kiện tương tác: Văn bản JS và logic ràng buộc của sự kiện.
-   Sau khi lưu, khối sẽ có hiệu lực đối với tất cả người truy cập (tùy thuộc vào cài đặt quyền trang).

## Luồng thao tác khuyến nghị

-   Cấu hình truy vấn dữ liệu → Chạy truy vấn → Xem dữ liệu để xác nhận tên cột và kiểu dữ liệu → Cấu hình tùy chọn biểu đồ để ánh xạ các trường chính → Xem trước để xác thực → Lưu để áp dụng.