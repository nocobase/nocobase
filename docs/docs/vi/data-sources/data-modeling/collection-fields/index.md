:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Trường của bộ sưu tập

## Các kiểu Interface của trường

NocoBase phân loại các trường thành các danh mục sau đây từ góc độ Interface:

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

## Các kiểu dữ liệu của trường

Mỗi Interface của trường đều có một kiểu dữ liệu mặc định. Ví dụ, đối với các trường có Interface là Số (Number), kiểu dữ liệu mặc định là `double`, nhưng cũng có thể là `float`, `decimal`, v.v. Các kiểu dữ liệu hiện được hỗ trợ bao gồm:

![20240512103733](https://static-docs.nocobase.com/20240512103733.png)

## Ánh xạ kiểu trường

Quy trình thêm trường mới vào cơ sở dữ liệu chính như sau:

1. Chọn kiểu Interface
2. Cấu hình kiểu dữ liệu tùy chọn cho Interface hiện tại

![20240512172416](https://static-docs.nocobase.com/20240512172416.png)

Quy trình ánh xạ trường từ các nguồn dữ liệu bên ngoài là:

1. Tự động ánh xạ kiểu dữ liệu tương ứng (Field type) và kiểu UI (Field Interface) dựa trên kiểu trường của cơ sở dữ liệu bên ngoài.
2. Điều chỉnh thành kiểu dữ liệu và kiểu Interface phù hợp hơn khi cần.

![20240512172759](https://static-docs.nocobase.com/20240512172759.png)