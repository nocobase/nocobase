---
title: "Node Workflow - Phán đoán điều kiện"
description: "Node phán đoán điều kiện: tương tự câu lệnh if, quyết định hướng đi của quy trình dựa trên kết quả điều kiện, hỗ trợ 'Đúng' thì tiếp tục / 'Đúng' và 'Sai' tiếp tục riêng."
keywords: "workflow,phán đoán điều kiện,Condition,nhánh quy trình,phán đoán if,NocoBase"
---

# Phán đoán điều kiện

## Giới thiệu

Tương tự câu lệnh `if` trong ngôn ngữ lập trình, dựa trên kết quả của việc phán đoán điều kiện được cấu hình để quyết định hướng đi của quy trình tiếp theo.

## Tạo Node

Phán đoán điều kiện có hai chế độ là "'Đúng' thì tiếp tục" và "'Đúng' và 'Sai' tiếp tục riêng", khi tạo Node cần chọn một trong các chế độ và sau đó không thể sửa trong cấu hình Node.

![Phán đoán điều kiện_chọn chế độ](https://static-docs.nocobase.com/3de27308c1179523d8606c66bf3a5fb4.png)

Ở chế độ "'Đúng' thì tiếp tục", khi kết quả phán đoán điều kiện là "Đúng" thì quy trình sẽ tiếp tục thực thi các Node tiếp theo, ngược lại quy trình sẽ kết thúc và thoát sớm với trạng thái thất bại.

![Chế độ 'Đúng' thì tiếp tục](https://static-docs.nocobase.com/0f6ae1afe61d501f8eb1f6dedb3d4ad7.png)

Chế độ này phù hợp với tình huống nếu không thỏa mãn điều kiện thì quy trình không tiếp tục, ví dụ nút gửi của form được liên kết "Sự kiện trước Action" để gửi đơn hàng, nhưng trong trường hợp tồn kho sản phẩm tương ứng của đơn hàng không đủ thì không tiếp tục sinh đơn hàng mà thoát thất bại.

Ở chế độ "'Đúng' và 'Sai' tiếp tục riêng", Node điều kiện sau đó sẽ sinh ra hai nhánh quy trình tương ứng với khi kết quả phán đoán điều kiện là "Đúng" và "Sai", hai nhánh quy trình có thể cấu hình các Node tiếp theo riêng, sau khi nhánh nào đó thực thi xong sẽ tự động hợp lại nhánh trên của Node điều kiện và tiếp tục thực thi các Node sau đó.

![Chế độ 'Đúng' và 'Sai' tiếp tục riêng](https://static-docs.nocobase.com/974a1fcd8603629b64ffce6c55d59282.png)

Chế độ này phù hợp với tình huống cần thực thi các thao tác khác nhau khi thỏa mãn và không thỏa mãn điều kiện, ví dụ truy vấn xem một dữ liệu nào đó có tồn tại không, khi không tồn tại thì thêm, khi tồn tại thì cập nhật.

## Cấu hình Node

### Engine tính toán

Hiện hỗ trợ ba engine:

- **Cơ bản**: thông qua phép tính toán hai ngôi đơn giản và nhóm "Và", "Hoặc" để có được kết quả logic.
- **Math.js**: tính giá trị biểu thức được engine [Math.js](https://mathjs.org/) hỗ trợ để có được kết quả logic.
- **Formula.js**: tính giá trị biểu thức được engine [Formula.js](https://formulajs.info/) hỗ trợ để có được kết quả logic.

Trong cả ba phép tính toán đều có thể sử dụng biến của ngữ cảnh quy trình làm tham số.
