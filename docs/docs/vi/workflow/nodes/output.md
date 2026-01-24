---
pkg: '@nocobase/plugin-workflow-subflow'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Đầu ra của luồng công việc

## Giới thiệu

Nút "Đầu ra của luồng công việc" được sử dụng trong một luồng công việc được gọi để định nghĩa giá trị đầu ra của luồng công việc đó. Khi một luồng công việc được gọi bởi một luồng công việc khác, bạn có thể sử dụng nút "Đầu ra của luồng công việc" để truyền giá trị trở lại cho bên gọi.

## Tạo nút

Trong luồng công việc được gọi, hãy thêm một nút "Đầu ra của luồng công việc":

![20241231002033](https://static-docs.nocobase.com/20241231002033.png)

## Cấu hình nút

### Giá trị đầu ra

Nhập hoặc chọn một biến làm giá trị đầu ra. Giá trị đầu ra có thể thuộc bất kỳ kiểu nào, chẳng hạn như một hằng số (chuỗi, số, giá trị boolean, ngày tháng hoặc JSON tùy chỉnh), hoặc một biến khác từ luồng công việc.

![20241231003059](https://static-docs.nocobase.com/20241231003059.png)

:::info{title=Mẹo}
Nếu bạn thêm nhiều nút "Đầu ra của luồng công việc" vào một luồng công việc được gọi, thì khi luồng công việc đó được gọi, giá trị của nút "Đầu ra của luồng công việc" được thực thi cuối cùng sẽ được xuất ra.
:::