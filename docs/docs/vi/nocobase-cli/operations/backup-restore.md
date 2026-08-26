# Sao lưu và khôi phục

Nếu bạn đã lưu ứng dụng NocoBase dưới dạng CLI env, việc sao lưu và khôi phục hàng ngày về cơ bản được hoàn thành trong nhóm lệnh `nb backup`. `nb backup create` được sử dụng để tạo bản sao lưu trong env đích và tải nó xuống cục bộ. `nb backup restore` được sử dụng để khôi phục tệp sao lưu cục bộ về env đích.

Trong hầu hết mọi trường hợp, chỉ cần nhớ lời khuyên mặc định là: sao lưu trước khi nâng cấp, di chuyển hoặc thay đổi hàng loạt dữ liệu; chỉ thực hiện khôi phục khi bạn biết rõ rằng bạn muốn ghi đè lên dữ liệu hiện tại.

## Lập chỉ mục nhanh

| Tôi muốn... | Sử dụng lệnh nào |
| --- | --- |
| Đầu tiên hãy sao lưu env hiện tại vào local | [`nb backup create`](../../api/cli/backup/create.md) |
| Lưu bản sao lưu vào thư mục được chỉ định | [`nb backup create --output ./backups`](../../api/cli/backup/create.md) |
| Hãy để tập lệnh tiếp tục sử dụng kết quả sao lưu | [`nb backup create --json-output`](../../api/cli/backup/create.md) |
| Khôi phục bản sao lưu cục bộ về env hiện tại | [`nb backup restore --file ./backups/xxx.nbdata --force`](../../api/cli/backup/restore.md) |
| Khôi phục bản sao lưu cục bộ sang env khác | [`nb backup restore --env app1 --file ./backups/xxx.nbdata --yes --force`](../../api/cli/backup/restore.md) |

:::tip trước tiên hãy xác nhận env hiện tại

Lệnh `nb backup` hoạt động trên env hiện tại theo mặc định. Nếu bạn duy trì nhiều môi trường cùng một lúc, khuyến nghị mặc định là xem xét env hiện tại trước khi thực hiện sao lưu hoặc khôi phục.

```bash
nb env current
nb env use app1
```

Nếu bạn chuyển một `--env` khác một cách rõ ràng, CLI thường sẽ yêu cầu xác nhận. Trong tập lệnh hoặc tình huống không tương tác, bạn có thể thêm `--yes` để bỏ qua bước này.

:::

## Tạo bản sao lưu

Cách sử dụng đơn giản nhất là tạo bản sao lưu trực tiếp:

```bash
nb backup create
```

Sau khi lệnh trả về thành công, tệp sao lưu đã được tải xuống cục bộ. Khi `--output` bị bỏ qua, CLI sẽ lưu tệp vào thư mục làm việc hiện tại và sử dụng tên tệp được trả về bởi đầu từ xa—thường là `backup_*.nbdata`.

Nếu bạn muốn đặt các bản sao lưu vào một thư mục, bạn có thể sử dụng:

```bash
nb backup create --output ./backups
```

Nếu `./backups` đã tồn tại và đó là một thư mục, CLI sẽ tự động thêm tên tệp sao lưu từ xa vào thư mục. Chỉ khi đường dẫn không tồn tại, CLI mới coi nó là đường dẫn tệp đích.

Nếu bạn muốn tiếp tục sử dụng kết quả sao lưu trong tập lệnh, CI hoặc liên kết tác nhân, bạn có thể thêm `--json-output`:

```bash
nb backup create --env app1 --yes --json-output
```

Ở chế độ này, CLI không còn xuất văn bản tiến trình nữa mà trực tiếp trả về JSON cuối cùng, thường chứa ba trường: `env`, `name` và `output`.

## Khôi phục bản sao lưu

Lệnh khôi phục sẽ tải tệp sao lưu cục bộ lên env đích và ghi đè dữ liệu ứng dụng hiện tại:

```bash
nb backup restore --file ./backups/backup_20260520_190408_8397.nbdata --force
```

Nếu bạn muốn khôi phục lại một cái gì đó khác với env hiện tại, cách viết như thế này thường an toàn hơn:

```bash
nb backup restore --env app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

:::lưu ý cảnh báo

Phục hồi là một hoạt động bảo hiểm đầy đủ. Theo mặc định, bạn nên tạo một bản sao lưu khác của env đích hiện tại trước khi khôi phục.

```bash
nb backup create --env app1 --yes --output ./backups
nb backup restore --env app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

:::

`nb backup restore` trước tiên sẽ kiểm tra xem đường dẫn được trỏ đến bởi `--file` có tồn tại hay không và xác nhận rằng đó là tệp bình thường. Sau khi tải lên thành công, CLI sẽ tiếp tục đợi ứng dụng vượt qua kiểm tra tình trạng một lần nữa, vì vậy khi lệnh trả về thành công, ứng dụng thường đã được khôi phục về trạng thái có thể truy cập được.

Nếu `--force` không được chuyển vào, thiết bị đầu cuối tương tác sẽ yêu cầu bạn xác nhận lại. Trong các thiết bị đầu cuối, tập lệnh và phiên tác nhân AI không tương tác, bắt buộc phải có `--force`.

##Các tình huống thường gặp

Nếu bạn quen với việc vận hành trong giao diện hơn hoặc cần các khả năng như sao lưu theo lịch trình và đồng bộ hóa bộ nhớ đám mây, bạn có thể xem trực tiếp [Quản lý sao lưu](../../ops-management/backup-manager/index.mdx). Trong những trường hợp như vậy, giao diện người dùng Web thường phù hợp hơn.

## Các liên kết liên quan

- [`nb backup` Tham chiếu lệnh](../../api/cli/backup/index.md)
- [`nb env` Tham chiếu lệnh](../../api/cli/env/index.md)
- [Quản lý nhiều môi trường](./multi-environment.md)
- [Quản lý sao lưu](../../ops-management/backup-manager/index.mdx)
