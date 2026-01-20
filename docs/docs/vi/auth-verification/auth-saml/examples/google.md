:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Google Workspace

## Thiết lập Google làm IdP

[Bảng điều khiển quản trị Google](https://admin.google.com/) - Ứng dụng - Ứng dụng web và di động

![](https://static-docs.nocobase.com/0812780b990a97a63c14ea8991959827.png)

Sau khi thiết lập ứng dụng, hãy sao chép **URL SSO**, **ID Thực thể** và **Chứng chỉ**.

![](https://static-docs.nocobase.com/aafd20a794730e85411c0c8f368637e0.png)

## Thêm trình xác thực mới trên NocoBase

Cài đặt plugin - Xác thực người dùng - Thêm - SAML

![](https://static-docs.nocobase.com/5bc18c7952b8f15828e26bb07251a335.png)

Hãy điền lần lượt các thông tin đã sao chép:

- SSO URL: URL SSO
- Chứng chỉ công khai: Chứng chỉ
- Nhà phát hành IdP: ID Thực thể
- http: Chọn nếu bạn đang kiểm thử cục bộ với http

Sau đó, sao chép SP Issuer/EntityID và ACS URL từ mục Sử dụng.

## Điền thông tin SP trên Google

Quay lại Bảng điều khiển Google, trên trang **Chi tiết nhà cung cấp dịch vụ**, nhập URL ACS và ID Thực thể đã sao chép trước đó, sau đó chọn **Phản hồi đã ký**.

![](https://static-docs.nocobase.com/1536268bf8df4a5ebc72384317172191.png)

![](https://static-docs.nocobase.com/c7de1f8b84c1335de110e5a7c96255c4.png)

Tại vị trí **Ánh xạ thuộc tính**, hãy thêm ánh xạ để có thể ánh xạ các thuộc tính tương ứng.

![](https://static-docs.nocobase.com/27180f2f46480c3fee3016df86d6fdb8.png)