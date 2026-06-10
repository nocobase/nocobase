# Cấu hình ứng dụng và `.env`

Trang này chỉ áp dụng cho các ứng dụng được tạo hoặc lưu trữ thông qua NocoBase CLI.

Nếu bạn vừa đọc xong [Cài đặt bằng CLI (được khuyến nghị)](./cli.md) và đã xem phần "Thư mục cài đặt", thì những vấn đề phổ biến nhất mà bạn gặp phải thường là như sau:

- Tệp `.env` được đặt ở đâu?
- Cấu hình nào còn phù hợp để ghi vào `.env`
- Cấu hình nào hiện tại phù hợp hơn sẽ được bàn giao cho `nb env update`

Trước tiên hãy nói về kết luận:

- Đối với các ứng dụng đã cài đặt CLI, `.env` được đặt trong `<app-path>/.env` theo mặc định
- File này là tùy chọn, không phải mọi env đều phải được tạo thủ công
- Các cấu hình cơ bản như `APP_KEY`, `TZ`, `APP_PORT`, `APP_PUBLIC_PATH` và `DB_*` được quản lý bởi `nb env update` theo mặc định.
- `.env` chủ yếu được sử dụng để bổ sung các biến thời gian chạy mà CLI chưa trực tiếp tiếp quản, chẳng hạn như bộ lưu trữ, bộ nhớ đệm, nhật ký, quan sát và một số biến mở rộng trình cắm thêm.

## Tìm `app-path` trước

Trong [Cài đặt bằng CLI (được khuyến nghị)](./cli.md#Installation folder), cấu trúc thư mục mặc định của CLI env như sau:

```text
<app-path>/
├── source/
├── storage/
└── .env
```

Nếu bạn không chắc chắn `app-path` hiện được áp dụng ở đâu, bạn có thể kiểm tra trực tiếp:

```bash
nb env info app1 --field app.appPath
```

Chỉ cần thay thế `app1` bằng tên env của bạn.

Nghĩa là, đối với một ứng dụng được tạo hoặc lưu trữ qua CLI, vị trí thích hợp nhất cho tệp `.env` là:

```text
<app-path>/.env
```

Nói chung là không cần cho vào `source/.env`, cũng không cần tìm `.env` trong thư mục gốc của dự án Docker Compose theo cách cài đặt cũ.

## Khi nào bạn cần tự tạo `.env`?

`.env` là tùy chọn.

Nếu bạn chỉ muốn chạy ứng dụng trước hoặc chỉ sửa đổi các cấu hình cơ bản như cổng, múi giờ, kết nối cơ sở dữ liệu và đường dẫn truy cập công cộng thì trong nhiều trường hợp không cần phải tạo `.env` theo cách thủ công.

Chỉ thêm chúng vào `<app-path>/.env` nếu bạn cần thêm một số biến thời gian chạy mà CLI chưa trực tiếp đảm nhận.

## Mặc định là sử dụng `nb env update` trước

Trong phương pháp cài đặt CLI mới, cấu hình ứng dụng cơ bản nên được ưu tiên [`nb env update`](../../api/cli/env/update.md) theo mặc định.

Điều này có hai lợi ích:

- Bản thân cấu hình và env được lưu trong cùng một bộ nhớ CLI, giúp việc kiểm tra và sửa đổi dễ dàng hơn
- Trong tương lai, bạn, các tập lệnh và tác nhân AI có thể tiếp tục sử dụng cùng một bộ lệnh để bảo trì nên không dễ xảy ra tình trạng "một bộ thay đổi được thực hiện trong tệp, nhưng một bộ khác lại được ghi trong CLI"

### Những cấu hình này hiện đã phù hợp hơn để bàn giao cho `nb env update`

Đối với các mục sau đây, trước đây bạn có thể đã quen với việc viết chúng trực tiếp vào `.env`. Tuy nhiên, trong chế độ cài đặt CLI, bạn nên sử dụng `nb env update` theo mặc định:

| Tôi muốn thay đổi... | Cách thay đổi mặc định |
| --- | --- |
| `APP_KEY` | `nb env update <name> --app-key <value>` |
| `TZ` | `nb env update <name> --timezone <value>` |
| `APP_PORT` | `nb env update <name> --app-port <value>` |
| `APP_PUBLIC_PATH` | `nb env update <name> --app-public-path <value>` |
| `CDN_BASE_URL` | `nb env update <name> --cdn-base-url <value>` |
| Loại cơ sở dữ liệu và các tham số kết nối, chẳng hạn như `DB_DIALECT`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD` | `nb env update <name> --db-dialect ... --db-host ... --db-port ... --db-database ... --db-user ... --db-password ...` |
| Lược đồ PostgreSQL, tiền tố bảng, gạch dưới đặt tên cho các mục bổ sung cơ sở dữ liệu như `DB_SCHEMA`, `DB_TABLE_PREFIX`, `DB_UNDERSCORED` | `nb env update <name> --db-schema ... --db-table-prefix ... --db-underscored` |

Ví dụ: nếu bạn muốn thay đổi cổng ứng dụng và múi giờ, bạn có thể viết trực tiếp như thế này:

```bash
nb env update app1 --app-port 13080 --timezone Asia/Shanghai
```

Nếu bạn muốn thay đổi các tham số kết nối cơ sở dữ liệu, bạn có thể viết như sau:

```bash
nb env update app1 \
  --db-dialect postgres \
  --db-host 127.0.0.1 \
  --db-port 5432 \
  --db-database nocobase \
  --db-user nocobase \
  --db-password nocobase
```

Sau khi thực hiện thay đổi, CLI thường sẽ nhắc bạn thực thi `nb app restart` sau. Để biết mô tả tham số đầy đủ hơn, chỉ cần xem [`nb env update`](../../api/cli/env/update.md).

## Tình huống nào phù hợp hơn để viết vào `.env`

Nếu một biến chưa có tham số CLI tương ứng hoặc nó giống như một cấu hình mở rộng "được truyền trực tiếp vào thời gian chạy ứng dụng" thì chỉ cần tiếp tục viết `<app-path>/.env`.

Thường bao gồm các loại sau:

- Cấu hình lưu trữ tệp và lưu trữ đối tượng, chẳng hạn như `LOCAL_STORAGE_*`, `AWS_S3_*`, `ALI_OSS_*`, `TX_COS_*`
- Cấu hình bộ nhớ đệm và Redis, chẳng hạn như `CACHE_*`, `REDIS_URL`
- Cấu hình nhật ký và quan sát, chẳng hạn như `LOGGER_*`, `TELEMETRY_*`
- Một số biến dành riêng cho phần bổ trợ hoặc tiện ích mở rộng, chẳng hạn như xuất, tác vụ không đồng bộ, quy trình làm việc và các biến liên quan đến tiện ích mở rộng AI

Ví dụ:

```bash
LOCAL_STORAGE_DEST=storage/uploads
AWS_S3_BUCKET=your-bucket
AWS_S3_REGION=ap-southeast-1
LOGGER_LEVEL=info
REDIS_URL=redis://127.0.0.1:6379
```

Loại biến này về cơ bản là cấu hình thời gian chạy ứng dụng và CLI hiện sẽ không quản lý từng mục một. Điều tự nhiên nhất là đặt nó trong `.env`.

## Cách phân chia công việc giữa `.env` và `nb env update`

Nếu bạn không chắc chắn nên đặt một cấu hình nhất định ở đâu, chỉ cần tuân theo quy tắc này theo mặc định:

- Nếu `nb env update` đã có tham số tương ứng thì theo mặc định, tham số đó sẽ được sử dụng đầu tiên.
- Nếu không có tham số tương ứng hoặc rõ ràng nó thuộc về cấu hình tiện ích mở rộng thời gian chạy như plug-in, bộ lưu trữ, bộ đệm và nhật ký, hãy đặt nó vào `<app-path>/.env`

Trong hầu hết các tình huống, sự phân công lao động này là đủ.

### Một sự hiểu lầm phổ biến

Không duy trì hai bản sao của cùng một cấu hình cùng một lúc.

Ví dụ: nếu bạn đã lưu các mục cơ bản như `APP_PORT`, `TZ`, `APP_PUBLIC_PATH` và `DB_HOST` bằng `nb env update` thì bạn thường không cần phải viết lại chúng trong `.env`. Nếu không, khi khắc phục sự cố sau này, bạn sẽ dễ dàng không biết được lớp nào là giá trị mà bạn thực sự muốn phát huy tác dụng.

## Ví dụ `.env` tối thiểu

Nếu cấu hình cơ bản của bạn đã được lưu thông qua CLI thì `.env` có thể chỉ cần giữ lại một vài biến mở rộng, chẳng hạn như:

```bash
LOGGER_LEVEL=info
REDIS_URL=redis://127.0.0.1:6379
AWS_S3_BUCKET=your-bucket
AWS_S3_REGION=ap-southeast-1
```

Đây cũng chính là tâm lý mà trang này mong muốn giúp bạn xây dựng nhất:

`.env` vẫn hữu ích, nhưng trong phương pháp cài đặt CLI mới, nó thiên về việc bổ sung cấu hình tiện ích mở rộng thời gian chạy hơn là tiếp tục đảm nhận tất cả các tham số cài đặt cơ bản.

## Nơi để tìm tiếp theo

- Nếu bạn chưa xác nhận cấu trúc thư mục ứng dụng, trước tiên hãy quay lại [Cài đặt bằng CLI (được khuyến nghị)](./cli.md#Installation folder)
- Nếu bạn muốn sửa đổi các cấu hình cơ bản như cổng, múi giờ, kết nối cơ sở dữ liệu và đường dẫn truy cập công cộng, hãy tiếp tục xem [`nb env update`](../../api/cli/env/update.md)
- Nếu bạn muốn khởi động, khởi động lại hoặc xem nhật ký ứng dụng, hãy tiếp tục xem [Quản lý ứng dụng](../Operations/manage-app.md)
