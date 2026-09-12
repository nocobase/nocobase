---
title: "Workflow - Sử dụng biến"
description: "Sử dụng biến: ngữ cảnh kích hoạt, dữ liệu Node phía trên, biến cục bộ, biến hệ thống, kết nối quy trình."
keywords: "workflow,biến,Variable,ngữ cảnh kích hoạt,biến quy trình,NocoBase"
---

# Sử dụng biến

## Khái niệm cốt lõi

Giống như biến trong các ngôn ngữ lập trình, **biến** trong Workflow là công cụ quan trọng để kết nối và tổ chức quy trình.

Khi mỗi Node được thực thi sau khi Workflow được kích hoạt, một số mục cấu hình có thể chọn sử dụng biến, nguồn của biến chính là dữ liệu của các Node phía trên Node đó, bao gồm các loại sau:

- Dữ liệu ngữ cảnh kích hoạt: trong các trường hợp như Trigger thao tác, Trigger bảng dữ liệu..., đối tượng dữ liệu một dòng có thể được dùng làm biến cho tất cả các Node, tùy thuộc vào cách triển khai của từng Trigger.
- Dữ liệu Node phía trên: dữ liệu kết quả của các Node đã hoàn tất trước đó khi quy trình tiến đến Node bất kỳ.
- Biến cục bộ: khi Node nằm trong một số cấu trúc nhánh đặc biệt, có thể sử dụng biến cục bộ riêng có trong nhánh tương ứng, ví dụ trong cấu trúc vòng lặp có thể sử dụng đối tượng dữ liệu của mỗi lượt lặp.
- Biến hệ thống: một số tham số hệ thống tích hợp sẵn, như thời gian hiện tại...

Chúng ta đã sử dụng tính năng biến nhiều lần trong [Bắt đầu nhanh](../getting-started.md), ví dụ trong Node tính toán, chúng ta có thể sử dụng biến để tham chiếu dữ liệu ngữ cảnh kích hoạt nhằm thực hiện tính toán:

![Node tính toán sử dụng hàm và biến](https://static-docs.nocobase.com/837e4851a4c70a1932542caadef3431b.png)

Trong Node cập nhật, sử dụng dữ liệu ngữ cảnh kích hoạt làm biến điều kiện lọc và tham chiếu kết quả của Node tính toán làm biến giá trị trường dữ liệu cần cập nhật:

![Biến của Node cập nhật dữ liệu](https://static-docs.nocobase.com/2e147c93643e7ebc709b9b7ab4f3af8c.png)

## Cấu trúc dữ liệu

Bên trong biến là một cấu trúc JSON, thường có thể truy cập một phần cụ thể của dữ liệu theo đường dẫn JSON. Vì nhiều biến dựa trên cấu trúc bảng dữ liệu của NocoBase, dữ liệu quan hệ sẽ trở thành thuộc tính của đối tượng và tạo thành cấu trúc dạng cây phân cấp, ví dụ chúng ta có thể chọn giá trị của một trường nào đó của dữ liệu quan hệ trong dữ liệu được truy vấn. Ngoài ra khi dữ liệu quan hệ là cấu trúc một - nhiều, biến có thể là một mảng.

Khi chọn biến, đa số trường hợp cần chọn đến thuộc tính giá trị ở lớp cuối cùng, thường là kiểu dữ liệu đơn giản như số, chuỗi... Nhưng khi trong các lớp biến có mảng, thuộc tính ở cuối cũng sẽ được ánh xạ thành một mảng, chỉ khi Node tương ứng hỗ trợ mảng thì mới có thể xử lý đúng dữ liệu mảng. Ví dụ trong Node tính toán, một số engine tính toán có hàm xử lý mảng riêng, hoặc trong Node vòng lặp, đối tượng vòng lặp cũng có thể trực tiếp chọn một mảng.

Ví dụ, khi một Node truy vấn truy vấn ra nhiều dòng dữ liệu, kết quả Node sẽ là một mảng chứa nhiều dòng dữ liệu cùng cấu trúc:

```json
[
  {
    "id": 1,
    "title": "Tiêu đề 1"
  },
  {
    "id": 2,
    "title": "Tiêu đề 2"
  }
]
```

Nhưng khi sử dụng làm biến trong các Node phía sau, nếu biến được chọn có dạng `Dữ liệu Node/Node truy vấn/Tiêu đề`, sẽ thu được một mảng chứa giá trị trường tương ứng sau khi được ánh xạ:

```json
["Tiêu đề 1", "Tiêu đề 2"]
```

Nếu là mảng nhiều chiều (như trường quan hệ nhiều - nhiều), sẽ thu được mảng một chiều của trường tương ứng đã được làm phẳng.

## Biến hệ thống tích hợp sẵn

### Thời gian hệ thống

Tùy theo Node được thực thi đến, lấy thời gian hệ thống tại thời điểm thực thi đó, múi giờ của thời gian này là múi giờ được thiết lập trên server.

### Tham số khoảng thời gian

Có thể sử dụng khi cấu hình điều kiện lọc trường ngày tháng trong các Node truy vấn, cập nhật và xóa. Chỉ hỗ trợ khi sử dụng phép so sánh "bằng", các điểm thời gian bắt đầu và kết thúc của khoảng thời gian đều dựa trên múi giờ được thiết lập trên server.

![Tham số khoảng thời gian](https://static-docs.nocobase.com/20240817175354.png)
