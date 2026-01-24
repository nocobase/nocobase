---
pkg: '@nocobase/plugin-auth-wecom'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Xác thực: WeCom

## Giới thiệu

**Plugin WeCom** hỗ trợ người dùng đăng nhập vào NocoBase bằng tài khoản WeCom của họ.

## Kích hoạt plugin

![](https://static-docs.nocobase.com/202406272056962.png)

## Tạo và cấu hình ứng dụng tự xây dựng trên WeCom

Truy cập bảng điều khiển quản trị WeCom để tạo một ứng dụng tự xây dựng.

![](https://static-docs.nocobase.com/202406272101321.png)

![](https://static-docs.nocobase.com/202406272102087.png)

Nhấp vào ứng dụng để vào trang chi tiết, cuộn xuống và nhấp vào "Đăng nhập được ủy quyền bằng WeCom".

![](https://static-docs.nocobase.com/202406272104655.png)

Đặt tên miền callback được ủy quyền thành tên miền ứng dụng NocoBase của bạn.

![](https://static-docs.nocobase.com/202406272105662.png)

Quay lại trang chi tiết ứng dụng và nhấp vào "Ủy quyền Web và JS-SDK".

![](https://static-docs.nocobase.com/202406272107063.png)

Thiết lập và xác minh tên miền callback cho tính năng ủy quyền web OAuth2.0 của ứng dụng.

![](https://static-docs.nocobase.com/202406272107899.png)

Trên trang chi tiết ứng dụng, nhấp vào "IP đáng tin cậy của doanh nghiệp".

![](https://static-docs.nocobase.com/202406272108834.png)

Cấu hình IP ứng dụng NocoBase.

![](https://static-docs.nocobase.com/202406272109805.png)

## Lấy thông tin xác thực từ bảng điều khiển quản trị WeCom

Trong bảng điều khiển quản trị WeCom, dưới mục "Doanh nghiệp của tôi", sao chép "ID Công ty".

![](https://static-docs.nocobase.com/202406272111637.png)

Trong bảng điều khiển quản trị WeCom, dưới mục "Quản lý ứng dụng", truy cập trang chi tiết của ứng dụng đã tạo ở bước trước và sao chép AgentId và Secret.

![](https://static-docs.nocobase.com/202406272122322.png)

## Thêm xác thực WeCom trong NocoBase

Truy cập trang quản lý plugin xác thực người dùng.

![](https://static-docs.nocobase.com/202406272115044.png)

Thêm - WeCom

![](https://static-docs.nocobase.com/202406272115805.png)

### Cấu hình

![](https://static-docs.nocobase.com/202412041459250.png)

| Tùy chọn                                                                                                | Mô tả                                                                                                 | Yêu cầu phiên bản |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------- |
| Khi số điện thoại không khớp với người dùng hiện có, <br />có nên tự động tạo người dùng mới không? | Khi số điện thoại không khớp với người dùng hiện có, có tự động tạo người dùng mới hay không. | -        |
| ID Công ty                                                                                            | ID Công ty, lấy từ bảng điều khiển quản trị WeCom.                                                                    | -        |
| AgentId                                                                                               | Lấy từ cấu hình ứng dụng tự xây dựng trong bảng điều khiển quản trị WeCom.                                                                 | -        |
| Secret                                                                                                | Lấy từ cấu hình ứng dụng tự xây dựng trong bảng điều khiển quản trị WeCom.                                                                 | -        |
| Origin                                                                                                | Tên miền ứng dụng hiện tại.                                                                                       | -        |
| Liên kết chuyển hướng ứng dụng Workbench                                                                   | Đường dẫn ứng dụng sẽ chuyển hướng đến sau khi đăng nhập thành công.                                                                           | `v1.4.0` |
| Tự động đăng nhập                                                                                       | Tự động đăng nhập khi liên kết ứng dụng được mở trong trình duyệt WeCom. Khi có nhiều trình xác thực WeCom được cấu hình, chỉ một trong số đó có thể bật tùy chọn này. | `v1.4.0` |
| Liên kết trang chủ ứng dụng Workbench                                                                 | Liên kết trang chủ ứng dụng Workbench.                                                                                 | -        |

## Cấu hình trang chủ ứng dụng WeCom

:::info
Đối với các phiên bản `v1.4.0` trở lên, khi tùy chọn "Tự động đăng nhập" được bật, liên kết trang chủ ứng dụng có thể được rút gọn thành: `https://<url>/<path>`, ví dụ `https://example.nocobase.com/admin`.

Bạn cũng có thể cấu hình các liên kết riêng biệt cho thiết bị di động và máy tính để bàn, ví dụ `https://example.nocobase.com/m` và `https://example.nocobase.com/admin`.
:::

Truy cập bảng điều khiển quản trị WeCom và dán liên kết trang chủ ứng dụng Workbench đã sao chép vào trường địa chỉ trang chủ ứng dụng tương ứng.

![](https://static-docs.nocobase.com/202406272123631.png)

![](https://static-docs.nocobase.com/202406272123048.png)

## Đăng nhập

Truy cập trang đăng nhập và nhấp vào nút bên dưới biểu mẫu đăng nhập để bắt đầu đăng nhập bên thứ ba.

![](https://static-docs.nocobase.com/202406272124608.png)

:::warning
Do các hạn chế về quyền của WeCom đối với thông tin nhạy cảm như số điện thoại, việc ủy quyền chỉ có thể được hoàn tất trong ứng dụng WeCom. Khi đăng nhập bằng WeCom lần đầu, vui lòng làm theo các bước dưới đây để hoàn tất ủy quyền đăng nhập lần đầu trong ứng dụng WeCom.
:::

## Đăng nhập lần đầu

Từ ứng dụng WeCom, truy cập Workbench, cuộn xuống cuối trang và nhấp vào ứng dụng để vào trang chủ bạn đã cấu hình trước đó. Thao tác này sẽ hoàn tất ủy quyền ban đầu. Sau đó, bạn có thể sử dụng WeCom để đăng nhập vào ứng dụng NocoBase của mình.

<img src="https://static-docs.nocobase.com/202406272131113.png" width="400" />