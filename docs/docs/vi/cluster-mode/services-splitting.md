:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Tách dịch vụ <Badge>v1.9.0+</Badge>

## Giới thiệu

Thông thường, tất cả các dịch vụ của ứng dụng NocoBase đều chạy trên cùng một phiên bản Node.js. Khi các tính năng trong ứng dụng trở nên phức tạp hơn theo sự phát triển của nghiệp vụ, một số dịch vụ tốn thời gian có thể ảnh hưởng đến hiệu suất tổng thể.

Để cải thiện hiệu suất của ứng dụng, NocoBase hỗ trợ tách các dịch vụ của ứng dụng để chạy trên các node khác nhau trong chế độ cụm. Điều này nhằm tránh các vấn đề về hiệu suất của một dịch vụ đơn lẻ ảnh hưởng đến toàn bộ ứng dụng, dẫn đến việc không thể phản hồi yêu cầu của người dùng một cách bình thường.

Mặt khác, việc này cũng cho phép mở rộng theo chiều ngang (horizontal scaling) một cách có mục tiêu cho một số dịch vụ nhất định, nâng cao hiệu quả sử dụng tài nguyên của cụm.

Khi triển khai NocoBase trong chế độ cụm, các dịch vụ khác nhau có thể được tách và triển khai để chạy trên các node khác nhau. Sơ đồ dưới đây minh họa cấu trúc tách dịch vụ:

![20250803214857](https://static-docs.nocobase.com/20250803214857.png)

## Những dịch vụ nào có thể được tách

### Luồng công việc bất đồng bộ

**KHÓA Dịch vụ**: `workflow:process`

Các luồng công việc ở chế độ bất đồng bộ, sau khi được kích hoạt sẽ được đưa vào hàng đợi để thực thi. Các luồng công việc này có thể được xem là các tác vụ nền, thường không yêu cầu người dùng chờ đợi kết quả trả về. Đặc biệt đối với các quy trình phức tạp và tốn thời gian, trong trường hợp có lượng kích hoạt lớn, nên tách chúng để chạy trên các node độc lập.

### Các tác vụ bất đồng bộ cấp người dùng khác

**KHÓA Dịch vụ**: `async-task:process`

Bao gồm các tác vụ được tạo bởi hành động của người dùng như nhập và xuất bất đồng bộ. Trong trường hợp khối lượng dữ liệu lớn hoặc có nhiều truy cập đồng thời, nên tách chúng để chạy trên các node độc lập.

## Cách tách dịch vụ

Việc tách các dịch vụ khác nhau sang các node khác nhau được thực hiện bằng cách cấu hình biến môi trường `WORKER_MODE`. Biến môi trường này có thể được cấu hình theo các quy tắc sau:

- `WORKER_MODE=<trống>`: Khi không được cấu hình, hoặc cấu hình là trống, chế độ làm việc tương tự như chế độ đơn phiên bản hiện tại, tiếp nhận tất cả các yêu cầu và xử lý tất cả các tác vụ. Tương thích với các ứng dụng chưa được cấu hình trước đây.
- `WORKER_MODE=!` : Chế độ làm việc chỉ xử lý các yêu cầu, không xử lý bất kỳ tác vụ nào.
- `WORKER_MODE=workflow:process,async-task:process`: Cấu hình với một hoặc nhiều định danh dịch vụ (phân tách bằng dấu phẩy tiếng Anh), chế độ làm việc chỉ xử lý các tác vụ của định danh này, không xử lý yêu cầu.
- `WORKER_MODE=*`: Chế độ làm việc là xử lý tất cả các tác vụ nền, không phân biệt module, nhưng không xử lý yêu cầu.
- `WORKER_MODE=!,workflow:process`: Chế độ làm việc là xử lý yêu cầu, đồng thời chỉ xử lý tác vụ của một định danh cụ thể.
- `WORKER_MODE=-`: Chế độ làm việc là không xử lý bất kỳ yêu cầu hoặc tác vụ nào (chế độ này được yêu cầu trong tiến trình worker).

Ví dụ, trong môi trường K8S, có thể cấu hình các node có chức năng tách dịch vụ tương tự bằng cùng một biến môi trường, giúp dễ dàng mở rộng theo chiều ngang cho một loại dịch vụ cụ thể.

## Ví dụ cấu hình

### Nhiều node xử lý riêng biệt

Giả sử có ba node, lần lượt là `node1`, `node2` và `node3`, có thể được cấu hình như sau:

- `node1`: Chỉ xử lý các yêu cầu UI của người dùng, cấu hình `WORKER_MODE=!`.
- `node2`: Chỉ xử lý các tác vụ luồng công việc, cấu hình `WORKER_MODE=workflow:process`.
- `node3`: Chỉ xử lý các tác vụ bất đồng bộ, cấu hình `WORKER_MODE=async-task:process`.

### Nhiều node xử lý hỗn hợp

Giả sử có bốn node, lần lượt là `node1`, `node2`, `node3` và `node4`, có thể được cấu hình như sau:

- `node1` và `node2`: Xử lý tất cả các yêu cầu thông thường, cấu hình `WORKER_MODE=!`, và một bộ cân bằng tải sẽ tự động phân phối các yêu cầu đến hai node này.
- `node3` và `node4`: Xử lý tất cả các tác vụ nền khác, cấu hình `WORKER_MODE=*`.

## Tham khảo dành cho nhà phát triển

Khi phát triển các plugin nghiệp vụ, có thể dựa trên kịch bản yêu cầu, tiến hành tách các dịch vụ tiêu tốn nhiều tài nguyên. Điều này có thể được thực hiện theo các cách sau:

1. Định nghĩa một định danh dịch vụ mới, ví dụ `my-plugin:process`, để cấu hình biến môi trường và cung cấp tài liệu hướng dẫn.
2. Trong chức năng nghiệp vụ phía máy chủ của plugin, sử dụng giao diện `app.serving()` để kiểm tra môi trường, nhằm quyết định xem node hiện tại có cung cấp một nghiệp vụ cụ thể nào đó được kiểm soát bởi biến môi trường hay không.

```javascript
const MY_PLUGIN_SERVICE_KEY = 'my-plugin:process';
// Trong mã phía máy chủ của plugin
if (this.app.serving(MY_PLUGIN_SERVICE_KEY)) {
  // Xử lý logic nghiệp vụ cho dịch vụ này
} else {
  // Không xử lý logic nghiệp vụ cho dịch vụ này
}
```