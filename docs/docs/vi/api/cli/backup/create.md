---
title: 'nb backup create'
description: 'Tài liệu tham khảo lệnh nb backup create: tạo bản sao lưu thông qua env đã chọn và tải tệp sao lưu về cục bộ.'
keywords: 'nb backup create,NocoBase CLI,tạo bản sao lưu,tải bản sao lưu,nbdata'
---

# nb backup create

Tạo bản sao lưu thông qua env đã chọn và tải tệp sao lưu về cục bộ. Khi bỏ qua `--output`, CLI sẽ lưu tệp vào thư mục làm việc hiện tại và giữ nguyên tên tệp sao lưu do phía từ xa trả về — thường là `backup_*.nbdata`.

## Cách dùng

```bash
nb backup create [flags]
```

## Tham số

| Tham số               | Kiểu    | Mô tả                                                                                                                                                   |
| --------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--env`, `-e`         | string  | Tên CLI env cần tạo bản sao lưu; nếu bỏ qua thì dùng env hiện tại                                                                                       |
| `--yes`, `-y`         | boolean | Bỏ qua xác nhận tương tác khi env được chỉ định rõ bằng `--env` khác với env hiện tại                                                                   |
| `--output`, `-o`      | string  | Đường dẫn đích để tải xuống. Nếu bỏ qua thì lưu vào thư mục hiện tại; nếu trỏ đến một thư mục đã tồn tại, tên tệp sao lưu từ xa sẽ được tự động nối vào |
| `--json-output`, `-j` | boolean | Xuất kết quả cuối cùng dưới dạng JSON, gồm các trường `env`, `name` và `output`                                                                         |

## Ví dụ

```bash
nb backup create
nb backup create --output ./backups
nb backup create --output ./backups/base.nbdata
nb backup create --env e2e --output ./backups --yes
nb backup create --env e2e --json-output
```

## Mô tả

CLI chỉ kiểm tra xem `--env` có khớp với env hiện tại hay không khi bạn truyền `--env` một cách tường minh. Nếu tường minh chỉ định một env khác, terminal tương tác sẽ yêu cầu xác nhận trước; trong terminal không tương tác hoặc trong ngữ cảnh AI agent, bạn cần tự thêm `--yes` một cách tường minh, hoặc chạy `nb env use <name>` trước rồi thử lại.

Quy trình tạo được chia thành hai bước: trước tiên gọi backup API của env đích để tạo bản sao lưu từ xa, sau đó thăm dò trạng thái mỗi 2 giây một lần; sau khi bản sao lưu hoàn tất, tệp sẽ được tải về cục bộ. Nếu sau 600 giây phía từ xa vẫn trả về `inProgress: true`, lệnh sẽ thoát do hết thời gian chờ.

`--output` có thể là đường dẫn tệp hoặc đường dẫn tới một thư mục đã tồn tại. CLI chỉ nhận diện đường dẫn đã tồn tại là thư mục; nếu đường dẫn chưa tồn tại, nó sẽ được xử lý như đường dẫn tệp đích.

Sau khi truyền `--json-output`, CLI sẽ không còn xuất văn bản tiến trình nữa mà in trực tiếp kết quả JSON cuối cùng. Chế độ này phù hợp hơn để các script và luồng agent tiếp tục sử dụng.

## Lệnh liên quan

- [`nb backup restore`](./restore.md)
- [`nb env update`](../env/update.md)
