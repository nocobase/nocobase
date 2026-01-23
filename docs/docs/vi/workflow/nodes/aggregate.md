---
pkg: '@nocobase/plugin-workflow-aggregate'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Truy vấn tổng hợp

## Giới thiệu

Dùng để thực hiện các truy vấn hàm tổng hợp trên dữ liệu trong một **bộ sưu tập** thỏa mãn các điều kiện nhất định, và trả về kết quả thống kê tương ứng. Chức năng này thường được sử dụng để xử lý dữ liệu thống kê liên quan đến báo cáo.

Việc triển khai node này dựa trên các hàm tổng hợp của cơ sở dữ liệu. Hiện tại, nó chỉ hỗ trợ thống kê trên một trường duy nhất của một **bộ sưu tập**. Giá trị kết quả thống kê sẽ được lưu trữ trong đầu ra của node để các node tiếp theo sử dụng.

## Cài đặt

Đây là một **plugin** tích hợp sẵn, không cần cài đặt.

## Tạo node

Trong giao diện cấu hình **luồng công việc**, hãy nhấp vào nút dấu cộng (“+”) trong luồng để thêm node “Truy vấn tổng hợp”:

![Tạo node Truy vấn tổng hợp](https://static-docs.nocobase.com/7f9d806ebf5064f80c30f8b67f316f0f.png)

## Cấu hình node

![Cấu hình node Truy vấn tổng hợp](https://static-docs.nocobase.com/57362f747b9992230567c6bb5e986fd2.png)

### Hàm tổng hợp

Hỗ trợ 5 hàm tổng hợp trong SQL: `COUNT`, `SUM`, `AVG`, `MIN`, và `MAX`. Hãy chọn một trong số đó để thực hiện truy vấn tổng hợp trên dữ liệu.

### Loại mục tiêu

Mục tiêu của truy vấn tổng hợp có thể được chọn theo hai chế độ. Một là chọn trực tiếp **bộ sưu tập** mục tiêu và một trường của nó. Hai là chọn **bộ sưu tập** liên quan có quan hệ một-nhiều và trường của nó thông qua một đối tượng dữ liệu hiện có trong ngữ cảnh **luồng công việc** để thực hiện truy vấn tổng hợp.

### Loại bỏ trùng lặp

Đây là `DISTINCT` trong SQL. Trường dùng để loại bỏ trùng lặp giống với trường của **bộ sưu tập** đã chọn. Hiện tại, hệ thống chưa hỗ trợ chọn các trường khác nhau cho hai mục này.

### Điều kiện lọc

Tương tự như các điều kiện lọc trong một truy vấn **bộ sưu tập** thông thường, bạn có thể sử dụng các biến ngữ cảnh từ **luồng công việc**.

## Ví dụ

Mục tiêu tổng hợp "Dữ liệu **bộ sưu tập**" khá dễ hiểu. Ở đây, chúng ta sẽ lấy ví dụ "đếm tổng số bài viết trong một danh mục sau khi một bài viết mới được thêm vào" để giới thiệu cách sử dụng mục tiêu tổng hợp "Dữ liệu **bộ sưu tập** liên quan".

Đầu tiên, hãy tạo hai **bộ sưu tập**: "Bài viết" và "Danh mục". Trong đó, **bộ sưu tập** "Bài viết" có một trường quan hệ nhiều-một trỏ đến **bộ sưu tập** "Danh mục", đồng thời tạo một trường quan hệ ngược lại là "Danh mục" một-nhiều "Bài viết":

| Tên trường | Loại               |
| ---------- | ------------------ |
| Tiêu đề    | Văn bản một dòng   |
| Danh mục   | Nhiều-một (Danh mục) |

| Tên trường  | Loại                 |
| ----------- | -------------------- |
| Tên danh mục | Văn bản một dòng     |
| Bài viết    | Một-nhiều (Bài viết) |

Tiếp theo, hãy tạo một **luồng công việc** được kích hoạt bởi sự kiện **bộ sưu tập**. Chọn để kích hoạt sau khi dữ liệu mới được thêm vào **bộ sưu tập** "Bài viết".

Sau đó, thêm một node Truy vấn tổng hợp và cấu hình như sau:

![Cấu hình node Truy vấn tổng hợp_Ví dụ](https://static-docs.nocobase.com/542272e638c6c0a567373d1b37ddda78.png)

Bằng cách này, sau khi **luồng công việc** được kích hoạt, node Truy vấn tổng hợp sẽ đếm số lượng tất cả các bài viết trong danh mục của bài viết mới được thêm vào và lưu kết quả đó làm đầu ra của node.

:::info{title=Mẹo}
Nếu bạn cần sử dụng dữ liệu quan hệ từ trình kích hoạt sự kiện **bộ sưu tập**, bạn phải cấu hình các trường liên quan trong phần "Tải trước dữ liệu liên quan" của trình kích hoạt, nếu không sẽ không thể chọn được.
:::