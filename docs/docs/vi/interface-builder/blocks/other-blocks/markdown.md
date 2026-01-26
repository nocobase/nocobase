:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Khối Markdown

## Giới thiệu

Khối Markdown không cần liên kết với nguồn dữ liệu. Bạn có thể sử dụng cú pháp Markdown để định nghĩa nội dung văn bản và dùng khối này để hiển thị văn bản đã định dạng.

## Thêm Khối

Bạn có thể thêm Khối Markdown vào trang hoặc cửa sổ bật lên.

![20251026230916](https://static-docs.nocobase.com/20251026230916.png)

Bạn cũng có thể thêm Khối Markdown nội tuyến (inline-block) vào bên trong các khối Biểu mẫu và Chi tiết.

![20251026231002](https://static-docs.nocobase.com/20251026231002.png)

## Công cụ Mẫu

Sử dụng **[công cụ mẫu Liquid](https://liquidjs.com/tags/overview.html)**, cung cấp khả năng hiển thị mẫu mạnh mẽ và linh hoạt, giúp nội dung được tạo ra động và hiển thị tùy chỉnh. Với công cụ mẫu này, bạn có thể:

-   **Chèn động**: Sử dụng các phần giữ chỗ trong mẫu để tham chiếu biến, ví dụ: `{{ ctx.user.userName }}` sẽ tự động được thay thế bằng tên người dùng tương ứng.
-   **Hiển thị có điều kiện**: Hỗ trợ các câu lệnh điều kiện (`{% if %}...{% else %}`), hiển thị nội dung khác nhau tùy thuộc vào trạng thái dữ liệu.
-   **Duyệt lặp**: Sử dụng `{% for item in list %}...{% endfor %}` để duyệt qua các mảng hoặc bộ sưu tập, tạo danh sách, bảng hoặc các module lặp lại.
-   **Bộ lọc tích hợp**: Cung cấp nhiều bộ lọc phong phú (như `upcase`, `downcase`, `date`, `truncate`, v.v.) để định dạng và xử lý dữ liệu.
-   **Khả năng mở rộng**: Hỗ trợ các biến và hàm tùy chỉnh, giúp logic mẫu có thể tái sử dụng và dễ bảo trì.
-   **Bảo mật và cô lập**: Quá trình hiển thị mẫu được thực thi trong môi trường sandbox, tránh chạy trực tiếp mã nguy hiểm và tăng cường bảo mật.

Nhờ công cụ mẫu Liquid, các nhà phát triển và người tạo nội dung có thể **dễ dàng đạt được việc hiển thị nội dung động, tạo tài liệu cá nhân hóa, và hiển thị mẫu cho các cấu trúc dữ liệu phức tạp**, từ đó nâng cao đáng kể hiệu quả và tính linh hoạt.

## Sử dụng Biến

Khối Markdown trên một trang hỗ trợ các biến hệ thống chung (như người dùng hiện tại, vai trò hiện tại, v.v.).

![20251029203252](https://static-docs.nocobase.com/20251029203252.png)

Trong khi đó, Khối Markdown trong cửa sổ bật lên hành động của hàng khối (hoặc trang con) hỗ trợ nhiều biến ngữ cảnh dữ liệu hơn (như bản ghi hiện tại, bản ghi cửa sổ bật lên hiện tại, v.v.).

![20251029203400](https://static-docs.nocobase.com/20251029203400.png)

## Mã QR

Bạn có thể cấu hình mã QR trong Khối Markdown.

![20251026230019](https://static-docs.nocobase.com/20251026230019.png)

```html
<qr-code value="https://www.nocobase.com/" type="svg"></qr-code>
```