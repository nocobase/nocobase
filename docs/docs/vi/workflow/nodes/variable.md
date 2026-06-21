---
pkg: '@nocobase/plugin-workflow-variable'
title: "Node Workflow - Biến"
description: "Node biến: khai báo biến hoặc gán giá trị, lưu dữ liệu tạm thời cho quy trình sử dụng."
keywords: "workflow,biến,Variable,biến quy trình,dữ liệu tạm,NocoBase"
---

# Biến

## Giới thiệu

Có thể khai báo biến trong quy trình hoặc gán giá trị cho biến đã được khai báo, thường được dùng để lưu một số dữ liệu tạm thời trong quy trình.

## Tạo Node

Trong giao diện cấu hình Workflow, bấm nút dấu cộng ("+") trong quy trình để thêm Node "Biến":

![Thêm Node biến](https://static-docs.nocobase.com/53b1e48e777bfff7f2a08271526ef3ee.png)

## Cấu hình Node

### Chế độ

Node biến tương tự như biến trong chương trình, cần khai báo trước rồi mới có thể sử dụng và được gán giá trị. Vì vậy khi tạo Node biến, cần chọn chế độ của biến, có hai chế độ có thể chọn:

![Chọn chế độ](https://static-docs.nocobase.com/49d8b7b501de6faef6f303262aa14550.png)

- Khai báo biến mới: tạo một biến mới.
- Gán giá trị cho biến đã có: gán giá trị cho biến đã được khai báo trong quy trình trước đó, tương đương với việc sửa giá trị của biến.

Khi Node được tạo là Node biến đầu tiên trong quy trình, chỉ có thể chọn chế độ khai báo, vì lúc này chưa có biến nào để gán giá trị.

Khi chọn gán giá trị cho biến đã được khai báo, còn cần chọn biến đích, tức Node khai báo biến:

![Chọn biến cần gán giá trị](https://static-docs.nocobase.com/1ce8911548d7347e693d8cc8ac1953eb.png)

### Giá trị

Giá trị của biến có thể là loại bất kỳ, có thể là hằng số như chuỗi, số, giá trị logic và ngày..., cũng có thể là biến khác trong quy trình.

Ở chế độ khai báo, đặt giá trị biến tương đương với việc gán giá trị ban đầu cho biến.

![Khai báo giá trị ban đầu](https://static-docs.nocobase.com/4ce2c508986565ad537343013758c6a4.png)

Ở chế độ gán giá trị, đặt giá trị biến tương đương với việc sửa giá trị của biến đích đã được khai báo thành một giá trị mới, trong các lần sử dụng sau khi lấy giá trị cũng sẽ lấy được giá trị mới này.

![Gán giá trị cho biến đã khai báo bằng biến Trigger](https://static-docs.nocobase.com/858bae180712ad279ae6a964a77a7659.png)

## Sử dụng giá trị của biến

Trong các Node tiếp theo của Node biến, từ nhóm "Biến Node" chọn biến đã được khai báo là có thể sử dụng giá trị của biến đó. Ví dụ trong Node truy vấn, sử dụng giá trị biến làm điều kiện truy vấn:

![Sử dụng giá trị biến làm điều kiện lọc truy vấn](https://static-docs.nocobase.com/1ca91c295254ff85999a1751499f14bc.png)

## Ví dụ

Tình huống hữu ích hơn của Node biến là trong các nhánh, tính toán hoặc hợp nhất một số giá trị mới với giá trị trước đó (tương tự `reduce`/`concat`... trong lập trình), sau khi nhánh kết thúc thì sử dụng. Dưới đây là ví dụ triển khai chuỗi người nhận được ghép qua nhánh vòng lặp và Node biến.

Đầu tiên tạo một Workflow được kích hoạt bởi bảng dữ liệu, được kích hoạt khi dữ liệu "Bài viết" được cập nhật và preload dữ liệu quan hệ "Tác giả" liên quan (để lấy người nhận):

![Cấu hình Trigger](https://static-docs.nocobase.com/93327530a93c695c637d74cdfdcd5cde.png)

Sau đó tạo một Node biến để lưu chuỗi người nhận:

![Node biến người nhận](https://static-docs.nocobase.com/d26fa4a7e7ee4f34e0d8392a51c6666e.png)

Tiếp theo tạo một Node nhánh vòng lặp để duyệt qua các tác giả của bài viết và ghép người nhận của họ vào biến người nhận:

![Vòng lặp các tác giả trong bài viết](https://static-docs.nocobase.com/083fe62c943c17a643dc47ec2872e07c.png)

Trong nhánh vòng lặp, tạo trước một Node tính toán để ghép tác giả hiện tại với chuỗi tác giả đã lưu:

![Ghép chuỗi người nhận](https://static-docs.nocobase.com/5d21a990162f32cb8818d27b16fd1bcd.png)

Sau Node tính toán tạo thêm một Node biến, chọn chế độ gán giá trị, đích gán giá trị chọn Node biến người nhận, giá trị chọn kết quả của Node tính toán:

![Gán chuỗi người nhận đã ghép cho Node người nhận](https://static-docs.nocobase.com/fc40ed95dd9b61d924b7ca11b23f9482.png)

Như vậy sau khi nhánh vòng lặp kết thúc, trong biến người nhận đã lưu chuỗi người nhận của tất cả tác giả bài viết. Sau đó có thể sử dụng Node HTTP Request sau vòng lặp để gọi interface gửi email, truyền giá trị của biến người nhận làm tham số người nhận cho interface:

![Gửi email cho người nhận qua Node Request](https://static-docs.nocobase.com/37f71aa1a63e172bcb2dce10a250947e.png)

Đến đây, một tính năng gửi email hàng loạt đơn giản đã được triển khai qua vòng lặp và Node biến.
