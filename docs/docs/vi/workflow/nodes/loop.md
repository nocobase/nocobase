---
pkg: '@nocobase/plugin-workflow-loop'
---

:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::



# Vòng lặp

## Giới thiệu

Vòng lặp tương tự các cấu trúc cú pháp như `for`/`while`/`forEach` trong các ngôn ngữ lập trình. Khi bạn cần lặp lại một số thao tác một số lần nhất định hoặc trên một bộ sưu tập dữ liệu (mảng), bạn có thể sử dụng nút vòng lặp.

## Cài đặt

Đây là một plugin tích hợp sẵn, không cần cài đặt.

## Tạo nút

Trong giao diện cấu hình luồng công việc, nhấp vào nút dấu cộng (“+”) trong luồng để thêm nút "Vòng lặp":

![Tạo nút Vòng lặp](https://static-docs.nocobase.com/b3c8061a66bfff037f4b9509ab0aad75.png)

Sau khi tạo nút vòng lặp, một nhánh bên trong vòng lặp sẽ được tạo ra. Bạn có thể thêm bất kỳ số lượng nút nào vào nhánh này. Các nút này không chỉ có thể sử dụng các biến từ ngữ cảnh luồng công việc mà còn có thể sử dụng các biến cục bộ từ ngữ cảnh vòng lặp, ví dụ như đối tượng dữ liệu được lặp trong bộ sưu tập vòng lặp, hoặc chỉ mục của số lần lặp (chỉ mục bắt đầu từ `0`). Phạm vi của các biến cục bộ chỉ giới hạn trong vòng lặp. Nếu có nhiều vòng lặp lồng nhau, bạn có thể sử dụng các biến cục bộ của từng vòng lặp cụ thể theo từng cấp.

## Cấu hình nút

![20241016135326](https://static-docs.nocobase.com/20241016135326.png)

### Đối tượng vòng lặp

Vòng lặp sẽ xử lý các kiểu dữ liệu khác nhau của đối tượng vòng lặp theo những cách khác nhau:

1.  **Mảng**: Đây là trường hợp phổ biến nhất. Thông thường, bạn có thể chọn một biến từ ngữ cảnh luồng công việc, chẳng hạn như kết quả nhiều bản ghi từ nút truy vấn, hoặc dữ liệu quan hệ một-nhiều đã được tải trước. Nếu chọn một mảng, nút vòng lặp sẽ lặp qua từng phần tử trong mảng, mỗi lần lặp sẽ gán phần tử hiện tại cho một biến cục bộ trong ngữ cảnh vòng lặp.

2.  **Số**: Khi biến được chọn là một số, nó sẽ được sử dụng làm số lần lặp. Giá trị số chỉ hỗ trợ số nguyên dương; số âm sẽ không vào vòng lặp, và phần thập phân của số thực sẽ bị bỏ qua. Chỉ mục của số lần lặp trong biến cục bộ cũng chính là giá trị của đối tượng vòng lặp. Giá trị này bắt đầu từ **0**. Ví dụ, nếu đối tượng vòng lặp là số 5, đối tượng và chỉ mục trong mỗi lần lặp sẽ lần lượt là: 0, 1, 2, 3, 4.

3.  **Chuỗi**: Khi biến được chọn là một chuỗi, độ dài của chuỗi sẽ được sử dụng làm số lần lặp, xử lý từng ký tự trong chuỗi theo chỉ mục.

4.  **Khác**: Các kiểu giá trị khác (bao gồm cả kiểu đối tượng) chỉ được coi là đối tượng vòng lặp xử lý một lần, và chỉ lặp một lần. Thông thường, trường hợp này không cần sử dụng vòng lặp.

Ngoài việc chọn biến, bạn cũng có thể nhập trực tiếp các hằng số cho kiểu số và chuỗi. Ví dụ, nhập `5` (kiểu số), nút vòng lặp sẽ lặp 5 lần. Nhập `abc` (kiểu chuỗi), nút vòng lặp sẽ lặp 3 lần, xử lý lần lượt ba ký tự `a`, `b`, `c`. Trong công cụ chọn biến, hãy chọn kiểu bạn muốn sử dụng cho hằng số.

### Điều kiện vòng lặp

Từ phiên bản `v1.4.0-beta`, các tùy chọn liên quan đến điều kiện vòng lặp đã được thêm vào. Bạn có thể bật điều kiện vòng lặp trong cấu hình nút.

**Điều kiện**

Tương tự như cấu hình điều kiện trong nút điều kiện, bạn có thể kết hợp các cấu hình và sử dụng các biến trong vòng lặp hiện tại, như đối tượng vòng lặp, chỉ mục vòng lặp, v.v.

**Thời điểm kiểm tra**

Tương tự như cấu trúc `while` và `do/while` trong các ngôn ngữ lập trình, bạn có thể chọn tính toán điều kiện đã cấu hình trước khi mỗi vòng lặp bắt đầu hoặc sau khi mỗi vòng lặp kết thúc. Tính toán điều kiện sau cho phép các nút khác trong thân vòng lặp thực thi một lần trước khi kiểm tra điều kiện.

**Khi điều kiện không được đáp ứng**

Tương tự như các câu lệnh `break` và `continue` trong các ngôn ngữ lập trình, bạn có thể chọn thoát khỏi vòng lặp hoặc tiếp tục vòng lặp tiếp theo.

### Xử lý lỗi trong các nút bên trong vòng lặp

Từ phiên bản `v1.4.0-beta`, khi một nút bên trong vòng lặp thực thi thất bại (do điều kiện không được đáp ứng, lỗi, v.v.), bạn có thể cấu hình để quyết định luồng tiếp theo. Hỗ trợ ba cách xử lý:

*   Thoát luồng công việc (như `throw` trong lập trình)
*   Thoát vòng lặp và tiếp tục luồng công việc (như `break` trong lập trình)
*   Tiếp tục đến đối tượng vòng lặp tiếp theo (như `continue` trong lập trình)

Mặc định là "Thoát luồng công việc", bạn có thể chọn sử dụng tùy theo nhu cầu.

## Ví dụ

Ví dụ, khi đặt hàng, bạn cần kiểm tra tồn kho cho từng sản phẩm trong đơn hàng. Nếu tồn kho đủ, hãy trừ tồn kho; ngược lại, cập nhật sản phẩm trong chi tiết đơn hàng thành không hợp lệ.

1.  Tạo ba bộ sưu tập: Sản phẩm <-(1:m)-- Chi tiết đơn hàng --(m:1)-> Đơn hàng. Mô hình dữ liệu như sau:

    **Bộ sưu tập Đơn hàng**
    | Tên trường | Kiểu trường |
    | ------------ | -------------- |
    | Chi tiết đơn hàng | Một-nhiều (Chi tiết đơn hàng) |
    | Tổng giá trị đơn hàng | Số |

    **Bộ sưu tập Chi tiết đơn hàng**
    | Tên trường | Kiểu trường |
    | -------- | -------------- |
    | Sản phẩm | Nhiều-một (Sản phẩm) |
    | Số lượng | Số |

    **Bộ sưu tập Sản phẩm**
    | Tên trường | Kiểu trường |
    | -------- | -------- |
    | Tên sản phẩm | Văn bản một dòng |
    | Giá | Số |
    | Tồn kho | Số nguyên |

2.  Tạo một luồng công việc. Đối với trình kích hoạt, chọn "Sự kiện bộ sưu tập", và chọn bộ sưu tập "Đơn hàng" để kích hoạt "Khi bản ghi được thêm mới". Bạn cũng cần cấu hình để tải trước dữ liệu quan hệ của bộ sưu tập "Chi tiết đơn hàng" và bộ sưu tập Sản phẩm trong chi tiết:

    ![Nút Vòng lặp_Ví dụ_Cấu hình trình kích hoạt](https://static-docs.nocobase.com/0086601c2fc0e17a64d046a4c86b49b7.png)

3.  Tạo một nút vòng lặp và chọn đối tượng vòng lặp là "Dữ liệu kích hoạt / Chi tiết đơn hàng", nghĩa là nó sẽ xử lý từng bản ghi trong bộ sưu tập Chi tiết đơn hàng:

    ![Nút Vòng lặp_Ví dụ_Cấu hình nút Vòng lặp](https://static-docs.nocobase.com/2507becc32db5a9a0641c198605a20da.png)

4.  Bên trong nút vòng lặp, tạo một nút "Điều kiện" để kiểm tra xem tồn kho của sản phẩm có đủ không:

    ![Nút Vòng lặp_Ví dụ_Cấu hình nút Điều kiện](https://static-docs.nocobase.com/a6d08d15786841e1a3512b38e4629852.png)

5.  Nếu đủ, trong nhánh "Có", tạo một "nút Tính toán" và một "nút Cập nhật bản ghi" để cập nhật bản ghi sản phẩm tương ứng với số tồn kho đã được tính toán và trừ đi:

    ![Nút Vòng lặp_Ví dụ_Cấu hình nút Tính toán](https://static-docs.nocobase.com/8df3604c71f8f8705b1552d3ebfe3b50.png)

    ![Nút Vòng lặp_Ví dụ_Cấu hình nút Cập nhật tồn kho](https://static-docs.nocobase.com/2d84baa9b3b01bd85fccda9eec992378.png)

6.  Ngược lại, trong nhánh "Không", tạo một "nút Cập nhật bản ghi" để cập nhật trạng thái của chi tiết đơn hàng thành "không hợp lệ":

    ![Nút Vòng lặp_Ví dụ_Cấu hình nút Cập nhật chi tiết đơn hàng](https://static-docs.nocobase.com/4996613090c254c69a1d80f3b3a7fae2.png)

Cấu trúc luồng công việc tổng thể như sau:

![Nút Vòng lặp_Ví dụ_Cấu trúc luồng công việc](https://static-docs.nocobase.com/6f59ef246c1f19976344a7624c4c4151.png)

Sau khi cấu hình và kích hoạt luồng công việc này, khi một đơn hàng mới được tạo, hệ thống sẽ tự động kiểm tra tồn kho của các sản phẩm trong chi tiết đơn hàng. Nếu tồn kho đủ, nó sẽ được trừ đi; ngược lại, sản phẩm trong chi tiết đơn hàng sẽ được cập nhật thành không hợp lệ (để có thể tính toán tổng giá trị đơn hàng hợp lệ).