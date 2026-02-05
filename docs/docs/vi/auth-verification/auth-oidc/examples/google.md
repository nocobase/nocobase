:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Đăng nhập bằng Google

> https://developers.google.com/identity/openid-connect/openid-connect

## Lấy thông tin xác thực Google OAuth 2.0

Truy cập [Google Cloud Console](https://console.cloud.google.com/apis/credentials) - Tạo thông tin xác thực - ID máy khách OAuth.

![](https://static-docs.nocobase.com/0f2946c8643565ecc4ac13249882638c.png)

Truy cập giao diện cấu hình và điền URL chuyển hướng được ủy quyền. Bạn có thể lấy URL chuyển hướng này khi thêm một trình xác thực mới trong NocoBase, thông thường sẽ là `http(s)://host:port/api/oidc:redirect`. Vui lòng xem phần [Sổ tay người dùng - Cấu hình](../index.md#cấu-hình).

![](https://static-docs.nocobase.com/24078bf52ec966a16334894cb3d9d126.png)

## Thêm trình xác thực mới trên NocoBase

Cài đặt plugin - Xác thực người dùng - Thêm - OIDC

![](https://static-docs.nocobase.com/0e4b1acdef6335aaee2139ae6629977b.png)

Vui lòng tham khảo các tham số được giới thiệu trong phần [Sổ tay người dùng - Cấu hình](../index.md#cấu-hình) để hoàn tất cấu hình trình xác thực.