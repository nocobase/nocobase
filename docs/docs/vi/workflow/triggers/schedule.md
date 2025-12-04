:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Tác vụ định kỳ

## Giới thiệu

Một tác vụ định kỳ là một sự kiện được kích hoạt dựa trên điều kiện thời gian, với hai chế độ chính:

- Thời gian tùy chỉnh: Kích hoạt theo lịch trình dựa trên thời gian hệ thống, tương tự như cron.
- Trường thời gian của bộ sưu tập: Kích hoạt khi giá trị của một trường thời gian trong bộ sưu tập đạt đến thời điểm đã định.

Khi hệ thống đạt đến thời điểm (chính xác đến từng giây) thỏa mãn các điều kiện kích hoạt đã cấu hình, luồng công việc tương ứng sẽ được kích hoạt.

## Cách sử dụng cơ bản

### Tạo tác vụ định kỳ

Trong danh sách luồng công việc, khi tạo một luồng công việc mới, hãy chọn loại "Tác vụ định kỳ":

![Tạo tác vụ định kỳ](https://static-docs.nocobase.com/e09b6c9065167875b2ca7de5f5a799a7.png)

### Chế độ thời gian tùy chỉnh

Đối với chế độ thông thường, trước tiên bạn cần cấu hình thời gian bắt đầu là bất kỳ thời điểm nào (chính xác đến từng giây). Thời gian bắt đầu có thể là một thời điểm trong tương lai hoặc trong quá khứ. Khi cấu hình là thời điểm trong quá khứ, hệ thống sẽ kiểm tra xem đã đến lúc kích hoạt hay chưa dựa trên điều kiện lặp lại đã cấu hình. Nếu không có điều kiện lặp lại nào được cấu hình và thời gian bắt đầu là trong quá khứ, luồng công việc sẽ không còn được kích hoạt nữa.

Có hai cách để cấu hình quy tắc lặp lại:

- Theo khoảng thời gian: Kích hoạt sau mỗi khoảng thời gian cố định kể từ thời gian bắt đầu, ví dụ: mỗi giờ, mỗi 30 phút, v.v.
- Chế độ nâng cao: Tức là theo quy tắc cron, bạn có thể cấu hình để kích hoạt theo chu kỳ vào các ngày giờ cố định.

Sau khi cấu hình quy tắc lặp lại, bạn cũng có thể cấu hình điều kiện kết thúc. Tác vụ có thể kết thúc vào một thời điểm cố định hoặc bị giới hạn bởi số lần đã thực thi.

### Chế độ trường thời gian của bộ sưu tập

Việc sử dụng trường thời gian của một bộ sưu tập để xác định thời gian bắt đầu là một chế độ kích hoạt kết hợp tác vụ định kỳ thông thường với trường thời gian của bộ sưu tập. Chế độ này có thể giúp đơn giản hóa các nút trong một số quy trình cụ thể và cũng trực quan hơn trong cấu hình. Ví dụ, để thay đổi trạng thái của các đơn hàng quá hạn chưa thanh toán thành đã hủy, bạn chỉ cần cấu hình một tác vụ định kỳ ở chế độ trường thời gian của bộ sưu tập, chọn thời gian bắt đầu là 30 phút sau khi đơn hàng được tạo.

## Các mẹo liên quan

### Tác vụ định kỳ khi ứng dụng không hoạt động hoặc bị tắt

Nếu điều kiện thời gian đã cấu hình được đáp ứng, nhưng toàn bộ dịch vụ ứng dụng NocoBase đang ở trạng thái không hoạt động hoặc bị tắt, thì tác vụ định kỳ đáng lẽ phải được kích hoạt vào thời điểm đó sẽ bị bỏ lỡ. Hơn nữa, sau khi dịch vụ được khởi động lại, các tác vụ đã bị bỏ lỡ sẽ không được kích hoạt lại. Do đó, khi sử dụng, bạn có thể cần xem xét cách xử lý các tình huống này hoặc có các biện pháp dự phòng.

### Số lần lặp lại

Khi cấu hình điều kiện kết thúc là "theo số lần lặp lại", hệ thống sẽ tính tổng số lần thực thi của tất cả các phiên bản của cùng một luồng công việc. Ví dụ, nếu một tác vụ định kỳ đã được thực thi 10 lần ở phiên bản 1, và số lần lặp lại cũng được đặt là 10, thì luồng công việc này sẽ không còn được kích hoạt nữa. Ngay cả khi sao chép sang một phiên bản mới, nó cũng sẽ không được kích hoạt, trừ khi bạn thay đổi số lần lặp lại thành một số lớn hơn 10. Tuy nhiên, nếu bạn sao chép thành một luồng công việc mới, số lần đã thực thi sẽ được tính lại từ 0. Trong trường hợp không thay đổi cấu hình liên quan, luồng công việc mới có thể được kích hoạt thêm 10 lần nữa.

### Khác biệt giữa khoảng thời gian và chế độ nâng cao trong quy tắc lặp lại

Khoảng thời gian trong quy tắc lặp lại được tính tương đối so với thời điểm kích hoạt gần nhất (hoặc thời gian bắt đầu), trong khi chế độ nâng cao sẽ kích hoạt vào các thời điểm cố định. Ví dụ, nếu bạn cấu hình kích hoạt mỗi 30 phút một lần, và lần kích hoạt gần nhất là 2021-09-01 12:01:23, thì lần kích hoạt tiếp theo sẽ là 2021-09-01 12:31:23. Còn chế độ nâng cao, tức là chế độ cron, các quy tắc được cấu hình sẽ kích hoạt vào các thời điểm cố định, ví dụ, bạn có thể cấu hình để kích hoạt vào phút 01 và phút 31 của mỗi giờ.

## Ví dụ

Giả sử chúng ta cần kiểm tra mỗi phút các đơn hàng chưa thanh toán sau hơn 30 phút kể từ khi tạo, và tự động thay đổi trạng thái của chúng thành đã hủy. Chúng ta sẽ thực hiện điều này bằng cả hai chế độ.

### Chế độ thời gian tùy chỉnh

Tạo một luồng công việc dựa trên tác vụ định kỳ. Trong cấu hình kích hoạt, chọn chế độ "Thời gian tùy chỉnh", đặt thời gian bắt đầu là bất kỳ thời điểm nào không muộn hơn thời gian hiện tại, chọn "Mỗi phút" cho quy tắc lặp lại và để trống điều kiện kết thúc:

![Tác vụ định kỳ_Cấu hình kích hoạt_Chế độ thời gian tùy chỉnh](https://static-docs.nocobase.com/71131e3f2034263f883062389b356cbd.png)

Sau đó, cấu hình các nút khác theo logic của quy trình, tính toán thời gian 30 phút trước đó, và thay đổi trạng thái của các đơn hàng chưa thanh toán được tạo trước thời điểm đó thành đã hủy:

![Tác vụ định kỳ_Cấu hình kích hoạt_Chế độ thời gian tùy chỉnh](https://static-docs.nocobase.com/188bc5287ffa1fb24a4e7baa1de6eb29.png)

Sau khi luồng công việc được kích hoạt, nó sẽ chạy mỗi phút một lần kể từ thời gian bắt đầu, tính toán thời gian 30 phút trước đó để cập nhật trạng thái của các đơn hàng được tạo trước thời điểm đó thành đã hủy.

### Chế độ trường thời gian của bộ sưu tập

Tạo một luồng công việc dựa trên tác vụ định kỳ. Trong cấu hình kích hoạt, chọn chế độ "Trường thời gian của bộ sưu tập", chọn bộ sưu tập "Đơn hàng", đặt thời gian bắt đầu là 30 phút sau thời gian tạo đơn hàng, và chọn "Không lặp lại" cho quy tắc lặp lại:

![Tác vụ định kỳ_Cấu hình kích hoạt_Chế độ trường thời gian của bộ sưu tập_Kích hoạt](https://static-docs.nocobase.com/d40d5aef57f42799d31cc5882dd94246.png)

Sau đó, cấu hình các nút khác theo logic của quy trình để cập nhật trạng thái của đơn hàng có ID dữ liệu kích hoạt và trạng thái "chưa thanh toán" thành đã hủy:

![Tác vụ định kỳ_Cấu hình kích hoạt_Chế độ trường thời gian của bộ sưu tập_Nút cập nhật](https://static-docs.nocobase.com/491dde9df7f41fb24a4e7baa1de6eb29.png)

Khác với chế độ thời gian tùy chỉnh, ở đây không cần tính toán thời gian 30 phút trước đó, vì ngữ cảnh dữ liệu kích hoạt của luồng công việc đã bao gồm hàng dữ liệu tương ứng thỏa mãn điều kiện thời gian, do đó bạn có thể trực tiếp cập nhật trạng thái của đơn hàng đó.