---
pkg: '@nocobase/plugin-record-history'
title: "Lịch sử bản ghi"
description: "Plugin Record History theo dõi thay đổi của bảng dữ liệu: tự động lưu snapshot và diff cho thao tác thêm, sửa, xóa, hỗ trợ thay đổi cấp field, đồng bộ snapshot lịch sử, block lịch sử bản ghi, cấu hình mẫu mô tả."
keywords: "lịch sử bản ghi,record history,theo dõi thay đổi dữ liệu,snapshot,thay đổi cấp field,kiểm toán,block lịch sử,NocoBase"
---
# Lịch sử bản ghi

## Giới thiệu

Plugin Record History dùng để theo dõi quá trình thay đổi dữ liệu, tự động lưu snapshot và diff cho các thao tác thêm, sửa, xóa, giúp bạn nhanh chóng tra cứu lại thay đổi dữ liệu và kiểm toán hành vi thao tác.

![](https://static-docs.nocobase.com/202511011338499.png)

## Bật lịch sử bản ghi

### Thêm bảng dữ liệu và field

Trước tiên, mở trang cấu hình plugin Record History và thêm các bảng dữ liệu và field cần ghi lại lịch sử thao tác. Để nâng cao hiệu quả ghi nhận và tránh dữ liệu dư thừa, bạn nên chỉ cấu hình những bảng và field cần thiết. Các field như ID duy nhất, ngày tạo, ngày cập nhật, người tạo, người cập nhật thường không cần ghi lại.

![](https://static-docs.nocobase.com/202511011315010.png)

![](https://static-docs.nocobase.com/202511011316342.png)

### Đồng bộ snapshot dữ liệu lịch sử

- Với dữ liệu được tạo trước khi bật Record History, chỉ sau khi sinh snapshot ở lần cập nhật đầu tiên, các thay đổi tiếp theo mới được ghi nhận. Vì vậy, lần cập nhật hoặc xóa đầu tiên sẽ không để lại lịch sử.
- Nếu cần giữ lịch sử của dữ liệu sẵn có, bạn có thể thực hiện một lần đồng bộ snapshot.
- Lượng dữ liệu snapshot của một bảng = số bản ghi × số field cần ghi.
- Nếu lượng dữ liệu lớn, bạn nên lọc theo phạm vi dữ liệu, chỉ đồng bộ dữ liệu quan trọng.

![](https://static-docs.nocobase.com/202511011319386.png)

![](https://static-docs.nocobase.com/202511011319284.png)

Click nút "Đồng bộ snapshot lịch sử bản ghi", chọn các field và phạm vi dữ liệu cần đồng bộ để bắt đầu đồng bộ.

![](https://static-docs.nocobase.com/202511011320958.png)

Tác vụ đồng bộ sẽ chạy trong hàng đợi background, bạn có thể refresh danh sách để xem trạng thái hoàn thành.

## Sử dụng Block lịch sử bản ghi

### Thêm block

Chọn block lịch sử bản ghi và chọn bảng dữ liệu để thêm block lịch sử cho bảng tương ứng.

![](https://static-docs.nocobase.com/202511011323410.png)

![](https://static-docs.nocobase.com/202511011331667.png)

Nếu thêm block lịch sử bản ghi trong popup của một bản ghi cụ thể, bạn có thể chọn "Bản ghi hiện tại" để thêm block lịch sử cho bản ghi đó.

![](https://static-docs.nocobase.com/202511011338042.png)

![](https://static-docs.nocobase.com/202511011338499.png)

### Chỉnh sửa mẫu mô tả

Click "Chỉnh sửa mẫu" trên cấu hình block để cấu hình mẫu mô tả cho các bản ghi thao tác.

![](https://static-docs.nocobase.com/202511011340406.png)

Hiện tại hỗ trợ cấu hình mẫu mô tả riêng cho các bản ghi tạo, cập nhật, xóa. Với bản ghi cập nhật, bạn còn có thể cấu hình mẫu mô tả cho thay đổi field, hỗ trợ cấu hình thống nhất hoặc cấu hình riêng cho từng field.

![](https://static-docs.nocobase.com/202511011346400.png)

Bạn có thể sử dụng biến khi cấu hình nội dung mẫu.

![](https://static-docs.nocobase.com/202511011347163.png)

Sau khi cấu hình xong, bạn có thể chọn áp dụng cho "Tất cả block lịch sử bản ghi của bảng hiện tại" hoặc "Chỉ block lịch sử bản ghi hiện tại".

![](https://static-docs.nocobase.com/202511011348885.png)
