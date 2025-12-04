---
pkg: '@nocobase/plugin-user-data-sync'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Đồng bộ hóa dữ liệu người dùng

## Giới thiệu

Tính năng này cho phép bạn đăng ký và quản lý các nguồn đồng bộ hóa dữ liệu người dùng. Mặc định, một HTTP API được cung cấp, nhưng bạn có thể mở rộng để hỗ trợ các nguồn dữ liệu khác thông qua plugin. Tính năng này hỗ trợ đồng bộ hóa dữ liệu vào các **bộ sưu tập** **Người dùng** và **Phòng ban** theo mặc định, với khả năng mở rộng đồng bộ hóa tới các tài nguyên đích khác bằng cách sử dụng plugin.

## Quản lý và Đồng bộ hóa nguồn dữ liệu

![](https://static-docs.nocobase.com/202412041043465.png)

:::info
Nếu chưa cài đặt plugin nào cung cấp nguồn đồng bộ hóa dữ liệu người dùng, bạn có thể đồng bộ hóa dữ liệu người dùng bằng HTTP API. Tham khảo [Nguồn dữ liệu - HTTP API](./sources/api.md).
:::

## Thêm nguồn dữ liệu

Sau khi bạn cài đặt một plugin cung cấp nguồn đồng bộ hóa dữ liệu người dùng, bạn có thể thêm nguồn dữ liệu tương ứng. Chỉ các nguồn dữ liệu đã được bật mới hiển thị các nút "Đồng bộ hóa" và "Tác vụ".

> Ví dụ: WeCom

![](https://static-docs.nocobase.com/202412041053785.png)

## Đồng bộ hóa dữ liệu

Nhấp vào nút **Đồng bộ hóa** để bắt đầu đồng bộ hóa dữ liệu.

![](https://static-docs.nocobase.com/202412041055022.png)

Nhấp vào nút **Tác vụ** để xem trạng thái đồng bộ hóa. Sau khi đồng bộ hóa thành công, bạn có thể xem dữ liệu trong danh sách Người dùng và Phòng ban.

![](https://static-docs.nocobase.com/202412041202337.png)

Đối với các tác vụ đồng bộ hóa thất bại, bạn có thể nhấp vào **Thử lại**.

![](https://static-docs.nocobase.com/202412041058337.png)

Trong trường hợp đồng bộ hóa thất bại, bạn có thể khắc phục sự cố thông qua nhật ký hệ thống. Ngoài ra, các bản ghi đồng bộ hóa thô được lưu trữ trong thư mục `user-data-sync` nằm trong thư mục nhật ký ứng dụng.

![](https://static-docs.nocobase.com/202412041205655.png)