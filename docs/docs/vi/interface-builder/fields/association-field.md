:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Thành phần Trường Liên kết

## Giới thiệu

Các thành phần trường liên kết của NocoBase được thiết kế để giúp người dùng hiển thị và xử lý dữ liệu liên kết một cách hiệu quả hơn. Bất kể loại liên kết là gì, các thành phần này đều linh hoạt và đa năng, cho phép người dùng lựa chọn và cấu hình chúng theo nhu cầu cụ thể của mình.

### Bộ chọn thả xuống

Đối với tất cả các trường liên kết, trừ khi **bộ sưu tập** đích là **bộ sưu tập** tệp, thành phần mặc định ở chế độ chỉnh sửa là bộ chọn thả xuống. Các tùy chọn thả xuống hiển thị giá trị của trường tiêu đề, phù hợp cho các trường hợp cần chọn nhanh dữ liệu liên kết bằng cách hiển thị thông tin trường chính.

![20240429205659](https://static-docs.nocobase.com/20240429205659.png)

Để biết thêm chi tiết, xem [Bộ chọn thả xuống](/interface-builder/fields/specific/select)

### Bộ chọn dữ liệu

Bộ chọn dữ liệu hiển thị dữ liệu dưới dạng cửa sổ bật lên (popup). Người dùng có thể cấu hình các trường cần hiển thị trong bộ chọn dữ liệu (bao gồm cả các trường từ các liên kết lồng nhau), cho phép chọn dữ liệu liên kết một cách chính xác hơn.

![20240429210824](https://static-docs.nocobase.com/20240429210824.png)

Để biết thêm chi tiết, xem [Bộ chọn dữ liệu](/interface-builder/fields/specific/picker)

### Biểu mẫu con

Khi xử lý dữ liệu liên kết phức tạp hơn, việc sử dụng bộ chọn thả xuống hoặc bộ chọn dữ liệu có thể trở nên bất tiện. Trong những trường hợp như vậy, người dùng cần thường xuyên mở các cửa sổ bật lên. Đối với các tình huống này, bạn có thể sử dụng biểu mẫu con. Nó cho phép người dùng trực tiếp quản lý các trường của **bộ sưu tập** liên kết trên trang hiện tại hoặc trong khối cửa sổ bật lên hiện tại mà không cần liên tục mở các cửa sổ bật lên mới, giúp quy trình làm việc mượt mà hơn. Các liên kết đa cấp được hiển thị dưới dạng biểu mẫu lồng nhau.

![20251029122948](https://static-docs.nocobase.com/20251029122948.png)

Để biết thêm chi tiết, xem [Biểu mẫu con](/interface-builder/fields/specific/sub-form)

### Bảng con

Bảng con hiển thị các bản ghi liên kết một-nhiều hoặc nhiều-nhiều dưới dạng bảng. Nó cung cấp một cách rõ ràng, có cấu trúc để hiển thị và quản lý dữ liệu liên kết, đồng thời hỗ trợ tạo mới dữ liệu hàng loạt hoặc chọn dữ liệu hiện có để liên kết.

![20251029123042](https://static-docs.nocobase.com/20251029123042.png)

Để biết thêm chi tiết, xem [Bảng con](/interface-builder/fields/specific/sub-table)

### Chi tiết con

Chi tiết con là thành phần tương ứng với biểu mẫu con ở chế độ chỉ đọc. Nó hỗ trợ hiển thị dữ liệu với các liên kết đa cấp lồng nhau.

![20251030213050](https://static-docs.nocobase.com/20251030213050.png)

Để biết thêm chi tiết, xem [Chi tiết con](/interface-builder/fields/specific/sub-detail)

### Trình quản lý tệp

Trình quản lý tệp là một thành phần trường liên kết được sử dụng đặc biệt khi **bộ sưu tập** đích của liên kết là một **bộ sưu tập** tệp.

![20240429222753](https://static-docs.nocobase.com/20240429222753.png)

Để biết thêm chi tiết, xem [Trình quản lý tệp](/interface-builder/fields/specific/file-manager)

### Tiêu đề

Thành phần trường tiêu đề là một thành phần trường liên kết được sử dụng ở chế độ chỉ đọc. Bằng cách cấu hình trường tiêu đề, bạn có thể cấu hình thành phần trường tương ứng.

![20251030213327](https://static-docs.nocobase.com/20251030213327.png)

Để biết thêm chi tiết, xem [Tiêu đề](/interface-builder/fields/specific/title)