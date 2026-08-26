---
pkg: "@nocobase/plugin-email-manager"
title: "Hướng dẫn sử dụng Email Center"
description: "Email Center: Link account liên kết tài khoản, ủy quyền OAuth, đồng bộ dữ liệu, lọc Email, gửi/nhận, xóa tài khoản."
keywords: "Email Center,liên kết tài khoản,Link account,ủy quyền OAuth,đồng bộ dữ liệu,NocoBase"
---

# Email Center

<PluginInfo commercial="true" name="email-manager"></PluginInfo>

## Giới thiệu
Sau khi plugin Email được kích hoạt, hệ thống mặc định cung cấp Email Center để tích hợp tài khoản, quản lý Email và cấu hình tính năng.

Click vào icon Email message ở phía trên bên phải để vào trang quản lý Email.

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_02_PM.png)

## Liên kết tài khoản

### Liên kết tài khoản

Click nút **Cài đặt**, sau khi popup mở ra, click nút **Link account**, chọn loại Email cần liên kết.

![](https://static-docs.nocobase.com/email-manager/Email-01-01-2026_09_00_AM.png)

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_03_PM.png)

Trình duyệt sẽ tự động mở trang đăng nhập của Email tương ứng, đăng nhập tài khoản và đồng ý ủy quyền (quy trình ủy quyền của các nhà cung cấp khác nhau có sự khác biệt).

![](https://static-docs.nocobase.com/mail-1733816162534.png)

![](https://static-docs.nocobase.com/email-manager/Microsoft-%E5%B8%90%E6%88%B7-12-31-2025_09_49_PM.png)

Sau khi ủy quyền hoàn tất sẽ chuyển hướng lại NocoBase, chọn thời điểm bắt đầu đồng bộ để liên kết tài khoản và đồng bộ dữ liệu (lần đồng bộ đầu tiên có thể mất khá lâu, vui lòng chờ).

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_51_PM.png)

Sau khi đồng bộ dữ liệu hoàn tất, trang hiện tại sẽ tự động đóng và quay lại trang Email message ban đầu, lúc này có thể thấy tài khoản đã được liên kết.

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_51_PM%20(1).png)

### Xóa tài khoản
Click **Xóa** để xóa tài khoản và các Email liên quan.

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_08_PM.png)

## Quản lý Email

### Lọc Email

Trang quản lý Email phía bên trái là khu vực lọc, phía bên phải là khu vực danh sách Email.

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_11_PM.png)

Các Email cùng chủ đề sẽ được gộp lại, sau field chủ đề sẽ đánh dấu tổng cộng có bao nhiêu Email qua lại.

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_13_PM.png)

Tiêu đề Email chưa đọc sẽ được hiển thị in đậm, bên cạnh icon Email phía trên sẽ đánh dấu số Email chưa đọc.


### Đồng bộ Email thủ công

Khoảng thời gian đồng bộ Email hiện tại là 5 phút. Nếu cần buộc đồng bộ Email, click nút **Đồng bộ Email**.

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_43_PM.png)

### Gửi Email

Click nút **Gửi Email** ở phía trên để mở panel gửi.

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_13_PM%20(2).png)

Điền thông tin liên quan rồi gửi Email. Tệp đính kèm chỉ hỗ trợ tệp dưới 3MB.

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_14_PM.png)

### Xem Email

Click vào field **Chủ đề** trên hàng để xem chi tiết Email. Chi tiết Email có hai dạng:

Dạng Email đơn lẻ có thể trực tiếp xem thông tin chi tiết.

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_34_PM.png)

Nhiều Email cùng chủ đề mặc định hiển thị dưới dạng danh sách, có thể click để mở rộng hoặc thu gọn.

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_29_PM.png)

Sau khi xem chi tiết Email, trạng thái Email mặc định được đặt là đã đọc. Có thể click nút **...** bên phải, chọn **Đánh dấu chưa đọc** để đặt lại thành chưa đọc.

### Trả lời và chuyển tiếp

Sau khi vào chi tiết Email, ở phía dưới có các nút **Trả lời**, **Chuyển tiếp** để thực hiện thao tác tương ứng.

![](https://static-docs.nocobase.com/email-manager/Loading--12-31-2025_09_45_PM.png)
