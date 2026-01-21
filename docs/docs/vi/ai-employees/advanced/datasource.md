---
pkg: "@nocobase/plugin-ai"
deprecated: true
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Nâng cao

## Giới thiệu

Trong plugin AI nhân viên, bạn có thể cấu hình các nguồn dữ liệu và thiết lập sẵn một số truy vấn bộ sưu tập. Sau đó, khi trò chuyện với AI nhân viên, chúng sẽ được gửi làm ngữ cảnh ứng dụng, và AI nhân viên sẽ trả lời dựa trên kết quả truy vấn bộ sưu tập.

## Cấu hình nguồn dữ liệu

Truy cập trang cấu hình plugin AI nhân viên, nhấp vào thẻ `Data source` để vào trang quản lý nguồn dữ liệu của AI nhân viên.

![20251022103526](https://static-docs.nocobase.com/20251022103526.png)

Nhấp vào nút `Add data source` để vào trang tạo nguồn dữ liệu.

Bước 1: Nhập thông tin cơ bản của `Collection`:
- Trong ô nhập `Title`, nhập tên dễ nhớ cho nguồn dữ liệu;
- Trong ô nhập `Collection`, chọn nguồn dữ liệu và bộ sưu tập muốn sử dụng;
- Trong ô nhập `Description`, nhập thông tin mô tả cho nguồn dữ liệu.
- Trong ô nhập `Limit`, nhập số lượng giới hạn truy vấn cho nguồn dữ liệu để tránh trả về quá nhiều dữ liệu, vượt quá ngữ cảnh hội thoại của AI.

![20251022103935](https://static-docs.nocobase.com/20251022103935.png)

Bước 2: Chọn các trường muốn truy vấn:

Trong danh sách `Fields`, đánh dấu chọn các trường bạn muốn truy vấn.

![20251022104516](https://static-docs.nocobase.com/20251022104516.png)

Bước 3: Thiết lập điều kiện truy vấn:

![20251022104635](https://static-docs.nocobase.com/20251022104635.png)

Bước 4: Thiết lập điều kiện sắp xếp:

![20251022104722](https://static-docs.nocobase.com/20251022104722.png)

Cuối cùng, trước khi lưu nguồn dữ liệu, bạn có thể xem trước kết quả truy vấn nguồn dữ liệu.

![20251022105012](https://static-docs.nocobase.com/20251022105012.png)

## Gửi nguồn dữ liệu trong hội thoại

Trong hộp thoại AI nhân viên, nhấp vào nút `Add work context` ở góc dưới bên trái, chọn `Data source`, bạn sẽ thấy nguồn dữ liệu vừa thêm.

![20251022105240](https://static-docs.nocobase.com/20251022105240.png)

Đánh dấu chọn nguồn dữ liệu bạn muốn gửi, nguồn dữ liệu đã chọn sẽ được đính kèm vào hộp thoại.

![20251022105401](https://static-docs.nocobase.com/20251022105401.png)

Sau khi nhập tin nhắn câu hỏi, giống như gửi tin nhắn thông thường, nhấp vào nút gửi, AI nhân viên sẽ trả lời dựa trên nguồn dữ liệu.

Nguồn dữ liệu cũng sẽ xuất hiện trong danh sách tin nhắn.

![20251022105611](https://static-docs.nocobase.com/20251022105611.png)

## Lưu ý

Nguồn dữ liệu sẽ tự động lọc dữ liệu dựa trên quyền ACL của người dùng hiện tại, chỉ hiển thị dữ liệu mà người dùng có quyền truy cập.