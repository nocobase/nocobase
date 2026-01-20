---
pkg: '@nocobase/plugin-acl'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Hợp nhất vai trò

Hợp nhất vai trò là một chế độ quản lý quyền hạn. Dựa trên cài đặt hệ thống, nhà phát triển hệ thống có thể chọn sử dụng `Vai trò độc lập`, `Cho phép hợp nhất vai trò`, hoặc `Chỉ hợp nhất vai trò` để đáp ứng các yêu cầu quyền hạn khác nhau.

![20250312184651](https://static-docs.nocobase.com/20250312184651.png)

## Vai trò độc lập

Theo mặc định, hệ thống sử dụng vai trò độc lập: không sử dụng hợp nhất vai trò, người dùng cần chuyển đổi giữa các vai trò mà họ sở hữu một cách riêng lẻ.

![20250312184729](https://static-docs.nocobase.com/20250312184729.png)
![20250312184826](https://static-docs.nocobase.com/20250312184826.png)

## Cho phép hợp nhất vai trò

Cho phép nhà phát triển hệ thống sử dụng hợp nhất vai trò, nghĩa là người dùng có thể đồng thời sử dụng quyền hạn của tất cả các vai trò mà họ sở hữu, đồng thời vẫn cho phép người dùng chuyển đổi giữa các vai trò một cách riêng lẻ.

![20250312185006](https://static-docs.nocobase.com/20250312185006.png)

## Chỉ hợp nhất vai trò

Buộc người dùng chỉ có thể sử dụng hợp nhất vai trò và không thể chuyển đổi giữa các vai trò một cách riêng lẻ.

![20250312185105](https://static-docs.nocobase.com/20250312185105.png)

## Quy tắc hợp nhất vai trò

Hợp nhất vai trò cấp cho người dùng quyền hạn tối đa của tất cả các vai trò. Dưới đây là giải thích cách xác định quyền hạn khi các vai trò có cài đặt xung đột trên cùng một mục.

### Hợp nhất quyền thao tác

Ví dụ: Vai trò 1 (role1) được cấu hình `Cho phép cấu hình giao diện`, và Vai trò 2 (role2) được cấu hình `Cho phép cài đặt, kích hoạt, vô hiệu hóa plugin`.

![20250312190133](https://static-docs.nocobase.com/20250312190133.png)

![20250312190352](https://static-docs.nocobase.com/20250312190352.png)

Khi đăng nhập với vai trò **Toàn quyền**, người dùng sẽ đồng thời có cả hai quyền hạn này.

![20250312190621](https://static-docs.nocobase.com/20250312190621.png)

### Hợp nhất phạm vi dữ liệu

#### Các hàng dữ liệu

Kịch bản 1: Nhiều vai trò đặt điều kiện trên cùng một trường

Vai trò A, điều kiện cấu hình: Age < 30

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Vai trò B, điều kiện cấu hình: Age > 25

| UserID | Name | Age |
| ------ | ---- | --- |
| 2      | Lily | 29  |
| 3      | Sam  | 32  |

**Sau khi hợp nhất:**

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |
| 3      | Sam  | 32  |

Kịch bản 2: Các vai trò khác nhau đặt điều kiện trên các trường khác nhau

Vai trò A, điều kiện cấu hình: Age < 30

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Vai trò B, điều kiện cấu hình: Name chứa "Ja"

| UserID | Name   | Age |
| ------ | ------ | --- |
| 1      | Jack   | 23  |
| 3      | Jasmin | 27  |

**Sau khi hợp nhất:**

| UserID | Name   | Age |
| ------ | ------ | --- |
| 1      | Jack   | 23  |
| 2      | Lily   | 29  |
| 3      | Jasmin | 27  |

#### Các cột dữ liệu

Vai trò A, các trường hiển thị được cấu hình: Name, Age

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Vai trò B, các trường hiển thị được cấu hình: Name, Sex

| UserID | Name | Sex   |
| ------ | ---- | ----- |
| 1      | Jack | Man   |
| 2      | Lily | Woman |

**Sau khi hợp nhất:**

| UserID | Name | Age | Sex   |
| ------ | ---- | --- | ----- |
| 1      | Jack | 23  | Man   |
| 2      | Lily | 29  | Woman |

#### Kết hợp hàng và cột

Vai trò A, điều kiện cấu hình Age < 30, các trường hiển thị là Name, Age

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Vai trò B, điều kiện cấu hình Name chứa "Ja", các trường hiển thị là Name, Sex

| UserID | Name  | Sex   |
| ------ | ----- | ----- |
| 3      | Jade  | Woman |
| 4      | James | Man   |

**Sau khi hợp nhất:**

| UserID | Name  | Age                                              | Sex                                                 |
| ------ | ----- | ------------------------------------------------ | --------------------------------------------------- |
| 1      | Jack  | 23                                               | <span style="background-color:#FFDDDD">Man</span>   |
| 2      | Lily  | 29                                               | <span style="background-color:#FFDDDD">Woman</span> |
| 3      | Jade  | <span style="background-color:#FFDDDD">27</span> | Woman                                               |
| 4      | James | <span style="background-color:#FFDDDD">31</span> | Man                                                 |

**Lưu ý: Các ô dữ liệu được đánh dấu có thể không hiển thị trong từng vai trò riêng lẻ nhưng lại hiển thị khi các vai trò được hợp nhất.**

#### Tóm tắt

Quy tắc hợp nhất vai trò trong phạm vi dữ liệu:

1. Giữa các hàng, nếu bất kỳ điều kiện nào được thỏa mãn, hàng đó sẽ có quyền.
2. Giữa các cột, các trường sẽ được kết hợp.
3. Khi cả hàng và cột đều được cấu hình, chúng sẽ được hợp nhất riêng biệt theo hàng và theo cột, chứ không phải theo các tổ hợp (hàng + cột).