---
title: "Block Form Bộ lọc"
description: "Block Form Bộ lọc: cấu hình điều kiện lọc, khởi tạo lọc cho Block dữ liệu, hỗ trợ lọc tổ hợp đa Field, làm mới liên kết."
keywords: "Form Bộ lọc,FilterForm,điều kiện lọc,lọc dữ liệu,làm mới liên kết,Interface Builder,NocoBase"
---

# Form Bộ lọc

## Giới thiệu

Form Bộ lọc cho phép bạn lọc dữ liệu bằng cách điền các Field Form. Có thể được dùng để lọc Block Table, Block biểu đồ, Block danh sách, v.v.

## Cách sử dụng

Hãy cùng nhanh chóng tìm hiểu cách sử dụng Form Bộ lọc qua một ví dụ đơn giản. Giả sử chúng ta có một Block Table chứa thông tin người dùng, chúng ta muốn có thể lọc dữ liệu thông qua Form Bộ lọc. Như sau:

![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

Các bước cấu hình như sau:

1. Bật chế độ cấu hình, thêm một Block "Form Bộ lọc" và một "Block Table" vào Trang.
![20251031163525_rec_](https://static-docs.nocobase.com/20251031163525_rec_.gif)
2. Thêm Field "Biệt danh" trong Block Table và Block Form Bộ lọc.
![20251031163932_rec_](https://static-docs.nocobase.com/20251031163932_rec_.gif)
3. Bây giờ bạn có thể bắt đầu sử dụng.
![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

## Cách sử dụng nâng cao

Block Form Bộ lọc hỗ trợ nhiều cấu hình nâng cao hơn, dưới đây là một số cách sử dụng phổ biến.

### Liên kết nhiều Block

Một Field Form đơn có thể đồng thời lọc dữ liệu của nhiều Block. Cách thực hiện cụ thể:

1. Nhấp vào tùy chọn cấu hình "Connect fields" của Field.
![20251031170300](https://static-docs.nocobase.com/20251031170300.png)
2. Thêm Block đích cần liên kết, ở đây chúng ta chọn Block danh sách trong Trang.
![20251031170718](https://static-docs.nocobase.com/20251031170718.png)
3. Chọn một hoặc nhiều Field trong Block danh sách để liên kết. Ở đây chúng ta chọn Field "Biệt danh".
![20251031171039](https://static-docs.nocobase.com/20251031171039.png)
4. Nhấp nút lưu, hoàn thành cấu hình, hiệu ứng như sau:
![20251031171209_rec_](https://static-docs.nocobase.com/20251031171209_rec_.gif)

### Liên kết Block biểu đồ

Tham khảo: [Bộ lọc Trang và liên kết](../../../data-visualization/guide/filters-and-linkage.md)

### Field tùy chỉnh

Ngoài việc chọn Field từ Table dữ liệu, bạn còn có thể tạo Field Form thông qua "Field tùy chỉnh". Ví dụ có thể tạo một Field dropdown chọn đơn và tùy chỉnh các tùy chọn. Cách thực hiện cụ thể:

1. Nhấp vào tùy chọn "Field tùy chỉnh", giao diện cấu hình hiện ra.
![20251031173833](https://static-docs.nocobase.com/20251031173833.png)
2. Điền tiêu đề Field, chọn "Chọn" trong "Loại Field" và cấu hình tùy chọn.
![20251031174857_rec_](https://static-docs.nocobase.com/20251031174857_rec_.gif)
3. Field tùy chỉnh mới thêm cần liên kết thủ công với Field của Block đích, cách thực hiện như sau:
![20251031181957_rec_](https://static-docs.nocobase.com/20251031181957_rec_.gif)
4. Cấu hình hoàn thành, hiệu ứng như sau:
![20251031182235_rec_](https://static-docs.nocobase.com/20251031182235_rec_.gif)

Các loại Field hỗ trợ hiện tại:

- Hộp văn bản
- Số
- Ngày tháng
- Chọn
- Radio button
- Checkbox
- Bản ghi liên kết

#### Bản ghi liên kết (Field quan hệ tùy chỉnh)

"Bản ghi liên kết" phù hợp cho các trường hợp "lọc theo bản ghi của Table liên kết". Ví dụ trong danh sách đơn hàng, lọc đơn hàng theo "Khách hàng", hoặc trong danh sách nhiệm vụ lọc nhiệm vụ theo "Người phụ trách".

Giải thích tùy chọn cấu hình:

- **Table dữ liệu đích**: Cho biết tải bản ghi có thể chọn từ Table dữ liệu nào.
- **Field tiêu đề**: Dùng cho văn bản hiển thị của các tùy chọn dropdown và tag đã chọn (như tên, tiêu đề).
- **Field giá trị**: Dùng cho giá trị thực sự được gửi khi lọc, thường chọn Field khóa chính (như `id`).
- **Cho phép chọn nhiều**: Sau khi bật có thể chọn nhiều bản ghi cùng lúc.
- **Toán tử**: Định nghĩa cách điều kiện lọc khớp (xem giải thích "Toán tử" bên dưới).

Cấu hình khuyến nghị:

1. `Field tiêu đề` chọn Field có khả năng đọc cao (như "Tên"), tránh sử dụng ID thuần ảnh hưởng đến khả năng sử dụng.
2. `Field giá trị` ưu tiên chọn Field khóa chính, đảm bảo lọc ổn định và duy nhất.
3. Trường hợp chọn đơn thường tắt `Cho phép chọn nhiều`, trường hợp chọn đa bật `Cho phép chọn nhiều` và kết hợp với `Toán tử` phù hợp.

#### Toán tử

`Toán tử` được dùng để định nghĩa quan hệ khớp giữa "giá trị Field Form Bộ lọc" và "giá trị Field Block đích".

### Thu gọn

Thêm một nút thu gọn, có thể thu gọn và mở rộng nội dung Form Bộ lọc, tiết kiệm không gian Trang.

![20251031182743](https://static-docs.nocobase.com/20251031182743.png)

Hỗ trợ các cấu hình sau:

![20251031182849](https://static-docs.nocobase.com/20251031182849.png)

- **Số hàng hiển thị khi thu gọn**: Cài đặt số hàng Field Form hiển thị ở trạng thái thu gọn.
- **Mặc định thu gọn**: Sau khi bật, Form Bộ lọc mặc định hiển thị ở trạng thái thu gọn.
