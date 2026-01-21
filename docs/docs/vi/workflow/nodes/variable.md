---
pkg: '@nocobase/plugin-workflow-variable'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Biến

## Giới thiệu

Bạn có thể khai báo biến hoặc gán giá trị cho các biến đã khai báo trong một luồng công việc. Việc này thường dùng để lưu trữ dữ liệu tạm thời trong luồng.

## Tạo nút

Trong giao diện cấu hình luồng công việc, hãy nhấp vào nút dấu cộng (“+”) trong luồng để thêm nút "Biến":

![Add Variable Node](https://static-docs.nocobase.com/53b1e48e777bfff7f2a08271526ef3ee.png)

## Cấu hình nút

### Chế độ

Nút biến tương tự như các biến trong lập trình; bạn cần khai báo biến trước khi có thể sử dụng và gán giá trị cho nó. Do đó, khi tạo một nút biến, bạn cần chọn chế độ cho biến. Có hai chế độ để lựa chọn:

![Select Mode](https://static-docs.nocobase.com/49d8b7b501de6faef6f303262aa14550.png)

- Khai báo biến mới: Tạo một biến mới.
- Gán giá trị cho biến hiện có: Gán giá trị cho một biến đã được khai báo trước đó trong luồng công việc, tương đương với việc sửa đổi giá trị của biến.

Khi nút đang tạo là nút biến đầu tiên trong luồng công việc, bạn chỉ có thể chọn chế độ khai báo, vì lúc này chưa có biến nào để gán giá trị.

Khi chọn gán giá trị cho một biến đã khai báo, bạn cũng cần chọn biến đích, tức là nút đã khai báo biến đó:

![Select the variable to assign a value to](https://static-docs.nocobase.com/1ce8911548d7347e693d8cc8ac1953eb.png)

### Giá trị

Giá trị của một biến có thể là bất kỳ kiểu dữ liệu nào. Nó có thể là một hằng số, chẳng hạn như chuỗi, số, giá trị logic (boolean) hoặc ngày tháng, hoặc cũng có thể là một biến khác trong luồng công việc.

Ở chế độ khai báo, việc đặt giá trị cho biến tương đương với việc gán giá trị khởi tạo cho biến đó.

![Declare initial value](https://static-docs.nocobase.com/4ce2c508986565ad537343013758c6a4.png)

Ở chế độ gán giá trị, việc đặt giá trị cho biến tương đương với việc sửa đổi giá trị của biến đích đã khai báo thành một giá trị mới. Các lần sử dụng sau đó sẽ lấy giá trị mới này.

![Assign a trigger variable to a declared variable](https://static-docs.nocobase.com/858bae180712ad279ae6a964a77a7659.png)

## Sử dụng giá trị của biến

Trong các nút tiếp theo sau nút biến, bạn có thể sử dụng giá trị của biến bằng cách chọn biến đã khai báo từ nhóm "Biến nút". Ví dụ, trong một nút truy vấn, hãy sử dụng giá trị của biến làm điều kiện truy vấn:

![Use variable value as a query filter condition](https://static-docs.nocobase.com/1ca91c295254ff85999a1751499f14bc.png)

## Ví dụ

Một kịch bản hữu ích hơn cho nút biến là trong các nhánh, nơi các giá trị mới được tính toán hoặc hợp nhất với các giá trị trước đó (tương tự như `reduce`/`concat` trong lập trình), và sau đó được sử dụng sau khi nhánh kết thúc. Dưới đây là một ví dụ về việc sử dụng nhánh lặp và nút biến để nối chuỗi người nhận.

Đầu tiên, hãy tạo một luồng công việc được kích hoạt bởi bộ sưu tập, kích hoạt khi dữ liệu "Bài viết" được cập nhật, và tải trước dữ liệu quan hệ "Tác giả" liên quan (để lấy người nhận):

![Configure Trigger](https://static-docs.nocobase.com/93327530a93c695c637d74cdfdcd5cde.png)

Sau đó, hãy tạo một nút biến để lưu trữ chuỗi người nhận:

![Recipient variable node](https://static-docs.nocobase.com/d26fa4a7e7ee4f34e0d8392a51c6666e.png)

Tiếp theo, hãy tạo một nút nhánh lặp để duyệt qua các tác giả của bài viết và nối thông tin người nhận của họ vào biến người nhận:

![Loop through authors in the article](https://static-docs.nocobase.com/083fe62c943c17a643dc47ec2872e07c.png)

Trong nhánh lặp, trước tiên hãy tạo một nút tính toán để nối tác giả hiện tại với chuỗi tác giả đã lưu trữ:

![Concatenate recipient string](https://static-docs.nocobase.com/5d21a990162f32cb8818d27b16fd1bcd.png)

Sau nút tính toán, hãy tạo một nút biến khác. Chọn chế độ gán giá trị, chọn nút biến người nhận làm mục tiêu gán, và chọn kết quả của nút tính toán làm giá trị:

![Assign the concatenated recipient string to the recipient node](https://static-docs.nocobase.com/fc40ed95dd9b61d924b7ca11b23f9482.png)

Bằng cách này, sau khi nhánh lặp kết thúc, biến người nhận sẽ lưu trữ chuỗi người nhận của tất cả các tác giả bài viết. Sau đó, bạn có thể sử dụng nút Yêu cầu HTTP để gọi API gửi email, truyền giá trị của biến người nhận làm tham số người nhận cho API:

![Send mail to recipients via the request node](https://static-docs.nocobase.com/37f71ae1a63e172bcb2dce10a250947e.png)

Đến đây, một tính năng gửi email hàng loạt đơn giản đã được triển khai bằng cách sử dụng vòng lặp và nút biến.