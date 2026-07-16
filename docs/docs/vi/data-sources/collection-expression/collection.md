---
title: "Bảng biểu thức"
description: "Bảng biểu thức được sử dụng cho phép tính biểu thức động trong workflow, lưu trữ quy tắc tính toán và công thức, hỗ trợ các Field từ các mô hình dữ liệu khác nhau làm biến, sử dụng cùng với dữ liệu nghiệp vụ."
keywords: "Bảng biểu thức,biểu thức động,biểu thức workflow,quy tắc tính toán,công thức,NocoBase"
---

# Bảng biểu thức

## Tạo bảng mẫu "Biểu thức"

Trước khi sử dụng node tính toán biểu thức động trong workflow, bạn cần tạo một bảng mẫu "Biểu thức" trong công cụ quản lý Collection để lưu trữ các biểu thức khác nhau:

![Tạo bảng mẫu biểu thức](https://static-docs.nocobase.com/33afe3369a1ea7943f12a04d9d4443ce.png)

## Nhập dữ liệu biểu thức

Sau đó tạo một block bảng để thêm một số dữ liệu công thức vào bảng mẫu này. Mỗi hàng dữ liệu trong bảng mẫu "Biểu thức" có thể được hiểu là một quy tắc tính toán cho mô hình dữ liệu của một bảng cụ thể. Mỗi hàng dữ liệu công thức có thể sử dụng giá trị Field từ các mô hình dữ liệu của các Collection khác nhau làm biến, viết các biểu thức khác nhau làm quy tắc tính toán, và tất nhiên, cũng có thể sử dụng các engine tính toán khác nhau.

![Nhập dữ liệu biểu thức](https://static-docs.nocobase.com/761047f8daabacccbc6a924a73564093.png)

:::info{title=Mẹo}
Sau khi tạo công thức, bạn cần liên kết dữ liệu nghiệp vụ với công thức. Việc liên kết trực tiếp mỗi hàng dữ liệu nghiệp vụ với hàng dữ liệu công thức sẽ khá rườm rà, vì vậy thông thường chúng ta sẽ sử dụng bảng metadata kiểu phân loại để liên kết ManyToOne (hoặc OneToOne) với bảng công thức, sau đó liên kết dữ liệu nghiệp vụ với metadata phân loại theo kiểu ManyToOne. Khi tạo dữ liệu nghiệp vụ chỉ cần chỉ định metadata phân loại cụ thể, có thể tìm thấy dữ liệu công thức tương ứng để sử dụng thông qua đường dẫn liên kết này trong các lần sử dụng sau.
:::

## Tải dữ liệu tương ứng trong quy trình

Lấy ví dụ về sự kiện Collection để tạo một workflow, kích hoạt khi có đơn hàng được tạo và cần tải trước dữ liệu sản phẩm liên quan đến đơn hàng cũng như dữ liệu biểu thức liên quan đến sản phẩm:

![Cấu hình trigger sự kiện Collection](https://static-docs.nocobase.com/f181f75b10007afd5de068f3458d2e04.png)
