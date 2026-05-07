---
title: "RunJS - Viết và chạy JavaScript trực tuyến"
description: "RunJS trong xây dựng giao diện: viết và chạy JavaScript trực tuyến, hỗ trợ JS Block, JS Field, JS Action và mở rộng logic tùy chỉnh khác."
keywords: "RunJS, viết JS trực tuyến, JavaScript, JS Block, JS Field, JS Action, xây dựng giao diện, NocoBase"
---

# Viết và chạy JS trực tuyến

Trong NocoBase, **RunJS** cung cấp một phương pháp mở rộng nhẹ, phù hợp với các tình huống **thử nghiệm nhanh, xử lý logic tạm thời**, không cần tạo Plugin hoặc sửa đổi mã nguồn, bạn có thể tùy chỉnh giao diện hoặc tương tác cá nhân hóa thông qua JavaScript.

Thông qua nó, bạn có thể nhập trực tiếp mã JS trong trình thiết kế giao diện để thực hiện:

- Tùy chỉnh nội dung render (Field, Block, cột, mục v.v.)
- Tùy chỉnh logic tương tác (nhấp nút, liên kết sự kiện)
- Kết hợp dữ liệu ngữ cảnh để triển khai hành vi động

## Các tình huống được hỗ trợ

### JS Block

Thông qua JS để tùy chỉnh render Block, có thể kiểm soát hoàn toàn cấu trúc và kiểu dáng của Block.
Phù hợp với các tình huống có độ linh hoạt cao như hiển thị component tùy chỉnh, biểu đồ thống kê, nội dung bên thứ ba.

![20250916105031](https://static-docs.nocobase.com/20250916105031.png)

Tài liệu: [JS Block](/interface-builder/blocks/other-blocks/js-block)

### JS Action

Thông qua JS để tùy chỉnh logic nhấp của nút Action, có thể thực hiện bất kỳ thao tác front-end hoặc yêu cầu API nào.
Ví dụ: tính toán giá trị động, gửi dữ liệu tùy chỉnh, kích hoạt Popup v.v.

![20250916105123](https://static-docs.nocobase.com/20250916105123.png)

Tài liệu: [JS Action](/interface-builder/actions/types/js-action)

### JS Field

Thông qua JS để tùy chỉnh logic render của Field. Có thể hiển thị động kiểu dáng, nội dung hoặc trạng thái khác nhau dựa trên giá trị Field.

![20250916105354](https://static-docs.nocobase.com/20250916105354.png)

Tài liệu: [JS Field](/interface-builder/fields/specific/js-field)

### JS Item

Thông qua JS để render một mục độc lập, không gắn với Field cụ thể. Thường được sử dụng để hiển thị khối thông tin tùy chỉnh.

![20250916104848](https://static-docs.nocobase.com/20250916104848.png)

Tài liệu: [JS Item](/interface-builder/fields/specific/js-item)

### JS Table Column

Thông qua JS để tùy chỉnh render cột Table.
Có thể triển khai logic hiển thị ô phức tạp, ví dụ thanh tiến trình, nhãn trạng thái v.v.

![20250916105443](https://static-docs.nocobase.com/20250916105443.png)

Tài liệu: [JS Table Column](/interface-builder/fields/specific/js-column)

### Linkage rules (Quy tắc liên kết)

Trong Form hoặc trang, kiểm soát logic liên kết giữa các Field thông qua JS.
Ví dụ: khi một Field thay đổi, sửa đổi động giá trị hoặc tính khả kiến của Field khác.

![20251029114532](https://static-docs.nocobase.com/20251029114532.png)

Tài liệu: [Quy tắc liên kết](/interface-builder/linkage-rule)

### Eventflow (Event flow)

Thông qua JS để tùy chỉnh điều kiện kích hoạt và logic thực thi của event flow, xây dựng chuỗi tương tác front-end phức tạp hơn.

![](https://static-docs.nocobase.com/20251031092755.png)

Tài liệu: [Event flow](/interface-builder/event-flow)
