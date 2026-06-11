---
title: "Block Markdown"
description: "Block Markdown: hiển thị nội dung định dạng Markdown, hỗ trợ văn bản phong phú, khối mã, hình ảnh, v.v., dùng để hiển thị nội dung tài liệu."
keywords: "Block Markdown,Markdown,văn bản phong phú,hiển thị tài liệu,Interface Builder,NocoBase"
---

# Block Markdown

## Giới thiệu

Block Markdown không cần bind nguồn dữ liệu để sử dụng, sử dụng cú pháp Markdown để định nghĩa nội dung văn bản, có thể dùng để hiển thị nội dung văn bản đã được định dạng.

## Thêm Block

Có thể thêm Block Markdown trong Trang hoặc Popup

![20251026230916](https://static-docs.nocobase.com/20251026230916.png)

Cũng có thể thêm Block Markdown nội tuyến (inline-block) trong Block Form và Block Chi tiết

![20251026231002](https://static-docs.nocobase.com/20251026231002.png)

## Template engine

Sử dụng **[Liquid template engine](https://liquidjs.com/tags/overview.html)**, cung cấp khả năng render template mạnh mẽ và linh hoạt, làm cho nội dung có thể được tạo động và hiển thị tùy chỉnh. Thông qua template engine, bạn có thể:

- **Nội suy động**: Sử dụng placeholder trong template để tham chiếu biến, ví dụ `{{ ctx.user.userName }}` tự động thay thế bằng tên người dùng tương ứng.
- **Render điều kiện**: Hỗ trợ câu lệnh điều kiện (`{% if %}...{% else %}`), hiển thị nội dung khác nhau theo trạng thái dữ liệu khác nhau.
- **Lặp duyệt**: Sử dụng `{% for item in list %}...{% endfor %}` để duyệt mảng hoặc collection, tạo danh sách, Table hoặc module lặp.
- **Bộ lọc có sẵn**: Cung cấp các bộ lọc phong phú (như `upcase`, `downcase`, `date`, `truncate`, v.v.), có thể định dạng và xử lý dữ liệu.
- **Khả năng mở rộng**: Hỗ trợ biến và hàm tùy chỉnh, làm cho logic template có thể tái sử dụng và bảo trì.
- **An toàn và cách ly**: Render template thực thi trong môi trường sandbox, tránh chạy trực tiếp mã nguy hiểm, nâng cao tính an toàn.

Với Liquid template engine, nhà phát triển và người tạo nội dung có thể **dễ dàng thực hiện hiển thị nội dung động, tạo tài liệu cá nhân hóa và render template của các cấu trúc dữ liệu phức tạp**, nâng cao đáng kể hiệu suất và tính linh hoạt.


## Sử dụng biến

Markdown trong Trang hỗ trợ các biến hệ thống thông dụng (như người dùng hiện tại, vai trò hiện tại, v.v.).

![20251029203252](https://static-docs.nocobase.com/20251029203252.png)

Còn Markdown trong Popup Action hàng Block (hoặc Trang con), thì hỗ trợ nhiều biến ngữ cảnh dữ liệu hơn (như bản ghi hiện tại, bản ghi Popup hiện tại, v.v.).

![20251029203400](https://static-docs.nocobase.com/20251029203400.png)

<!-- ## Bản địa hóa

Có sẵn bộ lọc `t`, hỗ trợ bản dịch bản địa hóa văn bản.

> Lưu ý: Văn bản cần được nhập trước vào Table bản địa hóa, sau này sẽ được tối ưu hóa để hỗ trợ tạo từ vựng bản địa hóa tùy chỉnh.

![20251026223542](https://static-docs.nocobase.com/20251026223542.png) -->

## QR Code

Markdown hỗ trợ cấu hình QR Code

![20251026230019](https://static-docs.nocobase.com/20251026230019.png)

```html
<qr-code value="https://www.nocobase.com/" type="svg"></qr-code>
```
