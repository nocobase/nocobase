---
pkg: '@nocobase/plugin-migration-manager'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Trình quản lý di chuyển

## Giới thiệu

Trình quản lý di chuyển giúp bạn chuyển cấu hình ứng dụng từ môi trường này sang môi trường khác. Chức năng chính của nó là di chuyển "cấu hình ứng dụng". Nếu bạn cần di chuyển toàn bộ dữ liệu, chúng tôi khuyến nghị sử dụng tính năng sao lưu và khôi phục của "[Trình quản lý sao lưu](../backup-manager/index.mdx)".

## Cài đặt

Trình quản lý di chuyển phụ thuộc vào plugin [Trình quản lý sao lưu](../backup-manager/index.mdx). Vui lòng đảm bảo rằng plugin này đã được cài đặt và kích hoạt.

## Quy trình và nguyên tắc

Trình quản lý di chuyển sẽ chuyển các bảng và dữ liệu từ cơ sở dữ liệu chính, dựa trên các quy tắc di chuyển đã định, từ một ứng dụng sang một ứng dụng khác. Vui lòng lưu ý rằng nó không di chuyển dữ liệu từ các cơ sở dữ liệu bên ngoài hoặc các ứng dụng con.

![20250102202546](https://static-docs.nocobase.com/20250102202546.png)

## Quy tắc di chuyển

### Quy tắc tích hợp

Trình quản lý di chuyển có thể di chuyển tất cả các bảng trong cơ sở dữ liệu chính và hỗ trợ năm quy tắc tích hợp sau:

- Chỉ cấu trúc: Chỉ di chuyển cấu trúc (schema) của bảng, không chèn hoặc cập nhật dữ liệu.
- Ghi đè (xóa và chèn lại): Xóa tất cả các bản ghi hiện có trong bảng dữ liệu đích, sau đó chèn dữ liệu mới.
- Chèn hoặc cập nhật (Upsert): Nếu bản ghi tồn tại thì cập nhật, nếu không tồn tại thì chèn mới.
- Bỏ qua khi trùng lặp: Khi chèn dữ liệu, nếu bản ghi đã tồn tại, thao tác chèn sẽ bị bỏ qua (không cập nhật).
- Bỏ qua: Không thực hiện bất kỳ xử lý nào.

Lưu ý:

- Các quy tắc "Ghi đè", "Chèn hoặc cập nhật" và "Bỏ qua khi trùng lặp" cũng sẽ đồng bộ hóa các thay đổi cấu trúc bảng.
- Các bảng có khóa chính là ID tự tăng hoặc không có khóa chính sẽ không áp dụng được các quy tắc "Chèn hoặc cập nhật" và "Bỏ qua khi trùng lặp".
- Các quy tắc "Chèn hoặc cập nhật" và "Bỏ qua khi trùng lặp" sử dụng khóa chính để xác định xem bản ghi có tồn tại hay không.

### Thiết kế chi tiết

![20250102204909](https://static-docs.nocobase.com/20250102204909.png)

### Giao diện cấu hình

Cấu hình quy tắc di chuyển

![20250102205450](https://static-docs.nocobase.com/20250102205450.png)

Bật quy tắc độc lập

![20250107105005](https://static-docs.nocobase.com/20250107105005.png)

Chọn quy tắc độc lập và các bảng sẽ được xử lý theo quy tắc độc lập hiện tại

![20250107104644](https://static-docs.nocobase.com/20250107104644.png)

## Tệp di chuyển

![20250102205844](https://static-docs.nocobase.com/20250102205844.png)

### Tạo di chuyển mới

![20250102205857](https://static-docs.nocobase.com/20250102205857.png)

### Thực thi di chuyển

![20250102205915](https://static-docs.nocobase.com/20250102205915.png)

Kiểm tra biến môi trường ứng dụng (tìm hiểu thêm về [Biến môi trường](#))

![20250102212311](https://static-docs.nocobase.com/20250102212311.png)

Nếu thiếu, một cửa sổ bật lên sẽ nhắc người dùng điền các biến môi trường mới cần thiết vào đây, sau đó tiếp tục.

![20250102210009](https://static-docs.nocobase.com/20250102210009.png)

## Nhật ký di chuyển

![20250102205738](https://static-docs.nocobase.com/20250102205738.png)

## Hoàn tác

Trước khi thực hiện bất kỳ thao tác di chuyển nào, ứng dụng hiện tại sẽ tự động được sao lưu. Nếu quá trình di chuyển thất bại hoặc kết quả không như mong đợi, bạn có thể hoàn tác và khôi phục bằng cách sử dụng [Trình quản lý sao lưu](../backup-manager/index.mdx).

![20250105195029](https://static-docs.nocobase.com/20250105195029.png)