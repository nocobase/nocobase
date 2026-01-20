---
pkg: "@nocobase/plugin-data-source-main"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Bộ sưu tập kế thừa

## Giới thiệu

:::warning
Chỉ được hỗ trợ khi cơ sở dữ liệu chính là PostgreSQL.
:::

Bạn có thể tạo một bộ sưu tập cha và phái sinh các bộ sưu tập con từ bộ sưu tập cha đó. Bộ sưu tập con sẽ kế thừa cấu trúc của bộ sưu tập cha, đồng thời có thể định nghĩa các cột riêng của mình. Mô hình thiết kế này giúp tổ chức và quản lý dữ liệu có cấu trúc tương tự nhưng có thể có một số khác biệt.

Dưới đây là một số đặc điểm chung của bộ sưu tập kế thừa:

- Bộ sưu tập cha: Bộ sưu tập cha chứa các cột và dữ liệu chung, định nghĩa cấu trúc cơ bản của toàn bộ hệ thống phân cấp kế thừa.
- Bộ sưu tập con: Bộ sưu tập con kế thừa cấu trúc của bộ sưu tập cha, nhưng cũng có thể định nghĩa các cột riêng của nó. Điều này cho phép mỗi bộ sưu tập con có các thuộc tính chung của bộ sưu tập cha, đồng thời chứa các thuộc tính dành riêng cho bộ sưu tập con.
- Truy vấn: Khi truy vấn, bạn có thể chọn truy vấn toàn bộ hệ thống phân cấp kế thừa, hoặc chỉ truy vấn bộ sưu tập cha hoặc một bộ sưu tập con cụ thể. Điều này cho phép truy xuất và xử lý các cấp độ dữ liệu khác nhau tùy theo nhu cầu.
- Quan hệ kế thừa: Một quan hệ kế thừa được thiết lập giữa bộ sưu tập cha và bộ sưu tập con, có nghĩa là cấu trúc của bộ sưu tập cha có thể được sử dụng để định nghĩa các thuộc tính nhất quán, đồng thời cho phép bộ sưu tập con mở rộng hoặc ghi đè các thuộc tính này.

Mô hình thiết kế này giúp giảm sự dư thừa dữ liệu, đơn giản hóa mô hình cơ sở dữ liệu và giúp dữ liệu dễ bảo trì hơn. Tuy nhiên, cần sử dụng cẩn thận vì các bộ sưu tập kế thừa có thể làm tăng độ phức tạp của các truy vấn, đặc biệt khi xử lý toàn bộ hệ thống phân cấp kế thừa. Các hệ thống cơ sở dữ liệu hỗ trợ bộ sưu tập kế thừa thường cung cấp cú pháp và công cụ cụ thể để quản lý và truy vấn các cấu trúc bộ sưu tập này.

## Hướng dẫn sử dụng

![20240324085907](https://static-docs.nocobase.com/20240324085907.png)