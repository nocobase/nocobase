---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/multi-app/multi-app/local).
:::

# Chế độ bộ nhớ dùng chung

## Giới thiệu

Khi người dùng muốn chia tách nghiệp vụ ở cấp độ ứng dụng nhưng không muốn áp dụng kiến trúc triển khai và vận hành phức tạp, có thể sử dụng chế độ đa ứng dụng bộ nhớ dùng chung.

Trong chế độ này, nhiều ứng dụng có thể chạy đồng thời trong một phiên bản NocoBase. Mỗi ứng dụng là độc lập, có thể kết nối với cơ sở dữ liệu riêng biệt, có thể được tạo, khởi động và dừng một cách riêng lẻ, nhưng chúng chia sẻ cùng một tiến trình và không gian bộ nhớ, người dùng vẫn chỉ cần bảo trì một phiên bản NocoBase duy nhất.

## Hướng dẫn sử dụng

### Cấu hình biến môi trường

Trước khi sử dụng tính năng đa ứng dụng, hãy đảm bảo các biến môi trường sau đã được thiết lập khi khởi động NocoBase:

```bash
APP_DISCOVERY_ADAPTER=local
APP_PROCESS_ADAPTER=local
```

### Tạo ứng dụng

Trong menu cài đặt hệ thống, nhấp vào "Trình quản lý ứng dụng" để vào trang quản lý ứng dụng.

![](https://static-docs.nocobase.com/202512291056215.png)

Nhấp vào nút "Thêm mới" để tạo một ứng dụng mới.

![](https://static-docs.nocobase.com/202512291057696.png)

#### Giải thích các mục cấu hình

| Mục cấu hình | Mô tả |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Tên ứng dụng** | Tên hiển thị của ứng dụng trong giao diện |
| **Định danh ứng dụng** | Định danh ứng dụng, là duy nhất trên toàn hệ thống |
| **Chế độ khởi động** | - Khởi động khi truy cập lần đầu: Chỉ khởi động khi người dùng truy cập ứng dụng con qua URL lần đầu tiên<br>- Khởi động cùng ứng dụng chính: Khởi động ứng dụng con đồng thời khi ứng dụng chính khởi động (sẽ làm tăng thời gian khởi động của ứng dụng chính) |
| **Môi trường** | Trong chế độ bộ nhớ dùng chung, chỉ có môi trường cục bộ khả dụng, tức là `local` |
| **Kết nối cơ sở dữ liệu** | Dùng để cấu hình nguồn dữ liệu chính của ứng dụng, hỗ trợ ba phương thức sau:<br>- Cơ sở dữ liệu mới: Sử dụng lại dịch vụ cơ sở dữ liệu hiện tại, tạo cơ sở dữ liệu độc lập<br>- Kết nối dữ liệu mới: Kết nối với dịch vụ cơ sở dữ liệu khác<br>- Chế độ Schema: Khi nguồn dữ liệu chính hiện tại là PostgreSQL, tạo một Schema độc lập cho ứng dụng |
| **Nâng cấp** | Nếu cơ sở dữ liệu được kết nối chứa dữ liệu ứng dụng NocoBase phiên bản thấp hơn, có cho phép tự động nâng cấp lên phiên bản ứng dụng hiện tại hay không |
| **Khóa JWT** | Tự động tạo khóa JWT độc lập cho ứng dụng, đảm bảo phiên làm việc của ứng dụng độc lập với ứng dụng chính và các ứng dụng khác |
| **Tên miền tùy chỉnh** | Cấu hình tên miền truy cập độc lập cho ứng dụng |

### Khởi động ứng dụng

Nhấp vào nút **Khởi động** để khởi động ứng dụng con.

> Nếu đã chọn *"Khởi động khi truy cập lần đầu"* khi tạo, ứng dụng sẽ tự động khởi động trong lần truy cập đầu tiên.

![](https://static-docs.nocobase.com/202512291121065.png)

### Truy cập ứng dụng

Nhấp vào nút **Truy cập**, ứng dụng con sẽ được mở trong một tab mới.

Mặc định sử dụng `/apps/:appName/admin/` để truy cập ứng dụng con, ví dụ:

```bash
http://localhost:13000/apps/a_7zkxoarusnx/admin/
```

Đồng thời, cũng có thể cấu hình tên miền độc lập cho ứng dụng con, cần trỏ tên miền về IP hiện tại, nếu sử dụng Nginx, cũng cần thêm tên miền vào cấu hình Nginx.

### Dừng ứng dụng

Nhấp vào nút **Dừng** để dừng ứng dụng con.

![](https://static-docs.nocobase.com/202512291122113.png)

### Trạng thái ứng dụng

Có thể xem trạng thái hiện tại của từng ứng dụng trong danh sách.

![](https://static-docs.nocobase.com/202512291122339.png)

### Xóa ứng dụng

Nhấp vào nút **Xóa** để gỡ bỏ ứng dụng.

![](https://static-docs.nocobase.com/202512291122178.png)

## Câu hỏi thường gặp

### 1. Quản lý plugin

Các plugin mà ứng dụng khác có thể sử dụng giống với ứng dụng chính (bao gồm cả phiên bản), nhưng có thể cấu hình và sử dụng plugin một cách độc lập.

### 2. Cách ly cơ sở dữ liệu

Các ứng dụng khác có thể cấu hình cơ sở dữ liệu độc lập, nếu muốn chia sẻ dữ liệu giữa các ứng dụng, có thể thực hiện thông qua nguồn dữ liệu bên ngoài.

### 3. Sao lưu và di trú dữ liệu

Hiện tại, việc sao lưu dữ liệu trên ứng dụng chính không hỗ trợ bao gồm dữ liệu của các ứng dụng khác (chỉ bao gồm thông tin cơ bản của ứng dụng), cần thực hiện sao lưu và di trú thủ công bên trong các ứng dụng khác.

### 4. Triển khai và cập nhật

Trong chế độ bộ nhớ dùng chung, phiên bản của các ứng dụng khác sẽ tự động nâng cấp theo ứng dụng chính, tự động đảm bảo tính nhất quán về phiên bản ứng dụng.

### 5. Phiên làm việc của ứng dụng

- Nếu ứng dụng sử dụng khóa JWT độc lập, phiên làm việc của ứng dụng sẽ độc lập với ứng dụng chính và các ứng dụng khác. Nếu truy cập các ứng dụng khác nhau qua các đường dẫn con của cùng một tên miền, do TOKEN ứng dụng được lưu trong LocalStorage, người dùng cần đăng nhập lại khi chuyển đổi giữa các ứng dụng khác nhau. Khuyến nghị cấu hình tên miền độc lập cho các ứng dụng khác nhau để đạt được sự cách ly phiên làm việc tốt hơn.
- Nếu ứng dụng không sử dụng khóa JWT độc lập, nó sẽ chia sẻ phiên làm việc của ứng dụng chính, người dùng không cần đăng nhập lại khi quay lại ứng dụng chính sau khi truy cập ứng dụng khác trong cùng một trình duyệt. Tuy nhiên, điều này tiềm ẩn rủi ro bảo mật, nếu ID người dùng ở các ứng dụng khác nhau bị trùng lặp, có thể dẫn đến việc người dùng truy cập trái phép vào dữ liệu của ứng dụng khác.