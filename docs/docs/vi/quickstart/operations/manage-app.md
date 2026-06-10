#Quản lý ứng dụng

Nếu bạn đã lưu ứng dụng NocoBase dưới dạng CLI env, việc quản lý hàng ngày về cơ bản được hoàn thành trong nhóm lệnh `nb app`: bắt đầu, dừng, khởi động lại, xem nhật ký và nâng cấp.

Hầu hết, bạn không cần phải nhớ tất cả các thông số. Trước tiên, hãy làm rõ xem điều bạn muốn làm là "chạy ứng dụng", "đọc nhật ký để khắc phục sự cố" hay "nâng cấp lên phiên bản mới", sau đó chọn lệnh tương ứng.

Nếu trước tiên bạn muốn hiểu lý do tại sao `nb app` được hợp nhất thành tập hợp lệnh này và mối quan hệ của nó với `nb app autostart`, trước tiên hãy đọc [nb ý định thiết kế ứng dụng](../cli-design/nb-app-design-intent.md). Trang này chỉ giữ lại các hoạt động phổ biến nhất hàng ngày.

## Lập chỉ mục nhanh

| Tôi muốn... | Sử dụng lệnh nào |
| --- | --- |
| Bắt đầu hoặc tiếp tục hoạt động ứng dụng | [`nb app start`](../../api/cli/app/start.md) |
| Tạm dừng ứng dụng | [`nb app stop`](../../api/cli/app/stop.md) |
| Dừng lại cùng với cơ sở dữ liệu tích hợp do CLI quản lý | [`nb app stop --with-db`](../../api/cli/app/stop.md) |
| Khởi động lại ứng dụng sau khi sửa đổi cấu hình | [`nb app restart`](../../api/cli/app/restart.md) |
| Xem nhật ký ứng dụng trong thời gian thực | [`nb app logs`](../../api/cli/app/logs.md) |
| Nâng cấp lên phiên bản nguồn hoặc hình ảnh mới | [`nb app upgrade`](../../api/cli/app/upgrade.md) |

:::tip trước tiên hãy xác nhận env hiện tại

Lệnh `nb app` hoạt động trên env hiện tại theo mặc định. Nếu bạn duy trì nhiều môi trường cùng một lúc, theo mặc định, bạn nên xác nhận env đích trước khi bắt đầu, dừng, ghi nhật ký hoặc nâng cấp các hoạt động.

Nếu bạn chuyển một `--env` khác một cách rõ ràng, CLI thường sẽ yêu cầu xác nhận. Trong tập lệnh hoặc tình huống không tương tác, bạn có thể thêm `--yes` để bỏ qua bước này. Chuyển đổi, xem và loại bỏ đa môi trường được giới thiệu trong [Quản lý đa môi trường](./multi-environment.md).

:::

## Bắt đầu ứng dụng

Kéo ứng dụng lên và sử dụng `nb app start` theo mặc định:

```bash
nb app start
```

Nếu bạn muốn thao tác trên một cái gì đó khác với env hiện tại, bạn có thể chỉ định nó một cách rõ ràng:

```bash
nb app start --env app1 --yes
```

Một số tham số khởi động thường được sử dụng khác:

- `nb app start` Theo mặc định, việc chuẩn bị cài đặt hoặc nâng cấp cần thiết sẽ tự động được hoàn thành trước tiên, sau đó dịch vụ sẽ được bắt đầu.

Local npm/Git env sẽ bắt đầu quá trình ứng dụng cục bộ và Docker env sẽ xây dựng lại vùng chứa ứng dụng theo cấu hình đã lưu. Để biết thông số chi tiết, hãy xem [`nb app start`](../../api/cli/app/start.md).

## Dừng và khởi động lại

Nếu bạn chỉ muốn dừng ứng dụng tạm thời, hãy sử dụng `nb app stop`:

```bash
nb app stop
```

Nếu bạn vừa thay đổi cấu hình, phần phụ thuộc hoặc mã, việc sử dụng trực tiếp `nb app restart` thường dễ dàng hơn:

```bash
nb app restart
nb app restart --env app1 --yes
```

`nb app restart` sẽ bị dừng trước rồi khởi động lại theo cách tương tự như `start`. Để biết cách sử dụng chi tiết, hãy xem [`nb app stop`](../../api/cli/app/stop.md) và [`nb app restart`](../../api/cli/app/restart.md).

## Xem nhật ký

Khi khắc phục sự cố, bạn thường xem nhật ký trước:

```bash
nb app logs
```

Nếu bạn chỉ muốn xem kết quả gần đây hơn hoặc không muốn tiếp tục theo dõi nhật ký, bạn có thể sử dụng:

```bash
nb app logs --tail 200
nb app logs --no-follow
nb app logs --env app1 --yes
```

Npm/Git env cục bộ đọc nhật ký pm2 và Docker env đọc nhật ký vùng chứa. Theo mặc định, `nb app logs` sẽ tiếp tục theo dõi đầu ra nhật ký mới. Để biết thông số chi tiết, hãy xem [`nb app logs`](../../api/cli/app/logs.md).

## Nâng cấp ứng dụng

Lệnh nâng cấp là `nb app upgrade`:

```bash
nb app upgrade
```

Lệnh này không chỉ "tải xuống phiên bản mới". Quá trình mặc định thường bao gồm:

1. Dừng ứng dụng hiện tại
2. Tải xuống và thay thế mã nguồn hoặc hình ảnh đã lưu
3. Đồng bộ hóa các plug-in thương mại
4. Nâng cấp và khởi động ứng dụng
5. Làm mới thông tin thời gian chạy env

Nếu bạn đã cập nhật trước mã nguồn hoặc hình ảnh và chỉ muốn tiếp tục nâng cấp cũng như khởi động ứng dụng dựa trên nội dung hiện tại, bạn có thể thêm `--skip-download`:

```bash
nb app upgrade --skip-download
```

Nếu bạn muốn chỉ định rõ ràng phiên bản đích, bạn cũng có thể thêm `--version`:

```bash
nb app upgrade --version beta
```

:::lưu ý cảnh báo

`nb app upgrade` Bạn cũng thường được yêu cầu xác nhận một lần trước khi thực sự bắt đầu. Trong tập lệnh, CI hoặc các tình huống không tương tác khác, `--force` cần được chuyển vào một cách rõ ràng. Nếu bạn cũng hoạt động trên các env cùng lúc, bạn thường cần mang `--yes` lại với nhau.

```bash
nb app upgrade --env app1 --yes --force
```

:::

Để biết mô tả tham số đầy đủ hơn, hãy xem [`nb app upgrade`](../../api/cli/app/upgrade.md).

## Các liên kết liên quan

- [ý định thiết kế ứng dụng nb](../cli-design/nb-app-design-intent.md)
- [Quản lý nhiều môi trường](./multi-environment.md)
- [`nb app` Tham chiếu lệnh](../../api/cli/app/index.md)
