# Bắt đầu nhanh

Nếu đây là lần đầu tiên bạn sử dụng CLI này, bạn không cần phải ghi nhớ tất cả các lệnh lúc đầu. Trước tiên, hãy sử dụng `nb init --ui` để cài đặt một ứng dụng, sau đó tiếp tục xem phần còn lại theo kịch bản.

## Đầu tiên hãy thiết lập tâm trí quan trọng nhất

Trong NocoBase CLI, các thao tác tiếp theo không xoay quanh "một thư mục nhất định" hoặc "một cổng nhất định" theo mặc định mà xoay quanh **env**.

Bạn có thể coi env là "một tập hợp kết nối ứng dụng và thông tin đang chạy được CLI ghi nhớ". Miễn là nó đã được lưu thành công, nhiều lệnh tiếp theo có thể được sử dụng trực tiếp:

- Sử dụng `nb init` để cài đặt ứng dụng mới và lưu dưới dạng env
- Sử dụng `nb env add` để kết nối ứng dụng hiện có với CLI
- Quản lý env này với `nb app start`, `nb app logs`, `nb app upgrade`
- Sao lưu và khôi phục env này bằng `nb backup`
- Sử dụng `nb app autostart`, `nb proxy` để tiếp tục bổ sung khả năng của môi trường sản xuất

Hãy ghi nhớ điều này trước tiên và các tài liệu tiếp theo sẽ mượt mà hơn nhiều.

## Đường dẫn mặc định được đề xuất

Nếu bạn không chắc chắn nên bắt đầu từ đâu thì cách dễ nhất là đi theo con đường này:

1. Trước tiên hãy đọc [Cài đặt bằng CLI (được khuyến nghị)](./installation/cli.md) và hoàn tất `nb init` một lần.
2. Sau khi ứng dụng được lưu dưới dạng env, hãy xem [Quản lý nhiều môi trường](./Operations/multi-environment.md) để xác nhận env hiện tại, chuyển đổi env và kiểm tra trạng thái.
3. Để khởi động hàng ngày, dừng, đăng nhập và nâng cấp, tiếp tục xem [Quản lý ứng dụng](./Operations/manage-app.md).
4. Trước khi thực hiện nâng cấp, di chuyển hoặc thay đổi quan trọng, hãy xem [Sao lưu và khôi phục](./Operations/backup-restore.md).
5. Nếu bạn đã sẵn sàng trực tuyến chính thức, hãy nhập [Tổng quan về triển khai môi trường sản xuất] (./production/index.md).

Ba bước đầu tiên bao gồm hầu hết các tình huống sử dụng.

## Lập chỉ mục nhanh

| Tôi muốn... | Tìm ở đâu |
| --- | --- |
| Chưa có ứng dụng nào, trước tiên hãy cài đặt NocoBase mới và lưu nó dưới dạng CLI env | [Cài đặt bằng CLI (được khuyến nghị)](./installation/cli.md) |
| Đã có NocoBase đang chạy và muốn truy cập quản lý CLI | [Cài đặt bằng CLI (được khuyến nghị)](./installation/cli.md) |
| Di chuyển dần dần các phương pháp cài đặt cũ sang CLI | [Di chuyển từ các phương thức cài đặt cũ sang CLI](./installation/migration.md) |
| Xem env nào được lưu cục bộ, chuyển env hiện tại và kiểm tra trạng thái | [Quản lý nhiều môi trường](./Operations/multi-environment.md) |
| Bắt đầu, dừng, khởi động lại ứng dụng, xem nhật ký hoặc tiếp tục nâng cấp | [Quản lý ứng dụng](./Operations/manage-app.md) |
| Tạo bản sao lưu trước khi nâng cấp, di chuyển hoặc thay đổi dữ liệu hàng loạt, sau đó khôi phục dữ liệu khi cần thiết | [Sao lưu và khôi phục](./Operations/backup-restore.md) |
| Trước tiên hãy xác nhận các biến môi trường chính cần thiết để chạy ứng dụng | [Biến môi trường ứng dụng](./installation/env.md) |
| Cài đặt plug-in của bên thứ ba | [Cài đặt và nâng cấp plug-in của bên thứ ba](./plugins/third-party.md) |
| Cho ứng dụng vào môi trường sản xuất: khởi động tự động, truy cập bên ngoài ổn định, proxy ngược | [Tổng quan về triển khai môi trường sản xuất](./production/index.md) |

## Khi nào cần xem tham chiếu lệnh

Bộ tài liệu bắt đầu nhanh này mang tính chất "tôi muốn làm gì bây giờ". Nếu bạn đã biết lệnh nào mình muốn thực thi và chỉ muốn tiếp tục xem các tham số đầy đủ, chỉ cần truy cập [Tham khảo lệnh NocoBase CLI](../api/cli/index.md).

Các đề xuất mặc định là:

- Trước tiên hãy sử dụng tài liệu Bắt đầu nhanh để thiết lập ý thức về đường dẫn
- Sau đó kiểm tra chi tiết thông số trên trang lệnh cụ thể

Điều này giúp bạn bắt đầu dễ dàng hơn so với việc đọc cây lệnh hoàn chỉnh ngay từ cái nhìn đầu tiên.
