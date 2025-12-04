---
pkg: '@nocobase/plugin-workflow-json-variable-mapping'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Ánh xạ biến JSON

> v1.6.0

## Giới thiệu

Nút này dùng để ánh xạ các cấu trúc JSON phức tạp từ kết quả của các nút phía trước thành các biến, để các nút tiếp theo có thể sử dụng. Ví dụ, sau khi ánh xạ kết quả từ các nút Thao tác SQL và Yêu cầu HTTP, các giá trị thuộc tính của chúng có thể được sử dụng trong các nút tiếp theo.

:::info{title=Lưu ý}
Khác với nút Tính toán JSON, nút Ánh xạ biến JSON không hỗ trợ biểu thức tùy chỉnh và không dựa trên công cụ của bên thứ ba. Nút này chỉ dùng để ánh xạ các giá trị thuộc tính trong cấu trúc JSON, nhưng lại dễ sử dụng hơn.
:::

## Tạo nút

Trong giao diện cấu hình luồng công việc, quý vị nhấp vào nút dấu cộng (“+”) trong luồng để thêm nút “Ánh xạ biến JSON”:

![Tạo nút](https://static-docs.nocobase.com/20250113173635.png)

## Cấu hình nút

### Nguồn dữ liệu

Nguồn dữ liệu có thể là kết quả của một nút phía trước hoặc một đối tượng dữ liệu trong ngữ cảnh của luồng. Thông thường, đây là một đối tượng dữ liệu không có cấu trúc nội bộ, ví dụ như kết quả của nút SQL hoặc nút Yêu cầu HTTP.

![Nguồn dữ liệu](https://static-docs.nocobase.com/20250113173720.png)

### Nhập dữ liệu mẫu

Quý vị dán dữ liệu mẫu và nhấp vào nút phân tích để tự động tạo danh sách các biến:

![Nhập dữ liệu mẫu](https://static-docs.nocobase.com/20250113182327.png)

Nếu có bất kỳ biến nào trong danh sách được tạo tự động mà quý vị không cần sử dụng, quý vị có thể nhấp vào nút xóa để loại bỏ chúng.

:::info{title=Lưu ý}
Dữ liệu mẫu không phải là kết quả thực thi cuối cùng; nó chỉ dùng để hỗ trợ tạo danh sách biến.
:::

### Đường dẫn bao gồm chỉ mục mảng

Nếu không chọn tùy chọn này, nội dung mảng sẽ được ánh xạ theo cách xử lý biến mặc định của các luồng công việc NocoBase. Ví dụ, khi nhập dữ liệu mẫu sau:

```json
{
  "a": 1,
  "b": [
    {
      "c": 2
    },
    {
      "c": 3
    }
  ]
}
```

Trong các biến được tạo ra, `b.c` sẽ đại diện cho mảng `[2, 3]`.

Nếu chọn tùy chọn này, đường dẫn biến sẽ bao gồm chỉ mục mảng, ví dụ: `b.0.c` và `b.1.c`.

![20250113184056](https://static-docs.nocobase.com/20250113184056.png)

Khi bao gồm chỉ mục mảng, quý vị cần đảm bảo rằng các chỉ mục mảng trong dữ liệu đầu vào là nhất quán; nếu không, sẽ xảy ra lỗi phân tích cú pháp.

## Sử dụng trong các nút tiếp theo

Trong cấu hình của các nút tiếp theo, quý vị có thể sử dụng các biến được tạo bởi nút Ánh xạ biến JSON:

![20250113203658](https://static-docs.nocobase.com/20250113203658.png)

Mặc dù cấu trúc JSON có thể phức tạp, nhưng sau khi ánh xạ, quý vị chỉ cần chọn biến cho đường dẫn tương ứng.