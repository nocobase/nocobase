---
pkg: '@nocobase/plugin-workflow-json-query'
title: "Node Workflow - Tính toán JSON"
description: "Node tính toán JSON: tính toán hoặc biến đổi cấu trúc dữ liệu JSON, hỗ trợ nhiều engine tính toán."
keywords: "workflow,tính toán JSON,JSON Query,biến đổi JSON,NocoBase"
---

# Tính toán JSON

## Giới thiệu

Dựa trên các engine tính toán JSON khác nhau, tính toán hoặc biến đổi cấu trúc dữ liệu JSON phức tạp được sinh bởi Node phía trên để các Node tiếp theo sử dụng. Ví dụ kết quả của Node thao tác SQL và HTTP Request có thể được Node này biến đổi thành định dạng giá trị và biến cần thiết để các Node tiếp theo sử dụng.

## Tạo Node

Trong giao diện cấu hình Workflow, bấm nút dấu cộng ("+") trong quy trình để thêm Node "Tính toán JSON":

![Tạo Node](https://static-docs.nocobase.com/7de796517539ad9dfc88b7160f1d0dd7.png)

:::info{title=Mẹo}
Thông thường Node tính toán JSON được tạo dưới các Node dữ liệu khác để tiến hành phân tích.
:::

## Cấu hình Node

### Engine phân tích

Node tính toán JSON hỗ trợ các cú pháp khác nhau thông qua các engine phân tích khác nhau, có thể chọn theo sở thích của bản thân và đặc trưng của từng engine. Hiện hỗ trợ ba engine phân tích:

- [JMESPath](https://jmespath.org/)
- [JSONPath Plus](https://jsonpath-plus.github.io/JSONPath/docs/ts/)
- [JSONata](https://jsonata.org/)

![Chọn engine](https://static-docs.nocobase.com/29be3b92a62b7d20312d1673e749f2ec.png)

### Nguồn dữ liệu

Nguồn dữ liệu có thể là kết quả của Node phía trên hoặc đối tượng dữ liệu trong ngữ cảnh quy trình, thường là đối tượng dữ liệu chưa được tích hợp cấu trúc, ví dụ kết quả của Node SQL hoặc kết quả của Node HTTP Request.

![Nguồn dữ liệu](https://static-docs.nocobase.com/f5a97e20693b3d30b3a994a576aa282d.png)

:::info{title=Mẹo}
Thông thường đối tượng dữ liệu của các Node liên quan đến bảng dữ liệu đều đã được cấu trúc hóa qua thông tin cấu hình bảng dữ liệu, thường không cần phân tích qua Node tính toán JSON.
:::

### Biểu thức phân tích

Tự định nghĩa biểu thức phân tích dựa trên nhu cầu phân tích và engine phân tích khác nhau.

![Biểu thức phân tích](https://static-docs.nocobase.com/181abd162fd32c09b62f6aa1d1cb3ed4.png)

:::info{title=Mẹo}
Các engine khác nhau cung cấp cú pháp phân tích khác nhau, chi tiết có thể tham khảo tài liệu trong các liên kết.
:::

Từ phiên bản `v1.0.0-alpha.15`, biểu thức hỗ trợ sử dụng biến, biến sẽ được phân tích trước khi engine cụ thể thực thi, theo quy tắc template chuỗi sẽ thay thế biến thành giá trị chuỗi cụ thể và ghép với các chuỗi tĩnh khác của biểu thức thành biểu thức cuối cùng. Tính năng này rất hữu ích khi cần xây dựng biểu thức một cách động, ví dụ một số nội dung JSON cần key động để phân tích.

### Ánh xạ thuộc tính

Khi kết quả tính toán là một đối tượng (hoặc mảng đối tượng), có thể qua ánh xạ thuộc tính tiếp tục ánh xạ các thuộc tính cần thiết thành biến cấp con để các Node tiếp theo sử dụng.

![Ánh xạ thuộc tính](https://static-docs.nocobase.com/b876abe4ccf6b4709eb8748f21ef3527.png)

:::info{title=Mẹo}
Đối với kết quả là đối tượng (hoặc mảng đối tượng), nếu không thực hiện ánh xạ thuộc tính, sẽ lưu toàn bộ đối tượng (hoặc mảng đối tượng) làm một biến trong kết quả của Node, không thể trực tiếp sử dụng giá trị thuộc tính của đối tượng theo cách biến.
:::

## Ví dụ

Giả sử dữ liệu cần phân tích là Node SQL phía trước được dùng để truy vấn dữ liệu, kết quả của nó là một nhóm dữ liệu đơn hàng:

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

Nếu chúng ta cần phân tích và tính ra tổng giá riêng của hai đơn hàng trong dữ liệu và lắp ghép với ID đơn hàng tương ứng thành đối tượng để cập nhật tổng giá đơn hàng, có thể cấu hình như dưới đây:

![Ví dụ-cấu hình phân tích SQL](https://static-docs.nocobase.com/e62322a868b26ff98120bfcd6dcdb3bd.png)

1. Chọn engine phân tích JSONata;
2. Chọn kết quả của Node SQL làm nguồn dữ liệu;
3. Sử dụng biểu thức JSONata `$[0].{"id": id, "total": products.(price * quantity)}` để phân tích;
4. Chọn ánh xạ thuộc tính, ánh xạ `id` và `total` thành biến cấp con;

Kết quả phân tích cuối cùng như sau:

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

Sau đó vòng lặp lấy giá trị mảng đơn hàng đã hoàn tất để cập nhật tổng giá của đơn hàng.

![Cập nhật tổng giá của đơn hàng tương ứng](https://static-docs.nocobase.com/b3329b0efe4471f5eed1f0673bef740e.png)
