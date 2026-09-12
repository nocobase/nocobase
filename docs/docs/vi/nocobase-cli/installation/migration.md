# Cách kết nối phương thức cài đặt cũ với AI và di chuyển sang CLI

Nếu bạn vẫn đang sử dụng mã nguồn Docker, `create-nocobase-app` hoặc Git để cài đặt và bảo trì NocoBase theo tài liệu cũ thì có thể tiếp tục sử dụng theo cách này. Không cần cài đặt lại ứng dụng ngay để truy cập AI.

Trang này chủ yếu giúp bạn xác định lộ trình đầu tiên:

- Tiếp tục sử dụng các phương pháp cài đặt và nâng cấp ban đầu
- Cho phép các ứng dụng hiện có truy cập vào tác nhân AI trước
- Chuyển sang cách tiếp cận dựa trên CLI mới

Theo mặc định, trước tiên bạn nên kiểm tra xem mình thuộc danh mục nào, sau đó nhập tài liệu tương ứng. Điều này ổn định hơn và ít có khả năng vận hành sai môi trường sản xuất.

## Tôi nên chọn phương pháp nào?

| Nếu bạn muốn bây giờ... | Mặc định phải làm gì |
| --- | --- |
| Tiếp tục cài đặt, nâng cấp và bảo trì ứng dụng theo cách gốc | Chỉ cần tiếp tục sử dụng cách cũ, trước tiên hãy đọc mục tài liệu liên quan bên dưới |
| Để ứng dụng cũ đang chạy ổn định kết nối với tác nhân AI | Theo mặc định, kết nối từ xa được sử dụng trước, kết nối này có rủi ro thấp nhất |
| Sử dụng `nb app`, `nb env`, `nb source` để quản lý ứng dụng trong tương lai | Tạo một ứng dụng CLI mới và di chuyển dữ liệu cũ sang đó |

## Tiếp tục sử dụng cách cài đặt gốc

Nếu bạn đã quen với phương pháp cài đặt trước đó, bạn có thể tiếp tục sử dụng nó. Chỉ cần làm theo các tài liệu gốc để cài đặt, nâng cấp và cấu hình biến môi trường.

### Cài đặt NocoBase

- [Cài đặt Docker](/get-started/installation/docker)
- [cài đặt ứng dụng tạo-nocobase](/get-started/installation/create-nocobase-app)
- [Cài đặt mã nguồn Git](/get-started/installation/git)
- [Biến môi trường](/get-started/installation/env)

### Nâng cấp NocoBase

- [Nâng cấp cài đặt Docker](/get-started/upgrading/docker)
- [Nâng cấp cài đặt create-nocobase-app](/get-started/upgrading/create-nocobase-app)
- [Nâng cấp cài đặt mã nguồn Git](/get-started/upgrading/git)

## Cách 1: Trước tiên hãy cho phép các ứng dụng hiện có truy cập AI Agent

Nếu ứng dụng cũ của bạn đã chạy ổn định, hãy sử dụng phương pháp này theo mặc định.

Trọng tâm của phương pháp này trước tiên là kết nối các ứng dụng hiện có với tác nhân CLI và AI thông qua kết nối từ xa. Đây là rủi ro thấp nhất vì nó không trực tiếp đảm nhiệm các quá trình cài đặt, khởi động, dừng và nâng cấp hiện tại của bạn.

Nhưng trước tiên chúng ta phải làm rõ ranh giới:

- Phương pháp này không có khả năng liên quan đến `nb app`
- Nó không đảm nhận việc quản lý thời gian chạy của các ứng dụng cũ cho bạn
- Nhưng các khả năng liên quan đến xây dựng AI có thể được sử dụng bình thường

Nói cách khác, nếu điều bạn quan tâm nhất lúc này là "kết nối AI trước" chứ không phải "chuyển ngay toàn bộ hệ thống quản lý vận hành sang CLI", thì mặc định bạn sẽ đi theo con đường này trước tiên.

Khi kết nối với một ứng dụng hiện có, bạn có thể khởi tạo env CLI như thế này:

```bash
# 默认使用 OAuth 认证
nb init --yes --env app1 \
  --api-base-url=http://your-app-host/api

# 使用 token 认证
nb init --yes --env app1 \
  --api-base-url=http://your-app-host/api \
  --auth-type=token \
  --access-token=<token>
```

Nếu sau này cần xác thực lại, bạn có thể thực thi:

```bash
nb env auth app1
```

Nếu bạn chỉ muốn bắt đầu sử dụng AI để xây dựng các khả năng, chỉ cần tiếp tục đọc [Bắt đầu nhanh về xây dựng AI](/ai-builder/).

## Cách 2: Di chuyển sang CLI

Nếu bạn muốn sử dụng `nb app`, `nb env` và `nb source` để quản lý các ứng dụng cục bộ trong tương lai thì cách tiếp cận an toàn hơn không phải là trực tiếp tiếp quản ứng dụng hiện có mà là tạo một ứng dụng mới rồi di chuyển dữ liệu của ứng dụng cũ tới đó.

Nguyên nhân cũng rất đơn giản: khả năng “tiếp quản các ứng dụng hiện có” vẫn đang được phát triển.

Vì vậy, hiện tại, lộ trình di chuyển mặc định được đề xuất là:

1. Đầu tiên hãy tạo một ứng dụng CLI mới
2. Di chuyển cơ sở dữ liệu, `storage` và các biến môi trường của ứng dụng cũ.
3. Sau khi xác minh rằng hoạt động, nâng cấp và khả năng AI của ứng dụng mới là bình thường, hãy quyết định xem có nên chuyển sang môi trường sản xuất hay không.

Đầu tiên tạo một env CLI mới:

```bash
nb init --yes --env app1
```

Trước khi di chuyển, bạn nên xác nhận rằng những nội dung này đã sẵn sàng:

1. Cơ sở dữ liệu đã được sao lưu
2. Thư mục `storage` đã được sao lưu
3. Các biến môi trường chính của ứng dụng cũ đã được ghi lại, chẳng hạn như `APP_KEY`, `TZ`, `DB_*`, `DB_UNDERSCORED`

Theo mặc định, trước tiên chỉ cần di chuyển môi trường thử nghiệm là đủ. Chỉ di chuyển môi trường sản xuất khi bạn đã xác nhận rằng bản sao lưu, biến môi trường và cấu hình cơ sở dữ liệu đều chính xác.

## Nơi để tìm tiếp theo

- Nếu bạn đã sẵn sàng cài đặt và quản lý ứng dụng theo cách mới, hãy tiếp tục [Cài đặt bằng CLI (được khuyến nghị)](./cli.md)
- Nếu chỉ tiếp tục sử dụng cách cài đặt ban đầu, bạn chỉ cần quay lại mục tài liệu cài đặt và nâng cấp ở trên.
