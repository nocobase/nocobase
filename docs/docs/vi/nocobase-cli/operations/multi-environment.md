#Quản lý đa môi trường

Nếu bạn duy trì nhiều ứng dụng NocoBase như `dev`, `test`, `staging`, `prod`, v.v., bạn có thể lưu chúng dưới dạng CLI env tương ứng. Hầu hết các lệnh `nb` trong tương lai sẽ hoạt động trên env hiện tại theo mặc định, vì vậy điều quan trọng là phải xác nhận bạn đang sử dụng env nào trước khi thực thi các lệnh như `nb app`, `nb api` và `nb db`.

Bắt đầu từ phiên bản này, CLI chia khái niệm thành `current env` và `last env`. Bạn thường chỉ cần quan tâm đến `current env` - môi trường mà thời gian chạy shell hoặc tác nhân hiện tại đang sử dụng. CLI sẽ chỉ quay lại `last env` chung khi chế độ phiên không được bật.

## Lập chỉ mục nhanh

| Tôi muốn... | Sử dụng lệnh nào |
| --- | --- |
| Tạo một env cục bộ mới và hoàn thành quá trình khởi tạo một cách suôn sẻ | [`nb init`](../../api/cli/init.md) |
| Đăng ký một ứng dụng hiện có dưới dạng CLI env | [`nb env add`](../../api/cli/env/add.md) |
| Xem env nào được lưu cục bộ | [`nb env list`](../../api/cli/env/list.md) |
| Kiểm tra trạng thái kết nối và xác thực của tất cả envs | [`nb env status --all`](../../api/cli/env/status.md) |
| Chuyển env để sử dụng cho các lệnh tiếp theo | [`nb env use`](../../api/cli/env/use.md) |
| Xác nhận env lệnh hiện tại sẽ rơi vào | [`nb env current`](../../api/cli/env/current.md) và [`nb env status`](../../api/cli/env/status.md) |
| Xem cấu hình chi tiết được lưu bởi env | [`nb env info`](../../api/cli/env/info.md) |
| Cập nhật cấu hình env đã lưu, cho phép CLI đồng bộ hóa lại trạng thái hiện tại nếu cần | [`nb env update`](../../api/cli/env/update.md) |
| Xác thực lại sau khi trạng thái đăng nhập hết hạn hoặc sử dụng phương thức xác thực mới | [`nb env auth`](../../api/cli/env/auth.md) |
| Xóa các cấu hình env không sử dụng và dọn sạch tài nguyên được lưu trữ cục bộ nếu cần | [`nb env remove`](../../api/cli/env/remove.md) |

:::tip Nên bật chế độ phiên trước

Theo mặc định, trước tiên bạn nên thực thi [`nb session setup`](../../api/cli/session/setup.md). Bằng cách này, mỗi thiết bị đầu cuối, hệ vỏ khác nhau hoặc thời gian chạy tác nhân khác nhau có thể duy trì `current env` của riêng mình và chúng sẽ không dễ dàng ảnh hưởng lẫn nhau trong các hoạt động song song.

Nếu chế độ phiên không được bật, `nb env use` sẽ quay lại cập nhật `last env` toàn cầu. Trong trường hợp này, nếu một thiết bị đầu cuối cắt môi trường thì thiết bị đầu cuối kia cũng có thể bị ảnh hưởng.

```bash
nb session setup
```

:::

## Tạo nhiều môi trường

Nếu bạn muốn tạo hoặc khôi phục ứng dụng cục bộ, chỉ cần sử dụng `nb init`. Nó sẽ hoàn tất quá trình khởi tạo và lưu kết quả vào một môi trường CLI mới.

```bash
nb init --env dev
nb init --env test
```

Nếu ứng dụng đã tồn tại và bạn chỉ muốn kết nối nó với CLI thì việc sử dụng `nb env add` thường đơn giản hơn:

```bash
nb env add staging --api-base-url http://staging.example.com/api --auth-type oauth
nb env add prod --api-base-url https://api.example.com/api --auth-type token --access-token <token>
```

Cái trước thiên về "khởi tạo một môi trường", trong khi cái sau thiên về "đăng ký một môi trường hiện có". Nếu bạn chỉ đang kết nối với một ứng dụng hiện có, chỉ cần sử dụng `nb env add` theo mặc định.

## Xem môi trường đã cấu hình

Trước tiên hãy sử dụng `nb env list` để xem env nào đã được lưu cục bộ:

```bash
nb env list
```

Lệnh này chỉ hiển thị chính cấu hình và không chủ động kiểm tra trạng thái ứng dụng. Khi bạn muốn xem cả trạng thái kết nối và xác thực, hãy sử dụng `nb env status --all`:

```bash
nb env status --all
```

Bạn thường sẽ thấy các giá trị trạng thái như `ok`, `auth failed`, `unreachable`.

## Chuyển đổi môi trường hiện tại

Sử dụng `nb env use` để chuyển đổi môi trường:

```bash
nb env use dev
```

Sau khi quá trình chuyển đổi hoàn tất, các lệnh tiếp theo bỏ qua `--env` sẽ sử dụng env này theo mặc định.

## Kiểm tra môi trường hiện tại

Nếu bạn không chắc chắn lệnh hiện tại sẽ rơi vào môi trường nào, trước tiên hãy thực hiện hai lệnh sau:

```bash
nb env current
nb env status
```

`nb env current` được sử dụng để xem tên, `nb env status` được sử dụng để xem liệu env hiện tại có thể truy cập được hay không và việc xác thực có bình thường hay không.

## Xem chi tiết của một env

Nếu bạn muốn xem cấu hình nào được lưu trong một env nhất định, hãy sử dụng `nb env info`:

```bash
nb env info dev
nb env info dev --json
nb env info dev --field app.url
nb env info dev --show-secrets
```

Trong số đó, `--field` chỉ phù hợp để lấy một giá trị trong tập lệnh. `--show-secrets` sẽ hiển thị thông tin nhạy cảm như mã thông báo và mật khẩu ở dạng văn bản thuần túy. Chỉ sử dụng chúng khi bạn rõ ràng cần khắc phục sự cố.

## Cập nhật cấu hình env

`nb env update` được sử dụng để điều chỉnh cấu hình của env đã lưu. Chẳng hạn như địa chỉ API, phương thức xác thực, nguồn mã nguồn, cổng ứng dụng và các tham số cơ sở dữ liệu. Sau khi cập nhật hoàn tất, CLI sẽ tự động xử lý các bước tiếp theo dựa trên những thay đổi.

Nếu bạn chỉ muốn CLI đồng bộ lại theo trạng thái mới nhất của env hiện tại, chỉ cần viết như thế này:

```bash
nb env update
nb env update prod
```

Nếu bạn muốn sửa đổi thông tin kết nối hoặc cấu hình cục bộ được lưu bởi env này, bạn có thể đưa các tham số một cách rõ ràng:

```bash
nb env update prod --api-base-url https://api.example.com/api
nb env update prod --access-token <token>
nb env update dev --app-port 13080 --timezone Asia/Shanghai
```

Ở đây trước tiên bạn có thể nhớ lại phán quyết mặc định:

- Để sửa đổi thông tin kết nối hoặc cấu hình cục bộ được lưu bởi env, hãy sử dụng `nb env update`
- Giao diện ứng dụng, plug-in hoặc khả năng sẵn có CLI vừa thay đổi, bạn cũng có thể thực hiện lại `nb env update`
- Trạng thái đăng nhập đã hết hạn hoặc bạn cần thực hiện lại quá trình xác thực, hãy sử dụng `nb env auth`
- Để xem nội dung hiện được lưu, hãy sử dụng `nb env info`

Nếu bạn thay đổi cấu hình đang chạy cục bộ như `app-port`, `timezone` và `db-*`, `update` sẽ chỉ thay đổi giá trị đã lưu và sẽ không tự động khởi động lại ứng dụng. Nói chung, `nb app restart --env <name>` sẽ được thực thi sau; nếu thay đổi liên quan đến cơ sở dữ liệu tích hợp do CLI quản lý, hãy sử dụng `nb app restart --env <name> --with-db`.

## Xác thực lại

Nếu env đã được lưu nhưng trạng thái đăng nhập đã hết hạn hoặc bạn muốn chuyển đổi phương thức xác thực, bạn có thể xác thực lại:

```bash
nb env auth
nb env auth prod
nb env auth prod --auth-type oauth
nb env auth prod --auth-type basic --username admin --password secret
nb env auth prod --auth-type token --access-token <api-key>
```

Khi tên môi trường bị bỏ qua, CLI sẽ sử dụng env hiện tại. Sau khi xác thực hoàn tất, CLI sẽ tự động xử lý việc đồng bộ hóa tiếp theo.

## Xóa môi trường

Những kịch bản này là khó hiểu nhất. Trước tiên bạn có thể nhớ một đề xuất mặc định:

- Nếu bạn chỉ muốn dừng ứng dụng, hãy sử dụng `nb app stop`
- Tôi cũng muốn dừng thời gian chạy cơ sở dữ liệu tích hợp trên máy hiện tại, hãy sử dụng `nb app stop --with-db`
- Nếu bạn chắc chắn rằng env này không còn cần thiết nữa nhưng trước tiên bạn muốn giữ lại bộ nhớ và tệp ứng dụng cục bộ, hãy sử dụng `nb env remove`
- Dọn dẹp ngay cả tài nguyên lưu trữ cục bộ và sử dụng `nb env remove --purge`

Nếu bạn chỉ muốn xóa cấu hình env đã lưu:

```bash
nb env remove staging
```

Nếu đó là env cục bộ hoặc được lưu trữ trên Docker và bạn cũng muốn dọn sạch các tài nguyên đang chạy và dữ liệu lưu trữ trên máy cục bộ, bạn có thể thêm `--purge`:

```bash
nb env remove test --purge
```

Ở chế độ không tương tác, `nb env remove` cần được chuyển vào `--force` một cách rõ ràng:

```bash
nb env remove test --purge --force
```

`--purge` sẽ chỉ dọn sạch các tài nguyên do CLI quản lý trên máy hiện tại. Đối với env API từ xa, nó sẽ không tự xóa dịch vụ từ xa.

Nếu bạn chỉ muốn dừng ứng dụng và cơ sở dữ liệu tích hợp do CLI quản lý, chỉ cần viết:

```bash
nb app stop --env app1 --with-db
```

Nếu bạn muốn xóa env này nhưng vẫn muốn giữ các tệp ứng dụng lưu trữ và cục bộ:

```bash
nb env remove app1 --force
```

Nếu bạn thực sự muốn dọn sạch nội dung được lưu trữ nguyên gốc của env này, hãy thêm `--purge`:

```bash
nb env remove app1 --purge --force
```

Đối với npm/Git env cục bộ được quản lý bằng các lượt tải xuống CLI, `--purge` cũng xóa các tệp ứng dụng cục bộ được lưu trữ trên máy chủ CLI. Đối với HTTP hoặc SSH env, nó sẽ chỉ xóa cấu hình env được lưu trong CLI và sẽ không xóa chính dịch vụ bên ngoài.

## Các liên kết liên quan

- [`nb env` Tham chiếu lệnh](../../api/cli/env/index.md)
- [`nb env update`](../../api/cli/env/update.md)
- [`nb session` Tham chiếu lệnh](../../api/cli/session/index.md)
- [ý định thiết kế ứng dụng nb](../cli-design/nb-app-design-intent.md)
- [Quản lý ứng dụng](./manage-app.md)
