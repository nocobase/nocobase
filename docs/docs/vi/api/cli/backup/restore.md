---
title: 'nb backup restore'
description: 'Tài liệu tham khảo lệnh nb backup restore: khôi phục tệp sao lưu cục bộ vào env đích.'
keywords: 'nb backup restore,NocoBase CLI,khôi phục sao lưu,khôi phục,nbdata'
---

# nb backup restore

Khôi phục tệp sao lưu cục bộ vào env đích. Thông thường, ở đây sẽ dùng tệp `*.nbdata`. Việc khôi phục sẽ ghi đè dữ liệu ứng dụng đích, vì vậy CLI mặc định sẽ yêu cầu xác nhận thêm một lần nữa.

## Cách dùng

```bash
nb backup restore --file <path> [flags]
```

## Tham số

| Tham số        | Kiểu    | Mô tả                                                                                                              |
| -------------- | ------- | ------------------------------------------------------------------------------------------------------------------ |
| `--env`, `-e`  | string  | Tên CLI env để khôi phục vào; nếu bỏ qua thì dùng env hiện tại                                                     |
| `--yes`, `-y`  | boolean | Bỏ qua xác nhận tương tác khi env được chỉ định rõ bằng `--env` khác với env hiện tại                              |
| `--file`, `-f` | string  | Đường dẫn tệp sao lưu cục bộ; bắt buộc                                                                             |
| `--force`      | boolean | Xác nhận ghi đè dữ liệu ứng dụng; bắt buộc phải truyền tường minh trong terminal không tương tác và phiên AI agent |

## Ví dụ

```bash
nb backup restore --file ./backups/base.nbdata --force
nb backup restore --env e2e --file ./backups/base.nbdata --yes --force
```

## Giải thích

CLI chỉ kiểm tra xem `--env` có khớp với env hiện tại hay không khi bạn truyền `--env` một cách tường minh. Nếu chỉ định tường minh một env khác, terminal tương tác sẽ xác nhận trước; trong terminal không tương tác hoặc tình huống AI agent, bạn cần tự thêm `--yes` một cách tường minh hoặc chạy `nb env use <name>` trước rồi thử lại.

Trước khi thực thi, CLI sẽ kiểm tra xem đường dẫn mà `--file` trỏ tới có tồn tại hay không, và xác nhận đó là một tệp thông thường. Nếu đường dẫn không tồn tại hoặc trỏ tới thư mục, lệnh sẽ thất bại ngay lập tức.

Nếu không truyền `--force`, terminal tương tác sẽ hiển thị thêm một lần xác nhận nữa, nêu rõ rằng lần khôi phục này sẽ ghi đè dữ liệu ứng dụng. Trong terminal không tương tác và phiên AI agent, nếu thiếu `--force`, CLI sẽ từ chối thực thi trực tiếp và đưa ra một gợi ý chạy lại có thể sao chép ngay. Nếu đồng thời đây cũng là thao tác giữa các env khác nhau, thông thường bạn cần truyền cả `--yes` và `--force`.

Sau khi tải lên thành công, CLI sẽ tiếp tục chờ ứng dụng đích vượt qua `__health_check` một lần nữa. Nói cách khác, khi lệnh trả về thành công, ứng dụng thường đã được khôi phục về trạng thái có thể truy cập.

## Lệnh liên quan

- [`nb backup create`](./create.md)
- [`nb app restart`](../app/restart.md)
