# Cài đặt bằng CLI (được khuyến nghị)

Sau NocoBase 2.1.0, phương pháp quản lý và cài đặt dựa trên CLI chính thức được cung cấp. Bạn có thể sử dụng nó để hoàn tất quá trình cài đặt, kết nối, nâng cấp và bảo trì hàng ngày, đồng thời bạn cũng có thể chuẩn bị một môi trường có thể kết nối và hoạt động được cho Tác nhân AI.

## Cài đặt NocoBase CLI

Chỉ được thực thi khi cài đặt CLI lần đầu tiên.

Đầu tiên cài đặt CLI trên toàn cầu:

```bash
npm install -g @nocobase/cli@beta
nb --version
```

:::tip Nên bật chế độ phiên trước

Nếu bạn định mở nhiều thiết bị đầu cuối hoặc shell cùng lúc hoặc muốn Tác nhân AI hoạt động song song với chính mình, thì theo mặc định, bạn nên thực thi [`nb session setup`](../../api/cli/session/setup.md) trước. Bằng cách này, mỗi phiên có thể duy trì `current env` của riêng mình và sẽ không dễ dàng ảnh hưởng lẫn nhau.

```bash
nb session setup
```

:::

Nếu bạn dự định sử dụng giao diện tiếng Trung trong thời gian dài, thông thường chỉ cần đặt ngôn ngữ trước là đủ:

```bash
nb config set locale zh-CN
```

CLI kiểm tra việc tự cập nhật theo mặc định. Bạn có thể điều chỉnh chiến lược cập nhật theo thói quen của riêng mình:

- `prompt`: Nhắc khi tìm thấy phiên bản mới
- `auto`: cập nhật tự động
- `off`: Tắt cập nhật tự động

```bash
nb config set update.policy prompt
nb config set update.policy auto
nb config set update.policy off
```

Nếu bạn định triển khai NocoBase cho máy chủ và muốn mở trình hướng dẫn `nb init --ui` từ trình duyệt từ xa, trước tiên bạn nên thay đổi máy chủ mặc định của CLI thành IP máy chủ hiện tại:

```bash
nb config set default-ui-host <server-ip>
nb config set default-api-host <server-ip>
```

Thay thế `<server-ip>` bằng IP thực của máy chủ hiện tại mà bạn có thể truy cập được.

`nb config` là cấu hình chung của CLI. Thông thường, nó chỉ cần được đặt một lần và các giá trị mặc định này sẽ được tự động sử dụng khi chạy lại `nb init --ui` sau đó, do đó không cần phải lặp lại cấu hình mỗi lần.

Nói chung:

- `default-ui-host` được sử dụng làm địa chỉ nghe mặc định của `nb init --ui` khi bắt đầu trang hướng dẫn
- `default-api-host` cho địa chỉ API được tạo theo mặc định khi cài đặt mới

Nếu được triển khai trên máy chủ, cả hai giá trị thường phải được thay đổi thành IP có thể truy cập được trên máy chủ hiện tại, thay vì tiếp tục sử dụng địa chỉ cục bộ mặc định.

:::cảnh báo Đây chỉ là trình hướng dẫn cài đặt hoặc phương pháp truy cập tạm thời, không phải là lối vào được đề xuất cho môi trường sản xuất.

Đặt `default-ui-host` / `default-api-host` thành IP máy chủ, chủ yếu để bạn có thể mở `nb init --ui` từ trình duyệt từ xa hoặc tạm thời xác minh xem dịch vụ có thể truy cập được sau khi cài đặt hoàn tất hay không.

Điều này không có nghĩa là môi trường sản xuất nên sử dụng `IP + port` để cung cấp dịch vụ bên ngoài trong thời gian dài. Khi triển khai chính thức, bạn vẫn nên sử dụng tên miền và cung cấp quyền truy cập thống nhất thông qua proxy ngược như Nginx hoặc Caddy, sau đó bật HTTPS.

:::

## Cài đặt NocoBase

### Cách 1: Cài đặt thông qua UI Wizard

Đây là mục được đề xuất mặc định. Bạn chỉ cần chạy:

```bash
nb init --ui
```

Nếu bạn muốn chỉ định một cổng cố định cho trang trình hướng dẫn, bạn có thể thêm trực tiếp `--ui-port`, ví dụ:

```bash
nb init --ui --ui-port 3000
```

![Trình hướng dẫn giao diện người dùng init nb](https://static-docs.nocobase.com/2026-06-03-20-54-01.png)

Trình hướng dẫn sẽ hướng dẫn bạn từng bước để hoàn tất cấu hình cần thiết cho việc cài đặt hoặc kết nối dựa trên tình huống hiện tại.

### Cách 2: Tương tác qua terminal

Nếu bạn thấy thoải mái hơn khi gõ từng bước trong terminal, bạn có thể chạy trực tiếp:

```bash
nb init
```

![2026-06-03-21-36-33](https://static-docs.nocobase.com/2026-06-03-21-36-33.png)

### Cách 3: Thông qua các lệnh không tương tác

Nếu bạn đang chạy trong tập lệnh, CI/CD hoặc môi trường không tương tác khác, chỉ cần sử dụng `--yes`. Trong chế độ này, `--env` phải được chuyển một cách rõ ràng và các tham số không được chỉ định rõ ràng sẽ được xử lý theo giá trị mặc định.

Cách mặc định ngắn nhất để viết nó là:

```bash
nb init --yes --env app1
```

Cụ thể đối với các kết hợp phổ biến như các nguồn cài đặt khác nhau, lựa chọn phiên bản, chứng nhận `basic`, kết nối CI/CD với các ứng dụng hiện có và đặt tên cơ sở dữ liệu, chỉ cần xem [ví dụ tham chiếu lệnh `nb init`](../../api/cli/init.md#).

## Bạn nên xác nhận điều gì trước tiên sau khi cài đặt hoàn tất?

`--env` là tên môi trường trong CLI. Nói chung, việc tiếp theo bạn làm sau khi cài đặt hoàn tất sẽ xoay quanh env này.

Thông thường nên xác nhận 3 điều sau trước:

1. Env đã được tạo và lưu thành công chưa
2. Ứng dụng có thể được khởi động bình thường hay không và nhật ký có bình thường không
3. Nếu bạn định chính thức mở nó ra thế giới bên ngoài, bạn đã lên kế hoạch bước vào môi trường sản xuất thay vì tiếp tục sử dụng trực tiếp `IP + port` chưa?

### Thư mục cài đặt

Nếu bạn vừa cài đặt một ứng dụng cục bộ bằng `nb init --env app1`, bạn có thể xem đường dẫn đầy đủ thông qua `nb env info app1 --field app.appPath`.

Theo mặc định, CLI sắp xếp các tệp cục bộ trong `app-path` theo quy ước sau:

```text
<app-path>/
├── source/   # 应用源码或下载内容对应的默认目录
├── storage/  # 运行时数据目录
└── .env      # 可选的应用环境变量文件
```

Nói chung:

- `source/` chủ yếu tương ứng với thư mục ứng dụng cục bộ của npm/Git env. Đối với Docker env, CLI cũng sẽ giữ lại tập hợp dẫn xuất đường dẫn mặc định này, nhưng hầu hết bạn không cần phải quan tâm đến nó một cách thủ công
- `storage/` được sử dụng để lưu trữ dữ liệu thời gian chạy, chẳng hạn như dữ liệu cơ sở dữ liệu tích hợp, plugin, nhật ký, v.v.
- `.env` là tệp biến môi trường ứng dụng tùy chọn. Chỉ khi bạn cần tùy chỉnh các biến môi trường, bạn mới cần thêm nó vào `<app-path>/.env`; nếu tệp này tồn tại, các nguồn cài đặt Docker, npm và Git sẽ đọc nó theo mặc định.

Xem [`nb init` Tham chiếu lệnh](../../api/cli/init.md) để biết mô tả đầy đủ hơn.

### Lời nhắc triển khai môi trường sản xuất

Nếu bạn vừa cài đặt xong và muốn xác minh kết quả cài đặt trước, thường không có vấn đề gì khi mở trang bằng `IP + port`.

Nhưng nếu môi trường này chuẩn bị cung cấp dịch vụ chính thức cho thế giới bên ngoài thì cần đặc biệt chú ý:

- Bản thân `nb init --ui` chỉ là một trang tạm thời của trình hướng dẫn cài đặt, được sử dụng để hoàn tất quá trình cài đặt hoặc khởi tạo và không phải là lối vào dịch vụ bên ngoài chính thức của ứng dụng.
- Sau khi quá trình cài đặt thông qua `nb init` hoàn tất, `IP + port` hiện được ứng dụng hiển thị sẽ phù hợp hơn cho giai đoạn gỡ lỗi, giai đoạn xác minh hoặc truy cập tạm thời vào mạng nội bộ
- Trong môi trường production, không nên đưa trực tiếp cổng ứng dụng NocoBase ra mạng công cộng để sử dụng lâu dài.
- Để truy cập chính thức từ bên ngoài, nên sử dụng tên miền và proxy ngược tới NocoBase thông qua Nginx hoặc Caddy
- Môi trường sản xuất nên ưu tiên bật HTTPS hơn là sử dụng lâu dài `http://IP:port` bị lộ

Nói cách khác, `default-ui-host` và `default-api-host` chỉ nhằm mục đích làm cho trình hướng dẫn cài đặt và tạo địa chỉ mặc định thuận tiện hơn chứ không đại diện cho lối vào truy cập vào môi trường sản xuất cuối cùng.

Nếu env này đã sẵn sàng để ra mắt chính thức, bạn nên "kết nối với proxy ngược và bật HTTPS" làm bước tiếp theo sau khi quá trình cài đặt hoàn tất, thay vì một mục tối ưu hóa tùy chọn.

Nếu bạn đã sẵn sàng tiến hành triển khai chính thức ngay bây giờ, thì bạn nên bắt đầu với [triển khai môi trường sản xuất](../production/index.md), sau đó tiếp tục xem xét cấu hình proxy ngược của [Nginx](../production/reverse-proxy/nginx.md) hoặc [Caddy](../production/reverse-proxy/caddy.md) nếu cần.

###Hoạt động hàng ngày

Trước tiên bạn có thể xác nhận xem env này đã được lưu thành công chưa:

```bash
nb env current
nb env list
nb env status
nb env info app1
nb env info app1 --json
```

Nếu muốn tiếp tục các thao tác tiếp theo sau khi cài đặt, bạn có thể click vào mục lục sau để nhìn xuống:

| Tôi muốn... | Tìm ở đâu |
| --- | --- |
| Nếu bạn đã sẵn sàng mở env này chính thức với thế giới bên ngoài, hãy kết nối nó với proxy ngược của môi trường sản xuất và sử dụng tên miền và HTTPS để hiển thị dịch vụ. | [Nginx](../production/reverse-proxy/nginx.md) / [Caddy](../production/reverse-proxy/caddy.md). |
| Xác nhận xem env có được lưu thành công hay không, kiểm tra xem env nào hiện đang được sử dụng và chuyển đổi giữa nhiều env. | [`nb env`](../../api/cli/env/index.md), [Quản lý đa môi trường](../Operations/multi-environment.md). |
| Bắt đầu, dừng, khởi động lại ứng dụng, xem nhật ký hoặc tiếp tục nâng cấp ứng dụng. | [`nb app`](../../api/cli/app/index.md), [Quản lý ứng dụng](../Operations/manage-app.md). |
| Kiểm tra kết nối cơ sở dữ liệu, xem trạng thái cơ sở dữ liệu tích hợp hoặc khắc phục sự cố vùng chứa cơ sở dữ liệu. | [`nb db`](../../api/cli/db/index.md). |
| Xem các plug-in đã cài đặt, bật hoặc tắt các plug-in. | [`nb plugin`](../../api/cli/plugin/index.md). |
| Kích hoạt ủy quyền thương mại, kiểm tra trạng thái ủy quyền và đồng bộ hóa các plugin thương mại. | [`nb license`](../../api/cli/license/index.md). |
| Quản lý các dự án mã nguồn cục bộ, chẳng hạn như tải mã nguồn xuống, bắt đầu chế độ phát triển, xây dựng hoặc thử nghiệm. Điều này thường được sử dụng với npm/Git env. | [`nb source`](../../api/cli/source/index.md). |

Nếu bạn vừa cài đặt một ứng dụng cục bộ, trước tiên bạn có thể chạy các lệnh này:

```bash
nb env use app1
nb app start
nb app logs
nb plugin list
```

Nếu bạn duy trì nhiều env cùng một lúc, hãy xem [Quản lý nhiều môi trường](../hoạt động/multi-environment.md) để biết các phương pháp xem trạng thái và chuyển đổi tiếp theo.

Nếu bạn muốn nâng cấp ứng dụng sau này, chỉ cần xem [Quản lý ứng dụng](../Operations/manage-app.md) và [`nb app upgrade` Tham chiếu lệnh](../../api/cli/app/upgrade.md).

## Các liên kết liên quan

- [`nb init` Tham chiếu lệnh](../../api/cli/init.md)
- [`nb env info` Tham chiếu lệnh](../../api/cli/env/info.md)
- [Proxy ngược môi trường sản xuất: Nginx](../production/reverse-proxy/nginx.md) / [Caddy](../production/reverse-proxy/caddy.md)
- [Di chuyển từ cách cũ sang CLI](./migration.md)
- [Quản lý nhiều môi trường](../Operations/multi-environment.md)
- [Quản lý ứng dụng](../Operations/manage-app.md)
