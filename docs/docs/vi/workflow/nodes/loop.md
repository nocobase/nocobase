---
pkg: '@nocobase/plugin-workflow-loop'
title: "Node Workflow - Vòng lặp"
description: "Node vòng lặp: tương tự for/while/forEach, lặp lại các thao tác theo số lần hoặc tập dữ liệu."
keywords: "workflow,vòng lặp,Loop,forEach,thực thi lặp,NocoBase"
---

# Vòng lặp

## Giới thiệu

Vòng lặp tương đương các cấu trúc cú pháp `for`/`while`/`forEach` trong ngôn ngữ lập trình, khi cần thực thi lặp lại các thao tác với một số lần nhất định hoặc nhằm vào một tập dữ liệu (mảng), có thể sử dụng Node vòng lặp.

## Cài đặt

Plugin tích hợp sẵn, không cần cài đặt.

## Tạo Node

Trong giao diện cấu hình Workflow, bấm nút dấu cộng ("+") trong quy trình để thêm Node "Vòng lặp":

![Tạo Node vòng lặp](https://static-docs.nocobase.com/b3c8061a66bfff037f4b9509ab0aad75.png)

Sau khi tạo Node vòng lặp sẽ sinh một nhánh bên trong vòng lặp, có thể thêm tùy ý nhiều Node trong nhánh, các Node này ngoài việc có thể sử dụng biến của ngữ cảnh quy trình, còn có thể sử dụng biến cục bộ của ngữ cảnh vòng lặp, ví dụ đối tượng dữ liệu của mỗi lượt lặp trong tập vòng lặp, hoặc chỉ số số lần lặp (chỉ số đếm từ `0`). Phạm vi của biến cục bộ chỉ giới hạn bên trong vòng lặp, nếu có nhiều lớp vòng lặp lồng nhau, có thể sử dụng biến cục bộ của vòng lặp cụ thể theo lớp.

## Cấu hình Node

![20241016135326](https://static-docs.nocobase.com/20241016135326.png)

### Đối tượng vòng lặp

Vòng lặp sẽ xử lý khác nhau dựa trên loại dữ liệu khác nhau của đối tượng vòng lặp:

1.  **Mảng**: trường hợp thường gặp nhất, thường có thể chọn biến của ngữ cảnh quy trình, ví dụ kết quả nhiều dòng dữ liệu của Node truy vấn hoặc dữ liệu quan hệ một - nhiều được preload. Nếu chọn mảng, Node vòng lặp sẽ duyệt qua từng phần tử trong mảng, mỗi lượt lặp sẽ gán phần tử hiện tại cho biến cục bộ của ngữ cảnh vòng lặp.

2.  **Số**: khi biến được chọn là một số, sẽ lấy số đó làm số lần lặp, giá trị số chỉ hỗ trợ số nguyên dương, số âm sẽ không vào vòng lặp, phần thập phân của số thập phân sẽ bị bỏ qua. Chỉ số số lần lặp trong biến cục bộ cũng chính là giá trị của đối tượng vòng lặp. Giá trị này bắt đầu từ **0**, ví dụ khi đối tượng vòng lặp là số 5, đối tượng và chỉ số trong mỗi lượt lặp lần lượt là: 0, 1, 2, 3, 4.

3.  **Chuỗi**: khi biến được chọn là một chuỗi, sẽ lấy độ dài của chuỗi đó làm số lần lặp, mỗi lần xử lý từng ký tự trong chuỗi theo chỉ số.

4.  **Khác**: các giá trị loại khác (bao gồm loại đối tượng) đều chỉ được dùng làm đối tượng vòng lặp xử lý một lần, cũng chỉ lặp một lần, thông thường tình huống này không cần sử dụng vòng lặp.

Ngoài việc chọn biến, đối với loại số và chuỗi cũng có thể trực tiếp nhập hằng số, ví dụ nhập `5` (loại số), Node vòng lặp sẽ lặp 5 lần, nhập `abc` (loại chuỗi), Node vòng lặp sẽ lặp 3 lần, lần lượt xử lý ba ký tự `a`, `b`, `c`. Trong công cụ chọn biến, chọn loại muốn sử dụng hằng số.

### Điều kiện vòng lặp

Từ phiên bản `v1.4.0-beta`, đã thêm các tùy chọn liên quan đến điều kiện vòng lặp, có thể bật điều kiện vòng lặp trong cấu hình Node.

**Điều kiện**

Tương tự cấu hình điều kiện trong Node điều kiện, có thể cấu hình kết hợp và có thể sử dụng các biến trong vòng lặp hiện tại như đối tượng vòng lặp, chỉ số vòng lặp...

**Thời điểm kiểm tra**

Tương tự `while` và `do/while` của ngôn ngữ lập trình, có thể chọn tính giá trị điều kiện được cấu hình trước mỗi lượt lặp hoặc sau mỗi lượt lặp. Tính giá trị điều kiện hậu trí có thể thực thi các Node khác trong thân vòng lặp một lượt trước rồi mới phán đoán điều kiện.

**Khi không thỏa mãn điều kiện**

Tương tự câu lệnh `break` và `continue` trong ngôn ngữ lập trình, có thể chọn thoát vòng lặp hoặc tiếp tục lượt lặp tiếp theo.

### Xử lý khi Node bên trong vòng lặp gặp lỗi

Từ phiên bản `v1.4.0-beta`, khi Node bên trong vòng lặp thực thi thất bại (không thỏa mãn cấu hình điều kiện, gặp lỗi...), có thể qua cấu hình quyết định hướng đi tiếp theo. Hỗ trợ ba cách xử lý:

* Thoát quy trình (`throw` trong lập trình)
* Thoát vòng lặp và tiếp tục quy trình (`break` trong lập trình)
* Tiếp tục đối tượng vòng lặp tiếp theo (`continue` trong lập trình)

Mặc định là "Thoát quy trình", có thể chọn sử dụng theo nhu cầu.

## Biến môi trường

### WORKFLOW_LOOP_LIMIT

Được dùng để vai trò vận hành giới hạn số lần lặp tối đa của Node vòng lặp, tránh vấn đề vòng lặp vô hạn do cấu hình sai. Mặc định không giới hạn, có thể qua việc cấu hình biến môi trường này để điều chỉnh giới hạn.

```ini
# Giới hạn tối đa lặp 100 lần
WORKFLOW_LOOP_LIMIT=100
```

Nếu đã đặt giá trị giới hạn, khi Node vòng lặp thực thi nếu vượt quá số lần này, sẽ trực tiếp báo lỗi và thoát quy trình. Và trong kết quả Node sẽ chứa thông tin `exceeded`, giá trị là true.

## Ví dụ

Ví dụ khi đặt đơn hàng, cần kiểm tra tồn kho cho từng sản phẩm trong đơn hàng, nếu tồn kho đủ thì trừ tồn kho, ngược lại sản phẩm trong chi tiết đơn hàng được cập nhật thành không hợp lệ.

1.  Tạo ba bảng, bảng sản phẩm <-(1:m)-- bảng chi tiết đơn hàng --(m:1)-> bảng đơn hàng, mô hình dữ liệu như sau:

    | Tên trường     | Loại trường       |
    | ------------ | -------------- |
    | Chi tiết sản phẩm đơn hàng | Nhiều - một (Chi tiết) |
    | Tổng giá đơn hàng     | Số           |

    | Tên trường | Loại trường       |
    | -------- | -------------- |
    | Sản phẩm     | Một - nhiều (Sản phẩm) |
    | Số lượng     | Số           |

    | Tên trường | Loại trường |
    | -------- | -------- |
    | Tên sản phẩm | Văn bản một dòng |
    | Giá     | Số     |
    | Tồn kho     | Số nguyên     |

2.  Tạo Workflow, Trigger chọn "Sự kiện bảng dữ liệu", chọn kích hoạt "Khi thêm dữ liệu" của bảng "Đơn hàng" và cần cấu hình preload dữ liệu quan hệ của bảng "Chi tiết đơn hàng" và bảng sản phẩm dưới chi tiết:

    ![Node vòng lặp_ví dụ_cấu hình Trigger](https://static-docs.nocobase.com/0086601c2fc0e17a64d046a4c86b49b7.png)

3.  Tạo Node vòng lặp, chọn đối tượng vòng lặp là "Dữ liệu kích hoạt / Chi tiết đơn hàng", tức nhằm vào từng dữ liệu trong bảng chi tiết đơn hàng:

    ![Node vòng lặp_ví dụ_cấu hình Node vòng lặp](https://static-docs.nocobase.com/2507becc32db5a9a0641c198605a20da.png)

4.  Bên trong Node vòng lặp tạo một Node "Phán đoán điều kiện" để phán đoán tồn kho sản phẩm có đủ không:

    ![Node vòng lặp_ví dụ_cấu hình Node phán đoán điều kiện](https://static-docs.nocobase.com/a6d08d15786841e1a3512b38e4629852.png)

5.  Nếu đủ thì trong nhánh "Đúng" tạo một "Node tính toán" và một Node "Cập nhật dữ liệu", cập nhật tồn kho đã trừ tính toán xong vào bản ghi sản phẩm tương ứng:

    ![Node vòng lặp_ví dụ_cấu hình Node tính toán](https://static-docs.nocobase.com/8df3604c71f8f8705b1552d3ebfe3b50.png)

    ![Node vòng lặp_ví dụ_cấu hình Node cập nhật tồn kho](https://static-docs.nocobase.com/2d84baa9b3b01bd85fccda9eec992378.png)

6.  Ngược lại trong nhánh "Sai" tạo một Node "Cập nhật dữ liệu" để cập nhật trạng thái chi tiết đơn hàng thành "Không hợp lệ":

    ![Node vòng lặp_ví dụ_cấu hình Node cập nhật chi tiết đơn hàng](https://static-docs.nocobase.com/4996613090c254c69a1d80f3b3a7fae2.png)

Cấu trúc tổng thể của quy trình như hình:

![Node vòng lặp_ví dụ_cấu trúc quy trình](https://static-docs.nocobase.com/6f59ef246c1f19976344a7624c4c4151.png)

Sau khi cấu hình xong và kích hoạt quy trình này, khi tạo đơn hàng mới, sẽ tự động kiểm tra tồn kho sản phẩm trong chi tiết đơn hàng, nếu tồn kho đủ thì trừ tồn kho, ngược lại sản phẩm trong chi tiết đơn hàng được cập nhật thành không hợp lệ (để tính tổng giá đơn hàng hợp lệ).
