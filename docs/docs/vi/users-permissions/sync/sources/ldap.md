---
pkg: '@nocobase/plugin-auth-ldap'
title: "Đồng bộ dữ liệu người dùng từ LDAP"
description: "Đồng bộ người dùng và phòng ban LDAP vào NocoBase bằng cách sử dụng lại bộ xác thực LDAP hiện có."
keywords: "LDAP,đồng bộ người dùng,đồng bộ phòng ban,Bind DN,Search DN,NocoBase"
---

# Đồng bộ dữ liệu người dùng từ LDAP

<PluginInfo commercial="true" name="auth-ldap"></PluginInfo>

## Giới thiệu

Plugin **Xác thực: LDAP** có thể sử dụng bộ xác thực LDAP hiện có làm nguồn đồng bộ. Kết nối, Bind DN, Search DN, phạm vi tìm kiếm và ánh xạ thuộc tính được dùng lại, sau đó người dùng và cấu trúc phòng ban tùy chọn được ghi vào NocoBase.

## Chuẩn bị

1. Cài đặt và kích hoạt **Xác thực: LDAP** và **Đồng bộ dữ liệu người dùng**.
2. Tạo và kiểm tra bộ xác thực LDAP. Xem [Xác thực: LDAP](/auth-verification/auth-ldap/).
3. Đảm bảo ánh xạ thuộc tính có các trường cần thiết như tên người dùng hoặc email, biệt danh và số điện thoại.

## Thêm nguồn LDAP

Vào **Người dùng & Quyền > Đồng bộ**, nhấp **Thêm** và chọn **LDAP**.

| Trường | Mô tả |
| --- | --- |
| Tên nguồn | Tên duy nhất của nguồn đồng bộ. |
| Kích hoạt | Cho phép đồng bộ LDAP thủ công và theo lịch. |
| Bộ xác thực LDAP | Bộ xác thực có kết nối và ánh xạ thuộc tính được dùng lại. |
| Bộ lọc đồng bộ | Bộ lọc LDAP cho người dùng. Mặc định: `(&(objectCategory=person)(objectClass=user))`. |
| Giới hạn số lượng | Số entry tối đa mỗi lần tìm kiếm; để trống dùng giới hạn máy chủ. |
| Kích thước trang | Kích thước trang cho tìm kiếm LDAP phân trang. |
| Đồng bộ phòng ban | Đồng bộ cấu trúc LDAP thành phòng ban NocoBase. |
| DN tìm kiếm phòng ban | Bắt buộc khi đồng bộ phòng ban, ví dụ `ou=departments,dc=example,dc=com`. |

:::info
Nguồn sử dụng Bind DN và mật khẩu của bộ xác thực đã chọn và không lưu thêm một bản sao thông tin kết nối.
:::

## Đồng bộ người dùng

Lưu và kích hoạt nguồn, sau đó nhấp **Đồng bộ**. Mở **Nhiệm vụ** để xem kết quả và thử lại nhiệm vụ thất bại.

Việc khớp người dùng tuân theo **Sử dụng trường này để liên kết người dùng** của bộ xác thực. Giữ nguyên thiết lập và ánh xạ sau lần đồng bộ đầu tiên để tránh tạo người dùng trùng lặp.

## Đồng bộ phòng ban

Bật **Đồng bộ phòng ban** và nhập **DN tìm kiếm phòng ban**. Plugin tìm các đơn vị tổ chức, giữ nguyên cấu trúc và liên kết người dùng với phòng ban dựa trên Distinguished Name.

## Các trường được đồng bộ

### Trường người dùng

| Thuộc tính hoặc thiết lập LDAP | Trường hoặc mục đích trong NocoBase |
| --- | --- |
| Thuộc tính tài khoản đăng nhập | Định danh duy nhất tại nguồn và tên người dùng hoặc email được chọn để liên kết. Thường suy ra từ `{{account}}` trong bộ lọc, ví dụ `uid`, `sAMAccountName` hoặc `mail`. Người dùng bị bỏ qua nếu thiếu thuộc tính. |
| Ánh xạ tới `username` | Tên người dùng. |
| Ánh xạ tới `nickname` | Biệt danh. |
| Ánh xạ tới `email` | Địa chỉ email. |
| Ánh xạ tới `phone` | Số điện thoại. |
| `distinguishedName`, dự phòng bằng DN của entry | Phòng ban đã đồng bộ gần nhất trên đường dẫn DN và được đặt làm phòng ban chính. |

Với thuộc tính nhiều giá trị, chỉ giá trị đầu tiên được đồng bộ. Các thuộc tính không được ánh xạ sẽ không được đồng bộ.

### Trường phòng ban

| Thuộc tính hoặc cấu trúc LDAP | Trường hoặc mục đích trong NocoBase |
| --- | --- |
| `objectGUID` | Định danh duy nhất tại nguồn. Đơn vị tổ chức thiếu thuộc tính này sẽ bị bỏ qua. |
| `ou`, `cn`, `name` | Giá trị không rỗng đầu tiên được dùng làm tên phòng ban. |
| `distinguishedName`, dự phòng bằng DN của entry | Xác định phòng ban và phòng ban cấp trên để xây dựng cấu trúc. |

Theo mặc định, đồng bộ tìm các object `organizationalUnit` và `container`. Nhiều phòng ban từ `memberOf` và người phụ trách phòng ban hiện chưa được đồng bộ.

## Khắc phục sự cố

- Nếu không có người dùng, kiểm tra Search DN, phạm vi, quyền Bind DN và bộ lọc đồng bộ.
- Nếu kết quả bị cắt, cấu hình kích thước trang và kiểm tra giới hạn máy chủ LDAP.
- Nếu thiếu phòng ban, kiểm tra việc kích hoạt và phạm vi của DN tìm kiếm phòng ban.
- Xem chi tiết nhiệm vụ và log để tìm lỗi kết nối, bind và tìm kiếm.
