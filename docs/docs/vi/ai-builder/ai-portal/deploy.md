---
title: "Triển khai và quản lý mã nguồn"
description: "Quy trình đầy đủ từ phát triển, đẩy mã nguồn đến triển khai của AI Portal, cùng hai chế độ source storage và cách triển khai đa môi trường."
keywords: "AI Portal,Triển khai,source storage,Git,nb portal deploy,nb portal push,Đa môi trường"
---

# Triển khai và quản lý mã nguồn

:::tip Điều kiện tiên quyết

Trước khi đọc trang này, vui lòng đảm bảo bạn đã chạy được Portal đầu tiên theo [Bắt đầu nhanh với AI Portal](./index.md).

:::

Mã nguồn Portal có ba vị trí: workspace phát triển cục bộ, source storage và sản phẩm đã triển khai. `nb portal` lo việc đồng bộ giữa ba nơi này.

## Vòng đời đầy đủ

Vòng lặp của việc phát triển hằng ngày như sau:

```text
dev (phát triển cục bộ) → push (đẩy mã nguồn) → deploy (build triển khai)
```

Trong đó:

1. `nb portal dev <portal>` — Khởi động dịch vụ phát triển cục bộ, sửa code xem kết quả
2. `nb portal push <portal>` — Đẩy thay đổi mã nguồn cục bộ lên source storage
3. `nb portal deploy <portal>` — Build và triển khai, để thay đổi có hiệu lực với người dùng

Nếu bạn tiếp quản một Portal đồng nghiệp đã dựng sẵn, hoặc vừa đổi máy, hãy kéo về cục bộ trước rồi mới phát triển:

```bash
nb portal list                 # Xem có những Portal nào
nb portal pull customer        # Kéo mã nguồn về cục bộ
nb portal dev customer         # Bắt đầu phát triển
```

`pull` sẽ tải mã nguồn về và giải nén vào workspace phát triển, vị trí mặc định là `./<portal>`, dùng `--path` để trỏ sang chỗ khác. Dependency sẽ được cài tự động; nếu chạy trong CI hoặc bạn muốn tự cài, thêm `--no-install` để bỏ qua.

Sau khi kéo thành công, vị trí của workspace phát triển sẽ được ghi vào CLI env config, các lệnh `dev`, `push`, `deploy` sau đó đều đọc mã nguồn từ vị trí này, không phải chỉ định lại mỗi lần.

## Thêm một Portal

Một ứng dụng có thể có nhiều Portal, trang và quyền độc lập với nhau, còn dữ liệu thì dùng chung. Ví dụ nhân viên nội bộ một entry, khách hàng bên ngoài một entry:

```bash
nb portal create customer
```

Khi tạo, lệnh sẽ dựa trên template `@nocobase/portal-template-default` để sinh `./customer` trong thư mục hiện tại làm workspace phát triển, ghi `.env` và `.env.local`, rồi tự động cài dependency. Muốn đặt sang chỗ khác thì chỉ định bằng `--path`.

<!-- 需要一张 nb portal create 执行完成后的终端输出截图 -->

Tên Portal chỉ được dùng chữ thường, số, dấu gạch dưới và dấu gạch nối, đồng thời phải bắt đầu bằng chữ thường hoặc số.

## source storage

Mã nguồn Portal có thể lưu ở hai nơi:

| Cách | Mô tả | Khi nào dùng |
| --- | --- | --- |
| `nocobase` | Cách mặc định, mã nguồn do source storage phía NocoBase quản lý | Khởi động nhanh, một mình phát triển, không cần review code |
| `git` | Mã nguồn lưu vào repository Git đã chỉ định | Phối hợp nhóm, cần review code, cần nối CI |

Cách mặc định `nocobase` khởi động nhanh nhất, không phải chuẩn bị repository trước. Tuy nhiên nó không có lịch sử phiên bản, sửa sai thì chỉ có thể ghi đè toàn bộ để quay lui. **Nếu Portal này sẽ được lặp lâu dài, khuyến nghị chuyển sang Git từ sớm.**

### Chuyển sang Git

`create` chỉ lo việc sinh workspace phát triển, còn cấu hình source storage thì giao hết cho `config`. Tạo xong lúc nào chuyển cũng được:

```bash
nb portal config customer \
  --source-storage git \
  --git-repo git@github.com:nocobase/customer-portal.git

nb portal push customer --message "Move customer portal source to Git"
```

`config` sẽ đồng bộ cấu hình source storage tới bản ghi Portal ở remote, và các lần `push` sau đó sẽ đi qua Git.

Khi một repository chỉ chứa một Portal, `--git-path` cứ để mặc định là thư mục gốc repository là được. Chỉ khi bạn muốn đặt nhiều Portal vào cùng một repository thì mới cần chỉ định thư mục con:

```bash
nb portal config customer --git-path portals/customer
```

### Kéo tạm một bản từ repository khác

Muốn lấy mã nguồn của một repository khác ra thử mà không muốn đụng vào cấu hình của Portal, `pull` hỗ trợ chỉ định tạm thời:

```bash
nb portal pull customer --git-repo git@github.com:nocobase/another-portal.git
```

Cách này không sửa bản ghi Portal ở remote, và `--git-branch` cùng `--git-path` chỉ dùng được kèm với `--git-repo`. Muốn chuyển hẳn sang lưu bằng Git thì vẫn dùng `config` như ở trên.

`config` cũng đổi được vị trí của workspace phát triển — ví dụ sau khi dời mã nguồn sang thư mục khác, dùng `--path` để báo cho CLI vị trí mới:

```bash
nb portal config customer --path ./workspaces/customer
```

## Khác biệt giữa các kiểu env

`nb portal` có hành vi đồng bộ khác nhau tùy kiểu env:

| Kiểu env | Mô tả |
| --- | --- |
| `local` | Ứng dụng nằm trên máy hiện tại, `pull` kéo mã nguồn về workspace phát triển, `deploy` build từ workspace phát triển rồi đồng bộ sản phẩm triển khai |
| `docker` | Ứng dụng chạy trong Docker, chia sẻ qua volume, hành vi giống trên |
| `http` | Đồng bộ qua API, `pull` / `push` sẽ tải xuống hoặc tải lên bản lưu trữ mã nguồn |

Env kiểu `ssh` hiện chưa hỗ trợ quản lý Portal.

## Triển khai đa môi trường

Cùng một Portal có thể triển khai lên nhiều môi trường khác nhau, dùng `--env` để chỉ định đích:

```bash
nb portal deploy customer --env prod --yes
```

`--yes` dùng để bỏ qua xác nhận tương tác. Khi `--env` bạn truyền vào một cách tường minh không khớp với env hiện tại, CLI mặc định sẽ dừng lại để hỏi một câu; khi chạy trong script hoặc CI, nhớ kèm `--yes`, nếu không lệnh sẽ kẹt ở khâu xác nhận.

Về việc phát hành cấu trúc bảng dữ liệu và cấu hình giữa các môi trường, vui lòng xem [Quản lý phát hành](../publish.md).

## Đường dẫn truy cập

Sau khi triển khai xong, đường dẫn truy cập của Portal là:

```text
<appPublicPath>/x/<portal>/
```

Nếu là Portal thuộc một ứng dụng con:

```text
<appPublicPath>/x/apps/<app>/<portal>/
```

Tiền tố `/x/` là dành riêng cho AI Portal, còn Portal không cần code dùng `/v/`.

## Xóa Portal

```bash
nb portal destroy customer
```

Thao tác này sẽ xóa bản ghi Portal và các file đã triển khai, workspace phát triển cục bộ mặc định được giữ lại. Nếu thực sự muốn xóa luôn cả workspace phát triển, hãy thêm `--delete-dev-path`.

## Liên kết liên quan

- [Bắt đầu nhanh với AI Portal](./index.md) — Chạy được entry frontend đầu tiên do AI viết
- [Cộng tác cùng AI Agent để xây dựng](./agent-workflow.md) — Dùng ngôn ngữ tự nhiên điều khiển AI viết trang
- [Cấu trúc dự án và công nghệ sử dụng](./project-structure.md) — Mô tả lệnh build và biến môi trường
- [Quản lý phát hành](../publish.md) — Phát hành cấu trúc bảng dữ liệu và cấu hình giữa các môi trường
- [Tài liệu tham khảo lệnh `nb portal`](../../api/cli/portal/index.md) — Hướng dẫn đầy đủ các tham số của tất cả lệnh Portal
- [`nb portal create`](../../api/cli/portal/create.md) — Toàn bộ tham số để tạo Portal
- [`nb portal config`](../../api/cli/portal/config.md) — Điều chỉnh source storage và đường dẫn workspace phát triển
- [`nb portal push`](../../api/cli/portal/push.md) — Đẩy mã nguồn lên source storage
- [`nb portal deploy`](../../api/cli/portal/deploy.md) — Build và triển khai Portal
- [`nb portal pull`](../../api/cli/portal/pull.md) — Kéo mã nguồn từ source storage
- [`nb portal destroy`](../../api/cli/portal/destroy.md) — Xóa bản ghi Portal và các file đã triển khai
