---
title: "nb app upgrade"
description: "Tài liệu lệnh nb app upgrade: dừng ứng dụng, thay source code hoặc image đã lưu, rồi thực hiện nâng cấp và khởi động ứng dụng NocoBase được chọn."
keywords: "nb app upgrade,NocoBase CLI,Nâng cấp,Cập nhật,Docker image"
---

# nb app upgrade

Nâng cấp ứng dụng NocoBase được chọn. CLI sẽ dừng ứng dụng hiện tại trước, mặc định thay source code hoặc image đã lưu, đồng bộ plugin thương mại, thực hiện nâng cấp và khởi động ứng dụng, rồi làm mới runtime của env ở bước cuối. Env Docker sẽ tạo lại container ứng dụng từ cấu hình env đã lưu trong lúc khởi động.

## Cách dùng

```bash
nb app upgrade [flags]
```

## Tham số

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `--env`, `-e` | string | Tên CLI env muốn nâng cấp, bỏ qua thì dùng env hiện tại |
| `--yes`, `-y` | boolean | Khi `--env` được truyền tường minh và trỏ tới env khác với env hiện tại, bỏ qua bước xác nhận tương tác |
| `--force`, `-f` | boolean | Bỏ qua bước xác nhận upgrade. Bắt buộc phải truyền rõ trong terminal không tương tác và phiên AI agent |
| `--skip-download`, `-s` | boolean | Bỏ qua bước tải source code hoặc image, rồi thực hiện luồng nâng cấp và khởi động dựa trên source code cục bộ hoặc Docker image đang được lưu; đồng thời bỏ qua `nb license plugins sync` |
| `--version` | string | Ghi đè phiên bản đích cho lần upgrade này; khi thành công, phiên bản mới sẽ được ghi lại vào `downloadVersion` trong cấu hình env |
| `--verbose` | boolean | Hiển thị output của lệnh update và restart bên dưới |

## Ví dụ

```bash
nb app upgrade
nb app upgrade --force
nb app upgrade --env local
nb app upgrade --env local --force
nb app upgrade --env local --skip-download
nb app upgrade --env local --skip-download --version beta
nb app upgrade --env local --version beta
nb app upgrade --env local --verbose
nb app upgrade --env local-docker --skip-download
```

Nếu bạn truyền `--env` một cách tường minh và nó khác env hiện tại, CLI sẽ yêu cầu xác nhận trước. Trong terminal không tương tác hoặc phiên AI agent, hãy tự thêm `--yes` hoặc chạy `nb env use <name>` trước rồi thử lại.

Trước khi bắt đầu upgrade thật sự, terminal tương tác cũng sẽ hỏi xác nhận upgrade lần nữa trừ khi bạn truyền `--force`. Trong terminal không tương tác và phiên AI agent, `nb app upgrade` sẽ từ chối chạy nếu thiếu `--force`, đồng thời in ra lệnh re-run có thể sao chép trực tiếp. Nếu đồng thời là thao tác cross-env, bạn sẽ cần cả `--yes` và `--force`.

Theo mặc định, `nb app upgrade` sẽ chạy các bước sau:

1. `nb app stop`
2. `nb source download --replace`
3. `nb license plugins sync --skip-if-no-license`
4. `nb app start`
5. Lưu `downloadVersion` mới khi cần
6. `nb env update`

Nếu truyền `--skip-download`, CLI sẽ bỏ qua bước 2 và 3 rồi trực tiếp thực hiện luồng nâng cấp và khởi động dựa trên source code hoặc image đang được lưu. Nếu đồng thời truyền `--version`, CLI sẽ không tải phiên bản đó trong lần chạy này; thay vào đó, CLI chỉ lưu nó thành `downloadVersion` mới sau khi khởi động thành công để các lần upgrade sau có thể dùng.

Ở bước 4, CLI sẽ tự động hoàn tất phần chuẩn bị nâng cấp cần thiết theo trạng thái code hiện tại, rồi mới đợi ứng dụng vượt qua `__health_check`. Trong thời gian chờ, CLI sẽ in trước một dòng waiting, sau đó in một dòng progress mỗi 10 giây cho đến khi ứng dụng sẵn sàng hoặc health check hết thời gian chờ.

Nếu bước cuối `nb env update` thất bại, lần upgrade này vẫn được tính là thành công. CLI sẽ in warning và hướng dẫn bạn tự chạy `nb env update <envName>` sau đó.

## Hook script

Nếu env hiện tại đã lưu hook bằng `nb init --hook-script`, `nb app upgrade` truyền lifecycle upgrade cho hook. Với source npm/Git, bước refresh source chạy `beforeDependencyInstall(context)` trước khi cài dependency với `context.phase = 'upgrade'` và `context.command = 'app:upgrade'`.

Sau đó bước startup của upgrade app chạy `beforeAppInstall(context)`, và sau khi app start cũng như vượt qua `__health_check`, chạy `afterAppStart(context)`. Hai hook này cũng dùng `context.phase = 'upgrade'` và `context.command = 'app:upgrade'`. Docker source không chạy `beforeDependencyInstall`, nhưng vẫn chạy hook cấp app.

## Lệnh liên quan

- [`nb source download`](../source/download.md)
- [`nb app restart`](./restart.md)
- [`nb self update`](../self/update.md)
