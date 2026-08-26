---
title: "Biến"
description: "Biến trong xây dựng giao diện: lưu trữ dữ liệu tạm thời, truyền giữa các Block, hỗ trợ biến toàn cục và biến cục bộ, có thể tham chiếu trong quy tắc liên kết và event flow."
keywords: "biến, variables, biến toàn cục, biến cục bộ, truyền giữa Block, quy tắc liên kết, xây dựng giao diện, NocoBase"
---

# Biến

## Giới thiệu

Biến là một nhóm các dấu hiệu, dùng để định danh một giá trị nào đó trong ngữ cảnh hiện tại, có thể được sử dụng trong các tình huống cấu hình phạm vi dữ liệu Block, giá trị mặc định Field, quy tắc liên kết, Workflow v.v.

![20251030114458](https://static-docs.nocobase.com/20251030114458.png)

## Các biến đã được hỗ trợ hiện nay

### Người dùng hiện tại

Biểu thị dữ liệu của người dùng đang đăng nhập hiện tại.

![20240416154950](https://static-docs.nocobase.com/20240416154950.png)

### Vai trò hiện tại

Biểu thị mã định danh vai trò (role name) của người dùng đang đăng nhập hiện tại.

![20240416155100](https://static-docs.nocobase.com/20240416155100.png)

### Form hiện tại

Giá trị của Form hiện tại, chỉ dùng cho Block Form. Các tình huống sử dụng có:

- Quy tắc liên kết của Form hiện tại
- Giá trị mặc định của Field trong Form (chỉ có hiệu lực khi thêm dữ liệu mới)
- Cấu hình phạm vi dữ liệu của Field quan hệ
- Cấu hình gán giá trị Field của Action gửi

#### Quy tắc liên kết của Form hiện tại

![20251027114920](https://static-docs.nocobase.com/20251027114920.png)

#### Giá trị mặc định của Field trong Form (chỉ Form thêm mới)

![20251027115016](https://static-docs.nocobase.com/20251027115016.png)

<!-- ![20240416171129_rec_](https://static-docs.nocobase.com/20240416171129_rec_.gif) -->

#### Cấu hình phạm vi dữ liệu của Field quan hệ

Dùng để lọc động các tùy chọn của Field downstream dựa trên Field upstream, đảm bảo việc nhập dữ liệu chính xác.

**Ví dụ:**

1. Người dùng chọn giá trị của Field **Owner**.
2. Hệ thống tự động lọc các tùy chọn của Field **Account** dựa trên **userName** của Owner đã chọn.

![20251030151928](https://static-docs.nocobase.com/20251030151928.png)

<!-- ![20240416171743_rec_](https://static-docs.nocobase.com/20240416171743_rec_.gif) -->

<!-- #### Cấu hình gán giá trị Field của Action gửi

![20240416171215_rec_](https://static-docs.nocobase.com/20240416171215_rec_.gif) -->

<!-- ### Đối tượng hiện tại

Hiện chỉ dùng cho cấu hình Field của Sub Form và Sub Table trong Block Form, biểu thị giá trị của mỗi mục:

- Giá trị mặc định của sub Field
- Phạm vi dữ liệu của sub Field quan hệ

#### Giá trị mặc định của sub Field

![20240416172933_rec_](https://static-docs.nocobase.com/20240416172933_rec_.gif)

#### Phạm vi dữ liệu của sub Field quan hệ

![20240416173043_rec_](https://static-docs.nocobase.com/20240416173043_rec_.gif) -->

<!-- ### Đối tượng cấp trên

Tương tự như "Đối tượng hiện tại", biểu thị đối tượng cấp cha của đối tượng hiện tại. Được hỗ trợ trong NocoBase v1.3.34-beta trở lên. -->

### Bản ghi hiện tại

Bản ghi là chỉ các dòng trong bảng dữ liệu, mỗi dòng đại diện cho một bản ghi. Trong **quy tắc liên kết của Action dòng** trong các Block hiển thị đều có biến "Bản ghi hiện tại".

Ví dụ: Vô hiệu hóa nút xóa cho các đơn hàng "Đã thanh toán".

![20251027120217](https://static-docs.nocobase.com/20251027120217.png)

### Bản ghi Popup hiện tại

Action Popup đóng vai trò rất quan trọng trong cấu hình giao diện NocoBase.

- Popup của Action dòng: mỗi Popup đều có một biến "Bản ghi Popup hiện tại", biểu thị bản ghi dòng hiện tại.
- Popup của Field quan hệ: mỗi Popup đều có một biến "Bản ghi Popup hiện tại", biểu thị bản ghi quan hệ được nhấp hiện tại.

Các Block trong Popup đều có thể sử dụng biến "Bản ghi Popup hiện tại", các tình huống sử dụng liên quan có:

- Cấu hình phạm vi dữ liệu của Block
- Cấu hình phạm vi dữ liệu của Field quan hệ
- Cấu hình giá trị mặc định của Field (Form thêm dữ liệu mới)
- Cấu hình quy tắc liên kết của Action

<!-- #### Cấu hình phạm vi dữ liệu của Block

![20251027151107](https://static-docs.nocobase.com/20251027151107.png)

#### Cấu hình phạm vi dữ liệu của Field quan hệ

![20240416224641_rec_](https://static-docs.nocobase.com/20240416224641_rec_.gif)

#### Cấu hình giá trị mặc định của Field (Form thêm dữ liệu mới)

![20240416223846_rec_](https://static-docs.nocobase.com/20240416223846_rec_.gif)

#### Cấu hình quy tắc liên kết của Action

![20240416223101_rec_](https://static-docs.nocobase.com/20240416223101_rec_.gif)

<!--
#### Cấu hình gán giá trị Field của Action gửi Form

![20240416224014_rec_](https://static-docs.nocobase.com/20240416224014_rec_.gif) -->

<!-- ### Bản ghi được chọn trong Table

Hiện chỉ dùng cho giá trị mặc định của Field Form trong Action Add record của Block Table

#### Giá trị mặc định của Field Form trong Action Add record -->

<!-- ### Bản ghi cha (Đã ngừng sử dụng)

Chỉ giới hạn sử dụng trong Block quan hệ, biểu thị bản ghi nguồn của dữ liệu quan hệ.

:::warning
"Bản ghi cha" đã ngừng sử dụng, khuyến nghị sử dụng "Bản ghi Popup hiện tại" tương đương để thay thế.
:::

<!-- ### Biến ngày

Biến ngày là một placeholder ngày có thể phân tích động, trong hệ thống có thể được sử dụng để thiết lập phạm vi dữ liệu Block, phạm vi dữ liệu Field quan hệ, điều kiện ngày trong quy tắc liên kết Action, cũng như giá trị mặc định của Field ngày. Tùy thuộc vào tình huống sử dụng, cách phân tích biến ngày cũng khác nhau: trong tình huống gán giá trị (ví dụ thiết lập giá trị mặc định), được phân tích thành thời điểm cụ thể; trong tình huống lọc (ví dụ điều kiện phạm vi dữ liệu), được phân tích thành phạm vi thời đoạn để hỗ trợ lọc linh hoạt hơn.

#### Tình huống lọc

Các tình huống sử dụng liên quan có:

- Thiết lập điều kiện Field ngày trong phạm vi dữ liệu Block
- Thiết lập điều kiện Field ngày trong phạm vi dữ liệu Field quan hệ
- Thiết lập điều kiện Field ngày trong quy tắc liên kết Action

![20250522211606](https://static-docs.nocobase.com/20250522211606.png)

Các biến liên quan có:

- Current time
- Yesterday
- Today
- Tomorrow
- Last week
- This week
- Next week
- Last month
- This month
- Next month
- Last quarter
- This quarter
- Next quarter
- Last year
- This year
- Next year
- Last 7 days
- Next 7 days
- Last 30 days
- Next 30 days
- Last 90 days
- Next 90 days

#### Tình huống gán giá trị

Trong tình huống gán giá trị, cùng một biến ngày sẽ được phân tích tự động thành định dạng khác nhau dựa trên loại Field mục tiêu. Ví dụ, khi sử dụng Today để gán giá trị cho các loại Field ngày khác nhau:

- Đối với Field timestamp (Timestamp) và Field datetime có múi giờ (DateTime with timezone), biến sẽ được phân tích thành chuỗi UTC time đầy đủ, ví dụ 2024-04-20T16:00:00.000Z, bao gồm thông tin múi giờ, phù hợp với nhu cầu đồng bộ giữa các múi giờ.

- Đối với Field datetime không có múi giờ (DateTime without timezone), biến sẽ được phân tích thành chuỗi định dạng giờ địa phương, ví dụ 2025-04-21 00:00:00, không có thông tin múi giờ, phù hợp hơn với xử lý logic nghiệp vụ địa phương.

- Đối với Field chỉ có ngày (DateOnly), biến sẽ được phân tích thành chuỗi ngày thuần túy, ví dụ 2025-04-21, chỉ bao gồm năm tháng ngày, không có phần thời gian.

Hệ thống sẽ phân tích biến thông minh dựa trên loại Field, đảm bảo định dạng chính xác khi gán giá trị, tránh lỗi dữ liệu hoặc bất thường do không khớp loại.

![20250522212802](https://static-docs.nocobase.com/20250522212802.png)

Các tình huống sử dụng liên quan có:

- Thiết lập giá trị mặc định Field ngày trong Block Form
- Thiết lập value thuộc tính Field ngày trong quy tắc liên kết
- Gán giá trị Field ngày trong nút gửi

Các biến liên quan có:

- Now
- Yesterday
- Today
- Tomorrow -->

### Tham số truy vấn URL

Biến này biểu thị tham số truy vấn trong URL của trang hiện tại, chỉ khi tồn tại chuỗi truy vấn trong URL trang thì biến này mới có thể sử dụng. Sử dụng kết hợp với [Action liên kết](/interface-builder/actions/types/link) sẽ tiện lợi hơn.

![20251027173017](https://static-docs.nocobase.com/20251027173017.png)

![20251027173121](https://static-docs.nocobase.com/20251027173121.png)

### API token

Giá trị của biến này là một chuỗi, là chứng thực dùng để truy cập NocoBase API. Có thể dùng để xác minh danh tính của người dùng.

### Loại thiết bị hiện tại

Ví dụ: Thiết bị không phải máy tính sẽ không hiển thị Action "In mẫu".

![20251029215303](https://static-docs.nocobase.com/20251029215303.png)
