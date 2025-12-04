---
pkg: '@nocobase/plugin-workflow-json-query'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Tính toán JSON

## Giới thiệu

Dựa trên các công cụ tính toán JSON khác nhau, nút này giúp tính toán hoặc biến đổi dữ liệu JSON phức tạp được tạo ra bởi các nút phía trên, để các nút tiếp theo có thể sử dụng. Ví dụ, kết quả từ các nút thao tác SQL và yêu cầu HTTP có thể được chuyển đổi thành các giá trị và định dạng biến cần thiết thông qua nút này, để các nút tiếp theo sử dụng.

## Tạo nút

Trong giao diện cấu hình luồng công việc, hãy nhấp vào nút dấu cộng (“+”) trong quy trình để thêm nút “Tính toán JSON”:

![Tạo nút](https://static-docs.nocobase.com/7de796517539ad9dfc88b7160f1d0dd7.png)

:::info{title=Lưu ý}
Thông thường, nút Tính toán JSON sẽ được tạo bên dưới các nút dữ liệu khác để phân tích cú pháp chúng.
:::

## Cấu hình nút

### Công cụ phân tích cú pháp

Nút Tính toán JSON hỗ trợ các cú pháp khác nhau thông qua các công cụ phân tích cú pháp khác nhau. Bạn có thể lựa chọn dựa trên sở thích và đặc điểm của từng công cụ. Hiện tại, có ba công cụ phân tích cú pháp được hỗ trợ:

- [JMESPath](https://jmespath.org/)
- [JSONPath Plus](https://jsonpath-plus.github.io/JSONPath/docs/ts/)
- [JSONata](https://jsonata.org/)

![Chọn công cụ](https://static-docs.nocobase.com/29be3b92a62b7d20312d1673e749f2ec.png)

### Nguồn dữ liệu

Nguồn dữ liệu có thể là kết quả của một nút phía trên hoặc một đối tượng dữ liệu trong ngữ cảnh của luồng công việc. Đây thường là một đối tượng dữ liệu không có cấu trúc tích hợp sẵn, chẳng hạn như kết quả của nút SQL hoặc nút yêu cầu HTTP.

![Nguồn dữ liệu](https://static-docs.nocobase.com/f5a97e20693b3d30b3a994a576aa282d.png)

:::info{title=Lưu ý}
Thông thường, các đối tượng dữ liệu của các nút liên quan đến bộ sưu tập đã được cấu trúc thông qua thông tin cấu hình bộ sưu tập và thường không cần được phân tích cú pháp bởi nút Tính toán JSON.
:::

### Biểu thức phân tích cú pháp

Tùy thuộc vào yêu cầu phân tích cú pháp và công cụ phân tích cú pháp đã chọn, hãy tùy chỉnh biểu thức phân tích cú pháp.

![Biểu thức phân tích cú pháp](https://static-docs.nocobase.com/181abd162fd32c09b62f6aa1d1cb3ed4.png)

:::info{title=Lưu ý}
Các công cụ khác nhau cung cấp các cú pháp phân tích cú pháp khác nhau. Để biết chi tiết, vui lòng tham khảo tài liệu trong các liên kết.
:::

Kể từ phiên bản `v1.0.0-alpha.15`, các biểu thức hỗ trợ sử dụng biến. Các biến sẽ được phân tích cú pháp trước khi công cụ cụ thể thực thi, thay thế các biến bằng các giá trị chuỗi cụ thể theo quy tắc của mẫu chuỗi, và nối chúng với các chuỗi tĩnh khác trong biểu thức để tạo thành biểu thức cuối cùng. Tính năng này rất hữu ích khi bạn cần xây dựng biểu thức một cách động, ví dụ, khi một số nội dung JSON cần một khóa động để phân tích cú pháp.

### Ánh xạ thuộc tính

Khi kết quả tính toán là một đối tượng (hoặc một mảng các đối tượng), bạn có thể tiếp tục ánh xạ các thuộc tính cần thiết thành các biến con thông qua ánh xạ thuộc tính để các nút tiếp theo sử dụng.

![Ánh xạ thuộc tính](https://static-docs.nocobase.com/b876abe4ccf6b4709eb8748f21ef3527.png)

:::info{title=Lưu ý}
Đối với kết quả là một đối tượng (hoặc mảng các đối tượng), nếu không thực hiện ánh xạ thuộc tính, toàn bộ đối tượng (hoặc mảng các đối tượng) sẽ được lưu dưới dạng một biến duy nhất trong kết quả của nút, và các giá trị thuộc tính của đối tượng không thể được sử dụng trực tiếp dưới dạng biến.
:::

## Ví dụ

Giả sử dữ liệu cần phân tích cú pháp đến từ một nút SQL trước đó dùng để truy vấn dữ liệu, và kết quả của nó là một tập hợp dữ liệu đơn hàng:

```json
[
  {
    "id": 1,
    "products": [
      {
        "id": 1,
        "title": "Product 1",
        "price": 100,
        "quantity": 1
      },
      {
        "id": 2,
        "title": "Product 2",
        "price": 120,
        "quantity": 2
      }
    ]
  },
  {
    "id": 2,
    "products": [
      {
        "id": 3,
        "title": "Product 3",
        "price": 130,
        "quantity": 1
      },
      {
        "id": 4,
        "title": "Product 4",
        "price": 140,
        "quantity": 2
      }
    ]
  }
]
```

Nếu chúng ta cần phân tích cú pháp và tính toán tổng giá của hai đơn hàng trong dữ liệu, và kết hợp nó với ID đơn hàng tương ứng thành một đối tượng để cập nhật tổng giá của đơn hàng, chúng ta có thể cấu hình như sau:

![Ví dụ - Cấu hình phân tích cú pháp SQL](https://static-docs.nocobase.com/e62322a868b26ff98120bfcd6dcdb3bd.png)

1. Chọn công cụ phân tích cú pháp JSONata;
2. Chọn kết quả của nút SQL làm nguồn dữ liệu;
3. Sử dụng biểu thức JSONata `$[0].{"id": id, "total": products.(price * quantity)}` để phân tích cú pháp;
4. Chọn ánh xạ thuộc tính để ánh xạ `id` và `total` thành các biến con;

Kết quả phân tích cú pháp cuối cùng như sau:

```json
[
  {
    "id": 1,
    "total": 340
  },
  {
    "id": 2,
    "total": 410
  }
]
```

Sau đó, lặp qua mảng đơn hàng đã hoàn thành để lấy giá trị, và cập nhật tổng giá của các đơn hàng.

![Cập nhật tổng giá của đơn hàng tương ứng](https://static-docs.nocobase.com/b3329b0efe4471f5eed1f0673bef740e.png)