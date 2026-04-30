---
pkg: '@nocobase/plugin-workflow-date-calculation'
title: "Node Workflow - Tính toán ngày tháng"
description: "Node tính toán ngày tháng: chín hàm tính toán như cộng/trừ khoảng thời gian, định dạng, chuyển đổi đơn vị, hỗ trợ kết nối pipeline."
keywords: "workflow,tính toán ngày tháng,Date,định dạng thời gian,kết nối pipeline,NocoBase"
---

# Tính toán ngày tháng

## Giới thiệu

Node tính toán ngày tháng cung cấp chín hàm tính toán bao gồm cộng khoảng thời gian, trừ khoảng thời gian, đầu ra định dạng chuỗi thời gian, chuyển đổi đơn vị thời lượng..., mỗi hàm có loại giá trị đầu vào và đầu ra cụ thể, đồng thời còn có thể nhận kết quả của Node khác làm biến tham số và sử dụng cách pipeline tính toán để kết nối kết quả tính toán của các hàm được cấu hình lại với nhau, cuối cùng có được một đầu ra như mong đợi.

## Tạo Node

Trong giao diện cấu hình Workflow, bấm nút dấu cộng ("+") trong quy trình để thêm Node "Tính toán thời gian":

![Node tính toán ngày tháng_tạo Node](https://static-docs.nocobase.com/[image].png)

## Cấu hình Node

![Node tính toán ngày tháng_cấu hình Node](https://static-docs.nocobase.com/20240817184423.png)

### Giá trị đầu vào

Giá trị đầu vào có thể chọn biến hoặc hằng số ngày tháng, biến có thể là dữ liệu kích hoạt Workflow này hoặc kết quả của Node phía trên trong Workflow này, hằng số có thể chọn ngày bất kỳ.

### Loại giá trị đầu vào

Đại diện cho loại giá trị đầu vào, có hai giá trị có thể chọn.

* Loại ngày: chỉ loại mà giá trị đầu vào cuối cùng có thể chuyển đổi thành thời gian ngày tháng, như timestamp loại số hoặc chuỗi đại diện cho thời gian.
* Loại số: vì loại giá trị đầu vào sẽ ảnh hưởng đến việc chọn các bước tính toán thời gian phía dưới nên cần chọn loại giá trị đầu vào đúng.

### Bước tính toán

Mỗi bước tính toán bao gồm một hàm tính toán và cấu hình tham số của nó, đồng thời sử dụng thiết kế pipeline, kết quả tính toán của hàm trước sẽ được dùng làm giá trị đầu vào của hàm sau để tiếp tục tham gia tính toán, qua cách này có thể hoàn thành một loạt phép tính và chuyển đổi thời gian.

Sau mỗi bước tính toán, loại đầu ra cũng cố định và sẽ ảnh hưởng đến các hàm có thể sử dụng cho bước tính toán tiếp theo, loại khớp thì mới có thể tiếp tục tính toán. Ngược lại kết quả của một bước sẽ được dùng làm kết quả đầu ra của Node cuối cùng.

## Hàm tính toán

### Cộng một khoảng thời gian

- Loại giá trị đầu vào nhận: ngày
- Tham số
  - Số lượng cộng thêm, có thể điền số hoặc chọn biến tích hợp sẵn của Node.
  - Đơn vị thời gian.
- Loại giá trị đầu ra: ngày
- Ví dụ: giá trị đầu vào là `2024-7-15 00:00:00`, số lượng là `1`, đơn vị là "ngày" thì kết quả tính toán là `2024-7-16 00:00:00`.

### Trừ một khoảng thời gian

- Loại giá trị đầu vào nhận: ngày
- Tham số
  - Số lượng trừ đi, có thể điền số hoặc chọn biến tích hợp sẵn của Node.
  - Đơn vị thời gian.
- Loại giá trị đầu ra: ngày
- Ví dụ: giá trị đầu vào là `2024-7-15 00:00:00`, số lượng là `1`, đơn vị là "ngày" thì kết quả tính toán là `2024-7-14 00:00:00`.

### Tính chênh lệch với một thời gian khác

- Loại giá trị đầu vào nhận: ngày
- Tham số
  - Ngày cần tính chênh lệch, có thể chọn hằng số ngày hoặc chọn biến trong ngữ cảnh Workflow.
  - Đơn vị thời gian.
  - Có lấy giá trị tuyệt đối không.
  - Thao tác làm tròn: có thể chọn giữ số thập phân, làm tròn, làm tròn lên và làm tròn xuống.
- Loại giá trị đầu ra: số
- Ví dụ: giá trị đầu vào là `2024-7-15 00:00:00`, đối tượng so sánh là `2024-7-16 06:00:00`, đơn vị là "ngày", không lấy giá trị tuyệt đối, giữ số thập phân thì kết quả tính toán là `-1.25`.

:::info{title=Mẹo}
Khi giá trị tuyệt đối và làm tròn được cấu hình cùng lúc, sẽ lấy giá trị tuyệt đối trước rồi làm tròn.
:::

### Lấy giá trị thời gian theo đơn vị cụ thể

- Loại giá trị đầu vào nhận: ngày
- Tham số
  - Đơn vị thời gian.
- Loại giá trị đầu ra: số
- Ví dụ: giá trị đầu vào là `2024-7-15 00:00:00`, đơn vị là "ngày" thì kết quả tính toán là `15`.

### Đặt ngày thành thời gian bắt đầu của đơn vị cụ thể

- Loại giá trị đầu vào nhận: ngày
- Tham số
  - Đơn vị thời gian.
- Loại giá trị đầu ra: ngày
- Ví dụ: giá trị đầu vào là `2024-7-15 14:26:30`, đơn vị là "ngày". Thì kết quả tính toán là `2024-7-15 00:00:00`

### Đặt ngày thành thời gian kết thúc của đơn vị cụ thể

- Loại giá trị đầu vào nhận: ngày
- Tham số
  - Đơn vị thời gian.
- Loại giá trị đầu ra: ngày
- Ví dụ: giá trị đầu vào là `2024-7-15 14:26:30`, đơn vị là "ngày". Thì kết quả tính toán là `2024-7-15 23:59:59`

### Phán đoán năm nhuận

- Loại giá trị đầu vào nhận: ngày
- Tham số
  - Không có tham số
- Loại giá trị đầu ra: boolean
- Ví dụ: giá trị đầu vào là `2024-7-15 14:26:30` thì kết quả tính toán là `true`.

### Định dạng thành chuỗi

- Loại giá trị đầu vào nhận: ngày
- Tham số
  - Định dạng, tham khảo [Day.js: Format](https://day.js.org/docs/zh-CN/display/format)
- Loại giá trị đầu ra: chuỗi
- Ví dụ: giá trị đầu vào là `2024-7-15 14:26:30`, định dạng là `the time is YYYY/MM/DD HH:mm:ss` thì kết quả tính toán là `the time is 2024/07/15 14:26:30`.

### Chuyển đổi đơn vị

- Loại giá trị đầu vào nhận: số
- Tham số
  - Đơn vị thời gian trước khi chuyển đổi.
  - Đơn vị thời gian sau khi chuyển đổi.
  - Thao tác làm tròn, có thể chọn giữ số thập phân, làm tròn, làm tròn lên và làm tròn xuống.
- Loại giá trị đầu ra: số
- Ví dụ: giá trị đầu vào là `2`, đơn vị trước khi chuyển đổi là "tuần", đơn vị sau khi chuyển đổi là "ngày", không giữ số thập phân thì kết quả tính toán là `14`.

## Ví dụ

![Node tính toán ngày tháng_ví dụ](https://static-docs.nocobase.com/20240817184137.png)

Giả sử có hoạt động khuyến mãi, chúng ta muốn khi mỗi sản phẩm được tạo có thể thêm một thời gian kết thúc hoạt động khuyến mãi vào trường của sản phẩm, thời gian kết thúc này là 23:59:59 tối của ngày cuối cùng trong tuần tiếp theo của thời gian tạo sản phẩm, vì vậy chúng ta có thể tạo hai hàm thời gian và để chúng chạy theo cách pipeline:

- Tính ra thời gian của tuần tiếp theo
- Đặt lại kết quả thu được thành 23:59:59 ngày cuối cùng của tuần đó

Như vậy sẽ có được giá trị thời gian như mong đợi và truyền vào Node tiếp theo, ví dụ Node sửa bảng dữ liệu, thêm thời gian kết thúc hoạt động khuyến mãi vào bảng dữ liệu.
