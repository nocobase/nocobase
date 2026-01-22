:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Quản lý Phiên bản

Sau khi một luồng công việc đã được cấu hình và kích hoạt ít nhất một lần, nếu bạn muốn sửa đổi cấu hình hoặc các nút của luồng công việc đó, bạn cần tạo một phiên bản mới trước khi thực hiện thay đổi. Điều này cũng đảm bảo rằng khi xem lại lịch sử thực thi của các luồng công việc đã được kích hoạt trước đó, chúng sẽ không bị ảnh hưởng bởi các sửa đổi trong tương lai.

Trên trang cấu hình của luồng công việc, bạn có thể xem các phiên bản luồng công việc hiện có từ menu phiên bản ở góc trên bên phải:

![Xem các phiên bản luồng công việc](https://static-docs.nocobase.com/ad93d2c08166b0e3e643fb148713a63f.png)

Trong menu "Thao tác khác" ("...") ở bên phải, bạn có thể chọn sao chép phiên bản đang xem thành một phiên bản mới:

![Sao chép luồng công việc thành phiên bản mới](https://static-docs.nocobase.com/2805798e6caca2af004893390a744256.png)

Sau khi sao chép thành phiên bản mới, hãy nhấp vào nút chuyển đổi "Bật"/"Tắt" để chuyển phiên bản tương ứng sang trạng thái "Bật", và phiên bản luồng công việc mới sẽ có hiệu lực.

Nếu cần chọn lại một phiên bản cũ, sau khi chuyển đổi từ menu phiên bản, hãy nhấp lại vào nút chuyển đổi "Bật"/"Tắt" để chuyển sang trạng thái "Bật". Phiên bản đang xem sẽ có hiệu lực, và các lần kích hoạt tiếp theo sẽ thực thi quy trình của phiên bản đó.

Khi bạn cần vô hiệu hóa luồng công việc, hãy nhấp vào nút chuyển đổi "Bật"/"Tắt" để chuyển sang trạng thái "Tắt". Luồng công việc đó sẽ không còn được kích hoạt nữa.

:::info{title=Mẹo}
Khác với việc "Sao chép" một luồng công việc từ danh sách quản lý luồng công việc, một luồng công việc được "sao chép thành phiên bản mới" vẫn thuộc cùng một nhóm luồng công việc, chỉ khác nhau ở phiên bản. Tuy nhiên, việc sao chép một luồng công việc sẽ được coi là một luồng công việc hoàn toàn mới, không liên quan đến các phiên bản của luồng công việc trước đó, và số lần thực thi của nó cũng sẽ được đặt lại về không.
:::