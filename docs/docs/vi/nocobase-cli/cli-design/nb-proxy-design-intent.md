# Mục đích thiết kế của `nb proxy`

Nếu chỉ nói về tiến trình cốt lõi thì chỉ cần nhớ 3 lệnh sau là đủ:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx reload
```

Trong hầu hết các trường hợp, những gì bạn sử dụng `nb proxy` để thực hiện về cơ bản là ba bước sau:

1. Trước tiên hãy sử dụng `use` để chọn chế độ chạy của nhà cung cấp hiện tại
2. Sau đó sử dụng `generate` để tạo cấu hình mục nhập theo env và tên miền
3. Cuối cùng sử dụng `reload` để cấu hình có hiệu lực

Nếu bạn đang sử dụng Caddy, chỉ cần thay thế `nginx` trong lệnh bằng `caddy`. Nếu Nginx được cài đặt trực tiếp trên máy, chỉ cần thay thế `docker` bằng `local`.

Đây cũng là trải nghiệm mà lớp `nb proxy` này muốn cung cấp nhất: bạn không cần vào chi tiết cấu hình của Nginx hoặc Caddy trước, chỉ cần kết nối lối vào theo quy trình cố định.

## Tại sao chỉ cần nhớ 3 mục này trước là đủ?

Bởi vì vấn đề được `nb proxy` giải quyết thực sự rất hội tụ: **Cung cấp cho ứng dụng một lối vào truy cập bên ngoài ổn định. **

Nếu bạn đã xem [Tổng quan về triển khai môi trường sản xuất](../production/index.md), bạn có thể nhớ nó riêng biệt với `nb app autostart` như thế này:

- `nb app autostart` phụ trách "cách tiếp tục chạy ứng dụng sau khi khởi động lại máy"
- `nb proxy` chịu trách nhiệm về "cách ứng dụng có thể cung cấp quyền truy cập bên ngoài ổn định thông qua Nginx hoặc Caddy"

Vì vậy, trong quy trình triển khai phổ biến nhất, `nb proxy` không đòi hỏi nhiều đầu óc. Hầu hết thời gian là:

- Chọn chế độ hoạt động
- Tạo cấu hình
- Việc tải lại có hiệu lực

Đủ.

## Ba bước này đang làm gì?

### `use`

`use` giải quyết được vấn đề "quản lý đại lý hiện tại như thế nào".

Ví dụ:

- `nb proxy nginx use docker`
- `nb proxy nginx use local`

Bạn có thể coi việc này giống như việc chọn trình điều khiển mặc định của nhà cung cấp hiện tại trước tiên. Các lệnh sau `start`, `reload` và `status` sẽ hoạt động theo cách này.

### `generate`

`generate` giải quyết vấn đề "hiển thị cấu hình mục nhập theo env hiện tại".

Ví dụ:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

Bước này sẽ kết hợp thông tin trong env với các tham số mà lớp đầu vào yêu cầu để tạo cấu hình proxy có thể sử dụng được. Đầu vào quan trọng nhất ở đây thường là:

- `--env`: CLI nào quản lý env để hiển thị
- `--host`: Tên miền nào cần liên kết

Nói cách khác, `generate` quản lý cấu hình sản phẩm chứ không phải trạng thái xử lý.

### `reload`

`reload` giải quyết vấn đề "làm cho cấu hình mới được tạo thực sự hiệu quả".

```bash
nb proxy nginx reload
```

Sự tách biệt này có lợi ích trực tiếp: việc tạo cấu hình và các hành động xử lý không bị trộn lẫn. Khi bạn thay đổi tên miền, cổng hoặc đường dẫn công cộng, hãy tạo lại nó trước rồi quyết định làm cho nó có hiệu lực. Toàn bộ quá trình sẽ rõ ràng hơn.

##Tại sao phải thiết kế như `use → generate → reload`

Bởi vì ba bước này chỉ tương ứng với ba hành động ổn định nhất của lớp lối vào:

- Quyết định đầu tiên cách thức điều hành đại lý
- Sau đó quyết định mục nào sẽ tạo cho môi trường nào
-Cuối cùng để cấu hình có hiệu lực

Nếu bạn đặt tất cả các bước này vào một lệnh hộp đen, sẽ có vẻ như có ít lệnh hơn trên bề mặt. Tuy nhiên, một khi sự cố xảy ra, rất khó để xác định liệu trình điều khiển được chọn sai, cấu hình không được tạo chính xác hay tác nhân chưa được tải lại.

Bây giờ sau khi tháo rời nó như thế này, con đường điều tra sẽ thẳng hơn:

- `use` Sai thì cắt driver thôi
- `generate` không chính xác, hãy tạo lại cấu hình.
- Cấu hình đúng nhưng chưa có hiệu lực, chỉ `reload`

## Tại sao chúng ta cần `nb proxy` riêng

Bởi vì thứ `nb proxy` muốn thống nhất không phải là một tệp cấu hình Nginx nhất định mà là các hành động chung của lớp mục nhập.

Điều bạn thực sự quan tâm thường không phải là:

- File cấu hình rơi vào đường dẫn nào?
- Sự khác biệt về lệnh giữa Nginx và Caddy
- Sự khác biệt về hoạt động giữa local và docker

Điều bạn quan tâm hơn là:

- Làm cách nào để phơi bày env này?
- Làm cách nào để thay đổi tên miền của tôi?
- Làm cách nào để cấu hình mới có hiệu lực?

`nb proxy` là hội tụ những hành động này vào cùng một tập hợp các mục CLI. Bằng cách này, nếu bạn nhớ quy trình cốt lõi trước tiên, bạn có thể bao quát được hầu hết các tình huống. Chỉ khi bạn muốn tiếp tục khắc phục sự cố một cách chi tiết hoặc cần cấu hình đặc biệt, chỉ cần nhìn xuống trang riêng của nhà cung cấp.

## Tổng thể

- `nb proxy` Công dụng cốt lõi của trí óc là `use → generate → reload`
- Đối với hầu hết người dùng, việc nhớ 3 lệnh này là đủ
- Trọng tâm của thiết kế của nó không phải là ẩn tất cả các chi tiết mà trước tiên là sửa các quy trình cấp đầu vào phổ biến nhất.

Nếu muốn tiếp tục xem các lệnh cụ thể, bạn có thể truy cập trực tiếp vào [`nb proxy`](../../api/cli/proxy/index.md). Nếu bạn đã sẵn sàng kết nối với lối vào chính thức, bạn cũng có thể tiếp tục xem [Reverse Proxy](../production/reverse-proxy/index.md).
