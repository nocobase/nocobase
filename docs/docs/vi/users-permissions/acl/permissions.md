---
pkg: '@nocobase/plugin-acl'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Cấu hình Quyền hạn

## Cài đặt Quyền hạn Chung

![](https://static-docs.nocobase.com/119a9650259f9be71210121d0d3a435d.png)

### Quyền hạn Cấu hình

1.  **Cho phép cấu hình giao diện**: Quyền hạn này kiểm soát việc người dùng có được phép cấu hình giao diện hay không. Khi kích hoạt, nút cấu hình giao diện người dùng sẽ xuất hiện. Vai trò "admin" mặc định được bật quyền này.
2.  **Cho phép cài đặt, kích hoạt, vô hiệu hóa plugin**: Quyền hạn này kiểm soát việc người dùng có được phép kích hoạt hoặc vô hiệu hóa các **plugin** hay không. Khi kích hoạt, người dùng có thể truy cập giao diện quản lý **plugin**. Vai trò "admin" mặc định được bật quyền này.
3.  **Cho phép cấu hình plugin**: Quyền hạn này cho phép người dùng cấu hình các tham số của **plugin** hoặc quản lý dữ liệu backend của **plugin**. Vai trò "admin" mặc định được bật quyền này.
4.  **Cho phép xóa bộ nhớ đệm, khởi động lại ứng dụng**: Quyền hạn này liên quan đến các tác vụ bảo trì hệ thống như xóa bộ nhớ đệm và khởi động lại ứng dụng. Khi kích hoạt, các nút thao tác liên quan sẽ xuất hiện trong trung tâm cá nhân. Quyền hạn này mặc định bị vô hiệu hóa.
5.  **Các mục menu mới mặc định được phép truy cập**: Các menu mới tạo mặc định được phép truy cập và cài đặt này mặc định được bật.

### Quyền hạn Thao tác Toàn cục

Quyền hạn thao tác toàn cục áp dụng cho tất cả các **bộ sưu tập** và được phân loại theo loại thao tác. Các quyền này có thể được cấu hình dựa trên phạm vi dữ liệu: tất cả dữ liệu hoặc dữ liệu của chính người dùng. Quyền hạn cho "tất cả dữ liệu" cho phép thực hiện thao tác trên toàn bộ **bộ sưu tập**, trong khi quyền hạn cho "dữ liệu của chính người dùng" giới hạn chỉ có thể xử lý dữ liệu liên quan đến người dùng đó.

## Quyền hạn Thao tác Bộ sưu tập

![](https://static-docs.nocobase.com/6a6e028139cecdea5b5218e6173c5d7.png)

![](https://static-docs.nocobase.com/9814140434ff9e1bf028a6c282a5a165.png)

Quyền hạn thao tác **bộ sưu tập** tinh chỉnh thêm các quyền hạn thao tác toàn cục, cho phép cấu hình quyền truy cập riêng lẻ cho tài nguyên trong từng **bộ sưu tập**. Các quyền hạn này được chia thành hai khía cạnh:

1.  **Quyền hạn thao tác**: Bao gồm các thao tác thêm, xem, sửa, xóa, xuất và nhập. Các quyền hạn này được cấu hình dựa trên phạm vi dữ liệu:
    -   **Tất cả bản ghi**: Cấp cho người dùng khả năng thực hiện thao tác trên tất cả các bản ghi trong **bộ sưu tập**.
    -   **Bản ghi của chính mình**: Hạn chế người dùng chỉ được thực hiện thao tác trên các bản ghi mà họ đã tạo.

2.  **Quyền hạn trường**: Quyền hạn trường cho phép bạn đặt các quyền cụ thể cho từng trường trong các thao tác khác nhau. Ví dụ, một số trường có thể được cấu hình chỉ cho phép xem mà không cho phép chỉnh sửa.

## Quyền hạn Truy cập Menu

Quyền hạn truy cập menu kiểm soát quyền truy cập dựa trên các mục menu.

![](https://static-docs.nocobase.com/28eddfc843d27641162d9129e3b6e33f.png)

## Quyền hạn Cấu hình Plugin

Quyền hạn cấu hình **plugin** kiểm soát khả năng cấu hình các tham số **plugin** cụ thể. Khi được bật, giao diện quản lý **plugin** tương ứng sẽ xuất hiện trong trung tâm quản trị.

![](https://static-docs.nocobase.com/5a742ae20a9de93dc2722468b9fd7475.png)