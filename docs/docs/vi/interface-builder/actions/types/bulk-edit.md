---
pkg: "@nocobase/plugin-action-bulk-edit"
title: "Action chỉnh sửa hàng loạt"
description: "Action chỉnh sửa hàng loạt: cập nhật hàng loạt Field chỉ định của các bản ghi được chọn, hỗ trợ chọn nhiều rồi sửa đổi thống nhất."
keywords: "chỉnh sửa hàng loạt,BulkEdit,cập nhật hàng loạt,chọn nhiều,Interface Builder,NocoBase"
---
# Chỉnh sửa hàng loạt

## Giới thiệu

Chỉnh sửa hàng loạt phù hợp với các trường hợp cần cập nhật dữ liệu hàng loạt linh hoạt. Sau khi nhấp nút chỉnh sửa hàng loạt, cấu hình Form chỉnh sửa hàng loạt trong Popup, và đặt các chiến lược cập nhật khác nhau cho Field.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_13_AM.png)


## Cấu hình Action

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_13_AM%20(1).png)


## Hướng dẫn sử dụng

### Cấu hình Form chỉnh sửa hàng loạt

1. Thêm nút chỉnh sửa hàng loạt.

2. Cài đặt phạm vi chỉnh sửa hàng loạt: Đã chọn/Tất cả, mặc định là Đã chọn.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_14_AM.png)

3. Thêm Form chỉnh sửa hàng loạt.

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_07_14_AM.png)

4. Cấu hình các Field cần chỉnh sửa và thêm nút gửi.

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_07_15_AM%20(1).png)

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_07_15_AM.png)

### Gửi Form

1. Đánh dấu các hàng dữ liệu cần chỉnh sửa.

2. Chọn chế độ chỉnh sửa cho Field và điền giá trị cần gửi.

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_10_33_AM.png)

:::info{title=Chế độ chỉnh sửa có thể chọn}
* Không cập nhật: Field này giữ nguyên
* Sửa đổi thành: Cập nhật Field này thành giá trị được gửi
* Xóa trống: Xóa trống dữ liệu của Field này

:::

3. Gửi Form.
