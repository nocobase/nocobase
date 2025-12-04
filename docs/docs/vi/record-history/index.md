---
pkg: '@nocobase/plugin-record-history'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Lịch sử bản ghi

## Giới thiệu

Plugin **Lịch sử bản ghi** theo dõi các thay đổi của dữ liệu bằng cách tự động lưu trữ các bản chụp nhanh (snapshot) và ghi lại sự khác biệt của các thao tác **tạo mới**, **cập nhật**, và **xóa**. Plugin này giúp người dùng nhanh chóng xem lại các chỉnh sửa dữ liệu và kiểm tra các hoạt động.

![](https://static-docs.nocobase.com/202511011338499.png)

## Kích hoạt Lịch sử bản ghi

### Thêm bộ sưu tập và trường

Đầu tiên, truy cập trang cài đặt của plugin Lịch sử bản ghi để thêm các bộ sưu tập và trường mà bạn muốn theo dõi lịch sử hoạt động. Để nâng cao hiệu quả ghi lại và tránh dư thừa dữ liệu, chúng tôi khuyến nghị chỉ cấu hình các bộ sưu tập và trường cần thiết. Các trường như **ID duy nhất**, **ngày tạo**, **ngày cập nhật**, **người tạo**, và **người cập nhật** thường không cần ghi lại.

![](https://static-docs.nocobase.com/202511011315010.png)

![](https://static-docs.nocobase.com/202511011316342.png)

### Đồng bộ bản chụp nhanh dữ liệu lịch sử

- Đối với các bản ghi được tạo trước khi kích hoạt tính năng lịch sử bản ghi, các thay đổi chỉ có thể được ghi lại sau khi bản cập nhật đầu tiên tạo ra một bản chụp nhanh; do đó, lần cập nhật hoặc xóa đầu tiên sẽ không được ghi lại trong lịch sử.
- Nếu bạn muốn lưu giữ lịch sử của dữ liệu hiện có, bạn có thể thực hiện đồng bộ bản chụp nhanh một lần.
- Kích thước bản chụp nhanh cho mỗi bộ sưu tập được tính bằng: số lượng bản ghi × số lượng trường được theo dõi.
- Đối với các bộ dữ liệu lớn, chúng tôi khuyến nghị lọc theo phạm vi dữ liệu và chỉ đồng bộ các bản ghi quan trọng.

![](https://static-docs.nocobase.com/202511011319386.png)

![](https://static-docs.nocobase.com/202511011319284.png)

Nhấp vào nút **“Đồng bộ bản chụp nhanh lịch sử”**, cấu hình các trường và phạm vi dữ liệu cần đồng bộ, sau đó bắt đầu quá trình đồng bộ hóa.

![](https://static-docs.nocobase.com/202511011320958.png)

Tác vụ đồng bộ hóa sẽ được xếp hàng và chạy ở chế độ nền. Bạn có thể làm mới danh sách để kiểm tra trạng thái hoàn thành của tác vụ.

## Sử dụng khối Lịch sử bản ghi

### Thêm khối

Chọn **Khối Lịch sử bản ghi** và chọn một bộ sưu tập để thêm khối lịch sử tương ứng vào trang của bạn.

![](https://static-docs.nocobase.com/202511011323410.png)

![](https://static-docs.nocobase.com/202511011331667.png)

Nếu bạn đang thêm một khối lịch sử bên trong cửa sổ bật lên chi tiết của một bản ghi, bạn có thể chọn **“Bản ghi hiện tại”** để hiển thị lịch sử cụ thể cho bản ghi đó.

![](https://static-docs.nocobase.com/202511011338042.png)

![](https://static-docs.nocobase.com/202511011338499.png)

### Chỉnh sửa mẫu mô tả

Nhấp vào **“Chỉnh sửa mẫu”** trong cài đặt khối để cấu hình văn bản mô tả cho các bản ghi hoạt động.

![](https://static-docs.nocobase.com/202511011340406.png)

Hiện tại, bạn có thể cấu hình các mẫu mô tả riêng biệt cho các thao tác **tạo mới**, **cập nhật**, và **xóa** bản ghi. Đối với các bản ghi cập nhật, bạn cũng có thể cấu hình mẫu mô tả cho các thay đổi trường, dù là cấu hình chung cho tất cả các trường hay cấu hình riêng cho từng trường cụ thể.

![](https://static-docs.nocobase.com/202511011346400.png)

Bạn có thể sử dụng các biến khi cấu hình văn bản.

![](https://static-docs.nocobase.com/202511011347163.png)

Sau khi cấu hình xong, bạn có thể chọn áp dụng mẫu cho **Tất cả các khối lịch sử bản ghi của bộ sưu tập hiện tại** hoặc **Chỉ khối lịch sử bản ghi này**.

![](https://static-docs.nocobase.com/202511011348885.png)