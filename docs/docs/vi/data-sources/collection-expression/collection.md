---
title: "Bảng biểu thức"
description: "Bảng biểu thức được dùng để thực hiện các phép tính biểu thức động trong quy trình làm việc, lưu trữ các quy tắc tính toán và công thức, hỗ trợ sử dụng các trường của nhiều mô hình dữ liệu khác nhau làm biến và liên kết với dữ liệu nghiệp vụ."
keywords: "Bảng biểu thức,biểu thức động,biểu thức quy trình làm việc,quy tắc tính toán,công thức,NocoBase"
---

# Bảng biểu thức

## Tạo bảng mẫu "Biểu thức"

Trước khi sử dụng nút tính toán biểu thức động trong quy trình làm việc, cần tạo một bảng mẫu "Biểu thức" trong công cụ quản lý bảng dữ liệu để lưu trữ các biểu thức khác nhau:

![Tạo bảng mẫu biểu thức](https://static-docs.nocobase.com/33afe3369a1ea7943f12a04d9d4443ce.png)

## Nhập dữ liệu biểu thức

Sau đó, tạo một khối bảng để thêm một vài dữ liệu công thức vào bảng mẫu này. Mỗi hàng dữ liệu trong bảng mẫu "Biểu thức" có thể được hiểu là một quy tắc tính toán dành cho một mô hình dữ liệu bảng cụ thể. Mỗi hàng dữ liệu công thức có thể sử dụng các giá trị trường trong mô hình dữ liệu của những bảng dữ liệu khác nhau làm biến, viết các biểu thức khác nhau làm quy tắc tính toán và tất nhiên cũng có thể sử dụng các công cụ tính toán khác nhau.

![Nhập dữ liệu biểu thức](https://static-docs.nocobase.com/761047f8daabacccbc6a924a73564093.png)

:::info{title=Gợi ý}
Sau khi tạo công thức, bạn vẫn cần liên kết dữ liệu nghiệp vụ với công thức. Việc liên kết trực tiếp từng hàng dữ liệu nghiệp vụ với một hàng dữ liệu công thức sẽ khá rườm rà, vì vậy thông thường chúng ta sẽ sử dụng một bảng siêu dữ liệu có chức năng phân loại tương tự để liên kết nhiều-một (hoặc một-một) với bảng công thức, sau đó liên kết dữ liệu nghiệp vụ với siêu dữ liệu phân loại theo quan hệ nhiều-một. Như vậy, khi tạo dữ liệu nghiệp vụ, chỉ cần chỉ định siêu dữ liệu phân loại cụ thể là có thể tìm thấy và sử dụng dữ liệu công thức tương ứng thông qua đường dẫn liên kết này trong các bước tiếp theo.
:::

## Tải dữ liệu tương ứng trong quy trình

Lấy sự kiện bảng dữ liệu làm ví dụ, hãy tạo một quy trình làm việc được kích hoạt khi đơn hàng được tạo, đồng thời cần tải trước dữ liệu sản phẩm liên kết với đơn hàng và dữ liệu biểu thức liên quan đến sản phẩm:

![Cấu hình bộ kích hoạt sự kiện bảng dữ liệu](https://static-docs.nocobase.com/f181f75b10007afd5de068f3458d2e04.png)
