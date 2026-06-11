---
title: "Bắt đầu nhanh với Workflow"
description: "Bắt đầu nhanh với Workflow: cấu hình Workflow đầu tiên, Trigger sự kiện bảng dữ liệu, Node tính toán, lưu và kiểm thử, làm quen trong 5 phút."
keywords: "workflow,bắt đầu nhanh,sự kiện bảng dữ liệu,node tính toán,cấu hình trigger,NocoBase"
---

# Bắt đầu nhanh

## Cấu hình Workflow đầu tiên

Từ menu cấu hình plugin trên thanh menu phía trên, vào trang quản lý của plugin Workflow:

![Lối vào quản lý plugin Workflow](https://static-docs.nocobase.com/20251027222721.png)

Giao diện quản lý sẽ liệt kê tất cả Workflow đã được tạo:

![Quản lý Workflow](https://static-docs.nocobase.com/20251027222900.png)

Bấm nút "Tạo mới" để tạo một Workflow mới và chọn sự kiện bảng dữ liệu:

![Tạo Workflow](https://static-docs.nocobase.com/20251027222951.png)

Sau khi gửi, bấm vào liên kết "Cấu hình" trong danh sách để vào giao diện cấu hình Workflow:

![Một Workflow trống](https://static-docs.nocobase.com/20251027223131.png)

Sau đó bấm vào thẻ Trigger để mở ngăn cấu hình Trigger, chọn một bảng dữ liệu đã tạo trước đó (ví dụ bảng "Bài viết"), thời điểm kích hoạt chọn "Sau khi thêm dữ liệu", bấm nút "Lưu" để hoàn tất cấu hình Trigger:

![Cấu hình Trigger](https://static-docs.nocobase.com/20251027224735.png)

Tiếp theo bạn có thể bấm nút dấu cộng trong luồng để thêm một Node, ví dụ chọn Node tính toán để ghép trường "Tiêu đề" với trường "ID" trong dữ liệu của Trigger:

![Thêm Node tính toán](https://static-docs.nocobase.com/20251027224842.png)

Bấm vào thẻ Node để mở ngăn cấu hình Node, sử dụng hàm `CONCATENATE` do Formula.js cung cấp để ghép hai trường "Tiêu đề" và "ID", hai trường này được chèn thông qua bộ chọn biến:

![Node tính toán sử dụng hàm và biến](https://static-docs.nocobase.com/20251027224939.png)

Sau đó tạo thêm một Node cập nhật dữ liệu để lưu kết quả vào trường "Tiêu đề":

![Tạo Node cập nhật dữ liệu](https://static-docs.nocobase.com/20251027232654.png)

Tương tự, bấm vào thẻ để mở ngăn cấu hình Node cập nhật dữ liệu, chọn bảng "Bài viết", ID dữ liệu cần cập nhật chọn ID dữ liệu trong Trigger, mục dữ liệu cần cập nhật chọn "Tiêu đề", giá trị dữ liệu cập nhật chọn kết quả của Node tính toán:

![Cấu hình Node cập nhật dữ liệu](https://static-docs.nocobase.com/20251027232802.png)

Cuối cùng bấm công tắc "Bật"/"Tắt" trên thanh công cụ góc trên bên phải để chuyển Workflow sang trạng thái bật, như vậy Workflow đã có thể được kích hoạt thực thi.

## Kích hoạt Workflow

Quay về giao diện chính của hệ thống, tạo một bài viết thông qua Block bài viết và điền tiêu đề bài viết:

![Tạo dữ liệu bài viết](https://static-docs.nocobase.com/20251027233004.png)

Sau khi gửi và làm mới Block, bạn có thể thấy tiêu đề bài viết đã được tự động cập nhật thành dạng "Tiêu đề bài viết + ID bài viết":

![Tiêu đề bài viết được Workflow chỉnh sửa](https://static-docs.nocobase.com/20251027233043.png)

:::info{title=Mẹo}
Vì Workflow được kích hoạt bởi bảng dữ liệu thực thi bất đồng bộ, nên trong giao diện ngay sau khi gửi dữ liệu sẽ không thấy ngay dữ liệu được cập nhật, nhưng sau một lát khi làm mới trang hoặc Block thì sẽ thấy nội dung được cập nhật.
:::

## Xem lịch sử thực thi

Workflow vừa rồi đã được kích hoạt thực thi thành công một lần, bạn có thể quay về giao diện quản lý Workflow để xem lịch sử thực thi tương ứng:

![Xem danh sách Workflow](https://static-docs.nocobase.com/20251027233246.png)

Trong danh sách Workflow có thể thấy Workflow này đã sinh ra một lịch sử thực thi, bấm vào liên kết số lần để mở danh sách lịch sử thực thi của Workflow tương ứng:

![Danh sách lịch sử thực thi của Workflow tương ứng](https://static-docs.nocobase.com/20251027233341.png)

Tiếp tục bấm liên kết "Xem" để vào trang chi tiết của lần thực thi đó, có thể thấy trạng thái thực thi và dữ liệu kết quả của từng Node:

![Chi tiết lịch sử thực thi Workflow](https://static-docs.nocobase.com/20251027233615.png)

Dữ liệu ngữ cảnh của Trigger và dữ liệu kết quả thực thi của các Node đều có thể được xem bằng cách bấm nút trạng thái ở góc trên bên phải của thẻ tương ứng, ví dụ chúng ta xem dữ liệu kết quả của Node tính toán:

![Kết quả Node tính toán](https://static-docs.nocobase.com/20251027233635.png)

Có thể thấy dữ liệu kết quả của Node tính toán đã chứa tiêu đề sau khi được tính toán, tiêu đề này chính là dữ liệu được Node cập nhật dữ liệu phía sau cập nhật vào.

## Tóm tắt

Qua các bước trên, chúng ta đã hoàn thành cấu hình và kích hoạt một Workflow đơn giản, đồng thời đã tiếp xúc với một số khái niệm cơ bản sau:

- **Workflow**: Dùng để định nghĩa thông tin cơ bản của quy trình, bao gồm tên, loại Trigger và trạng thái bật/tắt..., có thể cấu hình tùy ý nhiều Node trong đó, là thực thể chứa quy trình.
- **Trigger**: Mỗi Workflow đều chứa một Trigger, có thể cấu hình thành điều kiện cụ thể để Workflow được kích hoạt, là cổng vào của quy trình.
- **Node**: Node là đơn vị lệnh thực hiện thao tác cụ thể trong Workflow, nhiều Node trong Workflow được kết nối bằng quan hệ cha - con tạo thành quy trình thực thi hoàn chỉnh.
- **Kế hoạch thực thi**: Kế hoạch thực thi là đối tượng thực thi cụ thể sau khi Workflow được kích hoạt, còn gọi là bản ghi thực thi hoặc lịch sử thực thi, chứa thông tin về trạng thái thực thi, dữ liệu ngữ cảnh kích hoạt..., trong đó với mỗi Node cũng có kết quả thực thi tương ứng, chứa thông tin trạng thái và dữ liệu kết quả sau khi Node được thực thi.

Để sử dụng sâu hơn, bạn có thể tham khảo thêm các nội dung sau:

- [Trigger](./triggers/index)
- [Node](./nodes/index)
- [Sử dụng biến](./advanced/variables)
- [Kế hoạch thực thi](./advanced/executions)
- [Quản lý phiên bản](./advanced/revisions)
- [Cấu hình nâng cao](./advanced/options)
