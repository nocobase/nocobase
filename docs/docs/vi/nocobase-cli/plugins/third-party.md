# Cài đặt và nâng cấp trình cắm của bên thứ ba

Nếu bạn nhận được gói plugin của bên thứ ba, hãy thường nhập gói đó vào `storage/plugins` của ứng dụng đích, sau đó khởi động lại ứng dụng rồi tiếp tục bật hoặc xác minh xem plugin có hiệu lực hay không.

## Lập chỉ mục nhanh

| Tôi muốn... | Tìm ở đâu |
| --- | --- |
| Trước tiên, hãy chuyển sang env đích, sau đó bắt đầu nhập hoặc khởi động lại trình cắm | [Xác nhận môi trường mục tiêu trước](#Xác nhận môi trường mục tiêu trước) |
| Nhập plug-in của bên thứ ba từ các gói nén từ xa, gói nén cục bộ hoặc npm | [Sử dụng `nb plugin import` để nhập các gói trình cắm](#Use -nb-plugin-import-Import các gói trình cắm) |
| Chỉ định plug-in nhập lưu trữ | [Chỉ định đường dẫn lưu trữ để nhập](#Specify-storage-path to import) |
| Sau khi quá trình nhập hoàn tất, hãy để ứng dụng tải lại thư mục plug-in | [`nb app restart`](../../api/cli/app/restart.md) |
| Chính thức kích hoạt plug-in sau lần cài đặt đầu tiên | [`nb plugin enable`](../../api/cli/plugin/enable.md) |
| Nâng cấp plug-in của bên thứ ba đã được kích hoạt | [Việc cần làm khi nâng cấp trình cắm](#Việc cần làm khi nâng cấp trình cắm) |
| Muốn xác nhận xem plugin đã xuất hiện trong ứng dụng hiện tại hay chưa | [`nb plugin list`](../../api/cli/plugin/list.md) |
| Máy mục tiêu không thể kết nối trực tiếp với Internet và chỉ có thể được tải lên thủ công `.tgz` rồi nhập | [Khi không thể kết nối Internet trực tiếp](#Khi không thể kết nối Internet trực tiếp) |

## Xác nhận môi trường mục tiêu trước

Nếu bạn quản lý nhiều ứng dụng cục bộ, trước tiên hãy chuyển sang env đích rồi thao tác:

```bash
nb env use app1
```

## Sử dụng `nb plugin import` để nhập gói plug-in

`nb plugin import` hỗ trợ ba loại nguồn: gói nén từ xa, gói nén cục bộ và tên gói npm. Lệnh này chỉ chịu trách nhiệm nhập trình cắm vào `storage/plugins` và sẽ không tự động kích hoạt trình cắm.

Nếu bạn đã lấy được địa chỉ tải xuống của gói trình cắm, đường dẫn tệp cục bộ hoặc trình cắm đã được xuất bản lên npm, bạn có thể thực thi:

```bash
# 远程压缩包
nb plugin import https://github.com/nocobase/plugin-auth-cas/releases/download/v1.4.0/plugin-auth-cas-1.4.0.tgz

# 本地压缩包
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz

# npm 包名或 tag
nb plugin import @my-scope/plugin-auth-cas@beta
```

Nếu bạn đang sử dụng nguồn npm riêng, thường đăng nhập trước rồi chỉ định sổ đăng ký:

```bash
npm login --registry=https://registry.example.com
nb plugin import @my-scope/plugin-auth-cas@beta --npm-registry=https://registry.example.com
```

## Chỉ định đường dẫn lưu trữ để nhập

Nếu bạn đã biết thư mục gốc `storage` của ứng dụng đích, bạn cũng có thể chuyển trực tiếp `--storage-path` mà không cần dựa vào env hiện tại:

```bash
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz --storage-path ./storage
```

CLI sẽ ghi plugin vào `<storage-path>/plugins`. Tại thời điểm này, bạn không được thực thi `nb env use` trước hoặc vượt qua `--env`.

## Khởi động lại sau khi nhập

Sau khi quá trình nhập hoàn tất, hãy khởi động lại ứng dụng đích:

```bash
nb app restart
```

Nếu bạn không chuyển đổi env hiện tại trước, bạn cũng có thể chuyển `-e <env>` trong lệnh một cách rõ ràng.

## Kích hoạt hoặc xác minh sau khi khởi động lại

Nếu đây là lần cài đặt đầu tiên, hãy khởi động lại rồi kích hoạt plugin:

```bash
nb plugin enable @nocobase/plugin-auth-cas
```

Quá trình cài đặt sẽ tự động hoàn tất khi được bật lần đầu tiên.

## Cần làm gì khi nâng cấp plugin

Nếu plugin đã được bật và lần này bạn chỉ chuyển sang phiên bản mới thì thường chỉ có hai bước:

```bash
nb plugin import /your/path/plugin-auth-cas-1.5.0.tgz
nb app restart
```

Điều tương tự cũng áp dụng nếu bạn nhập gói npm:

```bash
nb plugin import @my-scope/plugin-auth-cas@latest
nb app restart
```

Nói cách khác, kịch bản nâng cấp không yêu cầu thực thi thêm `nb plugin enable`. Chỉ cần nhập gói mới và khởi động lại ứng dụng.

## Khi Internet không thể kết nối trực tiếp

Nếu máy mục tiêu không thể truy cập trực tiếp vào địa chỉ tải xuống plug-in, trước tiên bạn có thể tải tệp `.tgz` lên bất kỳ thư mục nào trên máy mục tiêu, sau đó thực hiện nhập cục bộ trên máy mục tiêu.

Ví dụ:

```bash
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz
nb app restart
```

:::lưu ý cảnh báo

Không cần phải giải nén thủ công vào `storage/plugins` tại đây. `nb plugin import` sẽ tự động đặt plugin vào đúng thư mục.

:::
