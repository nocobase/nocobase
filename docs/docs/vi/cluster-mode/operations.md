:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Quy trình bảo trì

## Khởi động ứng dụng lần đầu

Khi khởi động ứng dụng lần đầu, bạn nên khởi động một node trước. Sau khi các plugin đã được cài đặt và kích hoạt hoàn tất, hãy khởi động các node còn lại.

## Nâng cấp phiên bản

Khi cần nâng cấp phiên bản NocoBase, hãy tham khảo quy trình này.

:::warning{title=Cảnh báo}
Trong **môi trường sản xuất** của cụm (cluster), các tính năng như quản lý plugin và nâng cấp phiên bản cần được sử dụng thận trọng hoặc bị cấm.

NocoBase hiện tại chưa hỗ trợ nâng cấp trực tuyến cho các phiên bản cụm. Để đảm bảo tính nhất quán của dữ liệu, cần tạm dừng các dịch vụ bên ngoài trong quá trình nâng cấp.
:::

Các bước thực hiện:

1.  Dừng dịch vụ hiện tại

    Dừng tất cả các phiên bản ứng dụng NocoBase và chuyển hướng lưu lượng cân bằng tải đến trang trạng thái 503.

2.  Sao lưu dữ liệu

    Trước khi nâng cấp, chúng tôi đặc biệt khuyến nghị sao lưu dữ liệu cơ sở dữ liệu để phòng tránh các sự cố có thể xảy ra trong quá trình nâng cấp.

3.  Cập nhật phiên bản

    Tham khảo [Nâng cấp Docker](../get-started/upgrading/docker) để cập nhật phiên bản image ứng dụng NocoBase.

4.  Khởi động dịch vụ

    1.  Khởi động một node trong cụm và chờ quá trình cập nhật hoàn tất, sau đó node khởi động thành công.
    2.  Xác minh chức năng hoạt động chính xác. Nếu có bất kỳ sự cố nào không thể giải quyết bằng cách khắc phục sự cố, bạn có thể khôi phục về phiên bản trước.
    3.  Khởi động các node còn lại.
    4.  Chuyển hướng lưu lượng cân bằng tải đến cụm ứng dụng.

## Bảo trì trong ứng dụng

Bảo trì trong ứng dụng đề cập đến việc thực hiện các thao tác liên quan đến bảo trì khi ứng dụng đang chạy, bao gồm:

*   Quản lý plugin (cài đặt, kích hoạt, vô hiệu hóa plugin, v.v.)
*   Sao lưu & Khôi phục
*   Quản lý di chuyển môi trường

Các bước thực hiện:

1.  Giảm số lượng node

    Giảm số lượng node đang chạy ứng dụng trong cụm xuống còn 1, và dừng dịch vụ trên các node còn lại.

2.  Thực hiện các thao tác bảo trì trong ứng dụng, ví dụ như cài đặt và kích hoạt plugin, sao lưu dữ liệu, v.v.

3.  Khôi phục node

    Sau khi các thao tác bảo trì hoàn tất và chức năng đã được xác minh chính xác, hãy khởi động các node còn lại. Khi các node đã khởi động thành công, khôi phục trạng thái hoạt động của cụm.