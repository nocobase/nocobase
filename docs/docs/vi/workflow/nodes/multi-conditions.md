---
title: "Node Workflow - Nhánh đa điều kiện"
description: "Node nhánh đa điều kiện: tương tự switch/case, phán đoán điều kiện theo thứ tự, thực thi nhánh tương ứng hoặc nhánh ngược lại."
keywords: "workflow,nhánh đa điều kiện,switch,case,nhánh quy trình,NocoBase"
---

# Nhánh đa điều kiện <Badge>v2.0.0+</Badge>

## Giới thiệu

Tương tự câu lệnh `switch / case` hoặc `if / else if` trong ngôn ngữ lập trình. Hệ thống sẽ phán đoán từng cái một theo thứ tự dựa trên các điều kiện được cấu hình, một khi thỏa mãn một điều kiện nào đó là sẽ thực thi quy trình dưới nhánh tương ứng và bỏ qua việc phán đoán các điều kiện sau. Nếu tất cả các điều kiện đều không thỏa mãn thì sẽ thực thi nhánh "Ngược lại".

## Tạo Node

Trong giao diện cấu hình Workflow, bấm nút dấu cộng ("+") trong quy trình để thêm Node "Nhánh đa điều kiện":

![Tạo nhánh đa điều kiện](https://static-docs.nocobase.com/20251123222134.png)

## Quản lý nhánh

### Nhánh mặc định

Sau khi Node được tạo, mặc định sẽ chứa hai nhánh:

1. **Nhánh điều kiện**: có thể cấu hình điều kiện phán đoán cụ thể.
2. **Nhánh ngược lại**: khi tất cả các nhánh điều kiện đều không thỏa mãn thì vào nhánh này, không cần cấu hình điều kiện.

Bấm nút "Thêm nhánh" phía dưới Node để thêm nhiều nhánh điều kiện hơn.

![20251123222540](https://static-docs.nocobase.com/20251123222540.png)

### Thêm nhánh

Sau khi bấm "Thêm nhánh", nhánh mới sẽ được thêm trước nhánh "Ngược lại".

![20251123222805](https://static-docs.nocobase.com/20251123222805.png)

### Xóa nhánh

Khi tồn tại nhiều nhánh điều kiện, bấm icon thùng rác bên phải nhánh là có thể xóa nhánh đó. Nếu chỉ còn một nhánh điều kiện thì không thể xóa.

![20251123223127](https://static-docs.nocobase.com/20251123223127.png)

:::info{title=Mẹo}
Việc xóa nhánh sẽ đồng thời xóa tất cả các Node trong nhánh đó, vui lòng thận trọng.

"Ngược lại" là nhánh tích hợp sẵn, không thể xóa.
:::

## Cấu hình Node

### Cấu hình điều kiện

Bấm tên điều kiện ở đầu nhánh để chỉnh sửa nội dung điều kiện cụ thể:

![20251123223352](https://static-docs.nocobase.com/20251123223352.png)

#### Nhãn điều kiện

Hỗ trợ nhãn tùy chỉnh, sau khi điền sẽ được hiển thị làm tên của điều kiện trong sơ đồ quy trình. Nếu chưa cấu hình (hoặc để trống), mặc định sẽ hiển thị theo thứ tự là "Điều kiện 1", "Điều kiện 2"...

![20251123224209](https://static-docs.nocobase.com/20251123224209.png)

#### Engine tính toán

Hiện hỗ trợ ba engine:

- **Cơ bản**: thông qua so sánh logic đơn giản (như bằng, chứa...) và kết hợp "Và", "Hoặc" để rút ra kết quả phán đoán.
- **Math.js**: hỗ trợ tính giá trị biểu thức cú pháp [Math.js](https://mathjs.org/).
- **Formula.js**: hỗ trợ tính giá trị biểu thức cú pháp [Formula.js](https://formulajs.info/) (tương tự công thức Excel).

Cả ba chế độ đều hỗ trợ sử dụng biến ngữ cảnh quy trình làm tham số.

### Khi tất cả các điều kiện đều không thỏa mãn

Trong panel cấu hình Node, có thể đặt hành động tiếp theo khi tất cả các điều kiện đều không thỏa mãn:

![20251123224348](https://static-docs.nocobase.com/20251123224348.png)

* **Kết thúc Workflow với trạng thái thất bại (mặc định)**: đánh dấu trạng thái Workflow là thất bại và dừng quy trình.
* **Tiếp tục thực thi các Node tiếp theo**: sau khi hoàn tất việc thực thi Node hiện tại, tiếp tục thực thi các Node tiếp theo của Workflow.

:::info{title=Mẹo}
Bất kể chọn cách xử lý nào, khi tất cả các điều kiện đều không thỏa mãn, quy trình đều sẽ vào nhánh "Ngược lại" trước để thực thi các Node trong đó.
:::

## Bản ghi thực thi

Trong bản ghi thực thi của Workflow, Node nhánh đa điều kiện qua các màu sắc khác nhau để xác định kết quả phán đoán của từng điều kiện:

- **Xanh lá**: điều kiện thỏa mãn, vào nhánh đó để thực thi.
- **Đỏ**: điều kiện không thỏa mãn (hoặc tính toán bị lỗi), bỏ qua nhánh đó.
- **Xanh dương**: chưa thực thi phán đoán (do điều kiện trước đã thỏa mãn nên bỏ qua phán đoán sau).

![20251123225455](https://static-docs.nocobase.com/20251123225455.png)

Nếu do cấu hình sai dẫn đến tính toán điều kiện bất thường, ngoài việc hiển thị màu đỏ, khi rê chuột qua tên điều kiện sẽ hiển thị thông tin lỗi cụ thể:

![20251123231014](https://static-docs.nocobase.com/20251123231014.png)

Khi tính toán điều kiện gặp bất thường, Node nhánh đa điều kiện sẽ kết thúc với trạng thái "Lỗi" và không tiếp tục thực thi các Node tiếp theo.
