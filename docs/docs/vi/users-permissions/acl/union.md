---
pkg: '@nocobase/plugin-acl'
title: "Hợp các vai trò"
description: "Hợp các vai trò NocoBase: ba chế độ quyền - vai trò độc lập, cho phép hợp vai trò, chỉ hợp vai trò, chiến lược kết hợp quyền nhiều vai trò."
keywords: "Hợp vai trò,vai trò độc lập,kết hợp quyền,nhiều vai trò,ACL,NocoBase"
---

# Hợp các vai trò

Hợp các vai trò là một chế độ quản lý quyền. Theo cài đặt hệ thống, nhà phát triển hệ thống có thể chọn sử dụng vai trò độc lập, cho phép hợp vai trò, hoặc chỉ sử dụng hợp vai trò, để đáp ứng các nhu cầu quyền khác nhau.

![20250312184651](https://static-docs.nocobase.com/20250312184651.png)

## Vai trò độc lập

Hệ thống mặc định là vai trò độc lập: không sử dụng hợp vai trò, người dùng cần chuyển đổi từng vai trò mà họ có

![20250312184729](https://static-docs.nocobase.com/20250312184729.png)
![20250312184826](https://static-docs.nocobase.com/20250312184826.png)

## Cho phép hợp vai trò

Cho phép nhà phát triển hệ thống sử dụng hợp vai trò, tức là có thể đồng thời sử dụng quyền của tất cả các vai trò mà họ có, đồng thời cũng cho phép người dùng chuyển đổi từng vai trò.

![20250312185006](https://static-docs.nocobase.com/20250312185006.png)

## Chỉ hợp vai trò

Bắt buộc người dùng chỉ có thể sử dụng hợp vai trò, không thể chuyển đổi từng vai trò.

![20250312185105](https://static-docs.nocobase.com/20250312185105.png)

## Quy tắc hợp vai trò

Hợp là cho phép người dùng có quyền tối đa của tất cả các vai trò. Mô tả bên dưới về cách xác định quyền vai trò khi cài đặt vai trò có cùng mục xung đột.

### Kết hợp quyền thao tác

Ví dụ: Vai trò 1 (role1) cấu hình cho phép giao diện, vai trò 2 (role2) cấu hình cho phép cài đặt, kích hoạt, vô hiệu hóa plugin

![20250312190133](https://static-docs.nocobase.com/20250312190133.png)

![20250312190352](https://static-docs.nocobase.com/20250312190352.png)

Đăng nhập với vai trò sử dụng **toàn bộ quyền**, sẽ đồng thời có cả hai loại quyền này

![20250312190621](https://static-docs.nocobase.com/20250312190621.png)

### Kết hợp phạm vi dữ liệu

#### Hàng dữ liệu

Tình huống 1: Nhiều vai trò thiết lập điều kiện cùng một field

Vai trò A, cấu hình điều kiện: Age < 30

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Vai trò B, cấu hình điều kiện: Age > 25

| UserID | Name | Age |
| ------ | ---- | --- |
| 2      | Lily | 29  |
| 3      | Sam  | 32  |

Sau khi kết hợp:

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |
| 3      | Sam  | 32  |

Tình huống 2: Các vai trò khác nhau thiết lập các field khác nhau làm điều kiện

Vai trò A, cấu hình điều kiện: Age < 30

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Vai trò B, cấu hình điều kiện: Name chứa "Ja"

| UserID | Name   | Age |
| ------ | ------ | --- |
| 1      | Jack   | 23  |
| 3      | Jasmin | 27  |

Sau khi kết hợp:

| UserID | Name   | Age |
| ------ | ------ | --- |
| 1      | Jack   | 23  |
| 2      | Lily   | 29  |
| 3      | Jasmin | 27  |

#### Cột dữ liệu

Vai trò A, cấu hình field hiển thị: Name, Age

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Vai trò B, cấu hình field hiển thị: Name, Sex

| UserID | Name | Sex   |
| ------ | ---- | ----- |
| 1      | Jack | Man   |
| 2      | Lily | Woman |

Sau khi kết hợp:

| UserID | Name | Age | Sex   |
| ------ | ---- | --- | ----- |
| 1      | Jack | 23  | Man   |
| 2      | Lily | 29  | Woman |

#### Hỗn hợp hàng cột

Vai trò A, cấu hình điều kiện là Age < 30, field hiển thị là Name, Age

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Vai trò B, cấu hình điều kiện là Name chứa "Ja", field hiển thị là Name, Sex

| UserID | Name  | Sex   |
| ------ | ----- | ----- |
| 3      | Jade  | Woman |
| 4      | James | Man   |

Sau khi kết hợp:

| UserID | Name  | Age                                              | Sex                                                 |
| ------ | ----- | ------------------------------------------------ | --------------------------------------------------- |
| 1      | Jack  | 23                                               | <span style="background-color:#FFDDDD">Man</span>   |
| 2      | Lily  | 29                                               | <span style="background-color:#FFDDDD">Woman</span> |
| 3      | Jade  | <span style="background-color:#FFDDDD">27</span> | Woman                                               |
| 4      | James | <span style="background-color:#FFDDDD">31</span> | Man                                                 |

**Ghi chú: Một số dữ liệu được đánh dấu, không hiển thị ở các vai trò khác nhau, nhưng hiển thị ở vai trò đã kết hợp**

#### Tóm tắt

Quy tắc kết hợp vai trò trong phạm vi dữ liệu:

1. Giữa các hàng, đáp ứng một trong các điều kiện thì có quyền
2. Giữa các cột, các field được cộng lại
3. Khi thiết lập đồng thời cả hàng và cột, kết hợp riêng biệt giữa hàng với hàng, cột với cột, không phải kết hợp theo dạng (hàng+cột) với (hàng+cột)
