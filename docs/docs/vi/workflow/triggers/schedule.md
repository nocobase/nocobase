---
title: "Trigger Workflow - Tác vụ định kỳ"
description: "Trigger tác vụ định kỳ: kích hoạt theo thời gian tùy chỉnh (cron), trường thời gian của bảng dữ liệu, thực thi với độ chính xác đến giây, lập lịch Workflow định kỳ."
keywords: "workflow,tác vụ định kỳ,Schedule,Cron,lập lịch định kỳ,NocoBase"
---

# Tác vụ định kỳ

## Giới thiệu

Tác vụ định kỳ là sự kiện sử dụng thời gian làm điều kiện kích hoạt, được chia thành hai chế độ:

- Thời gian tùy chỉnh: kích hoạt theo lịch thời gian hệ thống thông thường tương tự cron
- Trường thời gian của bảng dữ liệu: kích hoạt khi đến giá trị của trường thời gian trong bảng dữ liệu

Khi hệ thống chạy đến thời điểm thỏa mãn điều kiện kích hoạt được cấu hình (chính xác đến giây), Workflow tương ứng sẽ được kích hoạt.

## Sử dụng cơ bản

### Tạo tác vụ định kỳ

Trong loại Workflow tạo mới ở danh sách Workflow, chọn loại "Tác vụ định kỳ":

![Tạo tác vụ định kỳ](https://static-docs.nocobase.com/e09b6c9065167875b2ca7de5f5a799a7.png)

### Chế độ thời gian tùy chỉnh

Đối với chế độ thông thường, đầu tiên cần cấu hình thời gian bắt đầu là một thời điểm bất kỳ (chính xác đến giây). Thời gian bắt đầu có thể được cấu hình là thời gian tương lai hoặc thời gian quá khứ. Khi cấu hình là thời gian quá khứ, sẽ kiểm tra xem có đến thời điểm theo điều kiện lặp được cấu hình hay không, nếu không cấu hình điều kiện lặp và thời gian bắt đầu là thời gian quá khứ thì Workflow sẽ không được kích hoạt nữa.

Có hai cách cấu hình quy tắc lặp:

- Theo khoảng thời gian: kích hoạt sau mỗi khoảng thời gian cố định kể từ thời gian bắt đầu, như mỗi giờ, mỗi 30 phút...
- Chế độ nâng cao: tức là theo quy tắc cron, có thể cấu hình thành chu kỳ đến thời điểm quy tắc cố định.

Sau khi cấu hình quy tắc lặp, còn có thể cấu hình điều kiện kết thúc, có thể kết thúc qua thời điểm cố định, hoặc giới hạn qua số lần đã thực thi.

### Chế độ trường thời gian của bảng dữ liệu

Xác định thời gian bắt đầu thông qua trường thời gian của bảng dữ liệu là chế độ kích hoạt kết hợp tác vụ định kỳ thông thường với trường thời gian của bảng dữ liệu, sử dụng chế độ này có thể đơn giản hóa các Node trong một số quy trình cụ thể, về cấu hình cũng trực quan hơn. Ví dụ, cần thay đổi đơn hàng quá hạn chưa thanh toán thành trạng thái đã hủy, có thể chỉ cấu hình một tác vụ định kỳ chế độ trường thời gian của bảng dữ liệu, chọn thời gian bắt đầu là 30 phút sau khi đơn hàng được tạo.

## Mẹo liên quan

### Tác vụ định kỳ khi chưa khởi động hoặc dừng máy

Nếu điều kiện thời gian được cấu hình thỏa mãn nhưng toàn bộ dịch vụ ứng dụng NocoBase đang ở trạng thái chưa khởi động hoặc dừng máy, tác vụ định kỳ lẽ ra phải được kích hoạt tại thời điểm tương ứng sẽ bị bỏ lỡ, và sau khi dịch vụ khởi động lại, các tác vụ đã bị bỏ lỡ sẽ không được kích hoạt nữa. Vì vậy khi sử dụng có thể cần xem xét xử lý tình huống tương ứng hoặc các biện pháp dự phòng.

### Số lần lặp

Khi cấu hình theo số lần lặp trong điều kiện kết thúc, số được tính là tổng số lần thực thi của tất cả các phiên bản của cùng một Workflow, ví dụ một tác vụ định kỳ ở phiên bản 1 đã thực thi 10 lần, nếu số lần lặp cũng được đặt là 10 lần, Workflow này sẽ không được kích hoạt nữa, ngay cả khi sao chép sang phiên bản mới cũng sẽ không được kích hoạt, trừ khi sửa số lần lặp thành số lớn hơn 10. Nhưng nếu sao chép thành Workflow mới, số lần đã thực thi sẽ được tính lại từ 0, trong trường hợp không sửa cấu hình liên quan, Workflow mới có thể được kích hoạt thêm 10 lần nữa.

### Sự khác biệt giữa khoảng thời gian và chế độ nâng cao trong quy tắc lặp

Khoảng thời gian trong quy tắc lặp là tương đối với thời điểm kích hoạt lần trước (thời gian bắt đầu), còn chế độ nâng cao là kích hoạt theo thời điểm cố định. Ví dụ, được cấu hình kích hoạt mỗi 30 phút một lần, nếu lần kích hoạt trước là 2021-09-01 12:01:23, thì thời gian kích hoạt lần sau là 2021-09-01 12:31:23. Còn chế độ nâng cao tức chế độ cron, các quy tắc được cấu hình đều là kích hoạt theo thời điểm cố định, ví dụ, có thể cấu hình kích hoạt vào phút 01 và phút 31 của mỗi giờ.

## Ví dụ

Giả sử mỗi phút kiểm tra các đơn hàng được tạo quá 30 phút mà chưa hoàn tất thanh toán và tự động chuyển thành trạng thái đã hủy. Sử dụng cả hai chế độ để thực hiện.

### Chế độ thời gian tùy chỉnh

Tạo một Workflow dựa trên tác vụ định kỳ, trong cấu hình Trigger chọn chế độ "Thời gian tùy chỉnh", thời gian bắt đầu chọn thời điểm bất kỳ không muộn hơn thời gian hiện tại, quy tắc lặp chọn "Mỗi phút", điều kiện kết thúc để trống:

![Tác vụ định kỳ_cấu hình Trigger_chế độ thời gian tùy chỉnh](https://static-docs.nocobase.com/71131e3f2034263f883062389b356cbd.png)

Sau đó cấu hình các Node khác theo logic của quy trình, tính ra thời gian 30 phút trước, và sửa các đơn hàng có thời gian tạo trước đó và chưa thanh toán thành trạng thái đã hủy:

![Tác vụ định kỳ_cấu hình Trigger_chế độ thời gian tùy chỉnh](https://static-docs.nocobase.com/188bc5287ffa1fb24a4e7baa1de6eb29.png)

Sau khi Workflow được bật, từ thời gian bắt đầu sẽ kích hoạt mỗi phút một lần, tính thời gian 30 phút trước để cập nhật trạng thái của các đơn hàng có thời gian tạo sớm hơn thời điểm đó thành đã hủy.

### Chế độ trường thời gian của bảng dữ liệu

Tạo một Workflow dựa trên tác vụ định kỳ, trong cấu hình Trigger chọn chế độ "Trường thời gian của bảng dữ liệu", bảng dữ liệu chọn bảng "Đơn hàng", thời gian bắt đầu chọn 30 phút sau thời gian tạo của đơn hàng, quy tắc lặp chọn "Không lặp":

![Tác vụ định kỳ_cấu hình Trigger_chế độ trường thời gian của bảng dữ liệu_Trigger](https://static-docs.nocobase.com/d40d5aef57f42799d31cc5882dd94246.png)

Sau đó cấu hình các Node khác theo logic của quy trình, cập nhật đơn hàng có ID là ID dữ liệu kích hoạt và trạng thái là "Chưa thanh toán" thành trạng thái hủy:

![Tác vụ định kỳ_cấu hình Trigger_chế độ trường thời gian của bảng dữ liệu_Node cập nhật](https://static-docs.nocobase.com/491dde9df8f773f5b14a4fd8ceac9d3e.png)

Khác với chế độ thời gian tùy chỉnh, ở đây không cần tính thời gian 30 phút trước, vì trong dữ liệu ngữ cảnh kích hoạt Workflow đã chứa dòng dữ liệu phù hợp với điều kiện thời gian tương ứng nên có thể trực tiếp cập nhật trạng thái của đơn hàng tương ứng.
