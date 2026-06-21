---
pkg: '@nocobase/plugin-workflow-json-variable-mapping'
title: "Node Workflow - Ánh xạ biến JSON"
description: "Node ánh xạ biến JSON: ánh xạ cấu trúc JSON thành biến cho các Node tiếp theo sử dụng."
keywords: "workflow,ánh xạ biến JSON,JSON mapping,trích xuất biến,NocoBase"
---

# Ánh xạ biến JSON

> v1.6.0

## Giới thiệu

Được dùng để ánh xạ cấu trúc JSON phức tạp trong kết quả của Node phía trên thành biến để các Node tiếp theo sử dụng. Ví dụ kết quả của Node thao tác SQL và HTTP Request, sau khi được ánh xạ có thể sử dụng giá trị thuộc tính trong đó ở các Node tiếp theo.

:::info{title=Mẹo}
Khác với Node tính toán JSON, Node ánh xạ biến JSON không hỗ trợ biểu thức tùy chỉnh, cũng không dựa trên engine bên thứ ba, chỉ được dùng để ánh xạ giá trị thuộc tính trong cấu trúc JSON nhưng sử dụng đơn giản hơn.
:::

## Tạo Node

Trong giao diện cấu hình Workflow, bấm nút dấu cộng ("+") trong quy trình để thêm Node "Ánh xạ biến JSON":

![Tạo Node](https://static-docs.nocobase.com/20250113173635.png)

## Cấu hình Node

### Nguồn dữ liệu

Nguồn dữ liệu có thể là kết quả của Node phía trên hoặc đối tượng dữ liệu trong ngữ cảnh quy trình, thường là đối tượng dữ liệu chưa được tích hợp cấu trúc, ví dụ kết quả của Node SQL hoặc kết quả của Node HTTP Request.

![Nguồn dữ liệu](https://static-docs.nocobase.com/20250113173720.png)

### Nhập dữ liệu mẫu

Bằng cách dán một dữ liệu mẫu và bấm nút phân tích để tự động phân tích sinh danh sách biến:

![Nhập dữ liệu mẫu](https://static-docs.nocobase.com/20250113182327.png)

Trong danh sách được tự động sinh nếu có biến không cần sử dụng, có thể bấm nút xóa để xóa.

:::info{title=Mẹo}
Dữ liệu mẫu không phải kết quả thực thi cuối cùng, chỉ được dùng để hỗ trợ sinh danh sách biến.
:::

### Đường dẫn bao gồm chỉ số mảng

Trong trường hợp không chọn, sẽ ánh xạ nội dung mảng theo cách xử lý biến mặc định của Workflow NocoBase. Ví dụ nhập mẫu sau:

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

Trong các biến được sinh, `b.c` sẽ đại diện cho mảng `[2, 3]`.

Nếu chọn tùy chọn này, sẽ bao gồm chỉ số mảng trong đường dẫn biến, ví dụ `b.0.c` và `b.1.c`.

![20250113184056](https://static-docs.nocobase.com/20250113184056.png)

Trong trường hợp bao gồm chỉ số mảng, cần đảm bảo chỉ số mảng trong dữ liệu đầu vào nhất quán, nếu không sẽ dẫn đến lỗi phân tích.

## Sử dụng trong các Node tiếp theo

Trong cấu hình của các Node tiếp theo, có thể sử dụng các biến được Node ánh xạ biến JSON sinh ra:

![20250113203658](https://static-docs.nocobase.com/20250113203658.png)

Mặc dù cấu trúc JSON có thể rất phức tạp, nhưng sau khi ánh xạ, chỉ cần chọn biến của đường dẫn tương ứng là được.
