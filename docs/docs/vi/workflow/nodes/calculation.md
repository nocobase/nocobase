---
title: "Node Workflow - Tính toán"
description: "Node tính toán: tính giá trị biểu thức, hỗ trợ nhiều engine tính toán như Formula.js, kết quả được dùng cho các Node tiếp theo."
keywords: "workflow,tính toán,Calculation,Formula.js,tính giá trị biểu thức,NocoBase"
---

# Tính toán

Node tính toán có thể tính giá trị một biểu thức, kết quả tính toán sẽ được lưu trong kết quả của Node tương ứng để các Node khác sau này sử dụng. Đây là công cụ dùng để tính toán, xử lý và chuyển đổi dữ liệu, ở một mức độ nào đó, có thể thay thế chức năng gọi hàm tính toán cho một giá trị và gán vào biến trong ngôn ngữ lập trình.

## Tạo Node

Trong giao diện cấu hình Workflow, bấm nút dấu cộng ("+") trong quy trình để thêm Node "Tính toán":

![Node tính toán_thêm](https://static-docs.nocobase.com/58a455540d26945251cd143eb4b16579.png)

## Cấu hình Node

![Node tính toán_cấu hình Node](https://static-docs.nocobase.com/6a155de3f6a883d8cd1881b2d9c33874.png)

### Engine tính toán

Engine tính toán quy định cú pháp được hỗ trợ cho biểu thức, hiện hỗ trợ các engine tính toán [Math.js](https://mathjs.org/) và [Formula.js](https://formulajs.info/), mỗi engine đã tích hợp sẵn nhiều hàm thông dụng và phương thức thao tác dữ liệu, cách dùng cụ thể có thể tham khảo tài liệu chính thức của chúng.

:::info{title=Mẹo}
Cần lưu ý rằng các engine khác nhau có sự khác biệt khi truy cập chỉ số mảng, chỉ số của Math.js bắt đầu từ `1`, còn Formula.js bắt đầu từ `0`.
:::

Ngoài ra nếu chỉ cần ghép chuỗi đơn giản, có thể trực tiếp sử dụng "Template chuỗi", engine này sẽ thay thế các biến trong biểu thức bằng giá trị tương ứng và trả về chuỗi sau khi ghép.

### Biểu thức

Biểu thức là dạng chuỗi của một công thức tính toán, có thể được tạo nên từ biến, hằng số, toán tử và các hàm được hỗ trợ... Có thể sử dụng các biến của ngữ cảnh quy trình, ví dụ kết quả của Node phía trước Node tính toán, hoặc biến cục bộ của vòng lặp...

Khi đầu vào biểu thức không đúng cú pháp, sẽ nhắc lỗi trong cấu hình Node, nếu khi thực thi cụ thể biến không tồn tại hoặc kiểu không khớp, hoặc sử dụng hàm không tồn tại, Node tính toán sẽ dừng sớm với trạng thái lỗi.

## Ví dụ

### Tính tổng giá đơn hàng

Thông thường một đơn hàng có thể có nhiều sản phẩm, giá và số lượng của mỗi sản phẩm đều khác nhau, tổng giá của đơn hàng cần tính tổng tích của giá và số lượng của tất cả sản phẩm. Có thể sử dụng Node tính toán để tính tổng giá đơn hàng sau khi load danh sách chi tiết đơn hàng (tập dữ liệu quan hệ một - nhiều):

![Node tính toán_ví dụ_cấu hình Node](https://static-docs.nocobase.com/85966b0116afb49aa966eeaa85e78dae.png)

Trong đó hàm `SUMPRODUCT` của Formula.js có thể tính tổng tích của các dòng trong hai mảng có cùng độ dài, cộng tổng lại sẽ thu được tổng giá đơn hàng.
