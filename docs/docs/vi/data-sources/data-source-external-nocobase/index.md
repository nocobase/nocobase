---
title: 'NocoBase bên ngoài'
description: 'Kết nối một ứng dụng NocoBase khác làm nguồn dữ liệu bên ngoài và tìm hiểu cách cấu hình, các khả năng hỗ trợ và giới hạn workflow.'
keywords: 'NocoBase bên ngoài,nguồn dữ liệu NocoBase,quản lý nguồn dữ liệu,workflow,NocoBase'
---

# NocoBase bên ngoài

## Giới thiệu

Nguồn dữ liệu NocoBase bên ngoài kết nối một ứng dụng NocoBase khác vào ứng dụng hiện tại, đồng thời giữ lại metadata từ ứng dụng từ xa, bao gồm collection, giao diện field, tiêu đề và field quan hệ.

So với nguồn dữ liệu cơ sở dữ liệu bên ngoài, nguồn dữ liệu NocoBase bên ngoài thường không cần cấu hình lại giao diện field hoặc tạo thủ công field quan hệ. Ngoài xem, tạo, chỉnh sửa và xóa bản ghi, nguồn dữ liệu này còn hỗ trợ tải lên và xem trước file, nhập và xuất dữ liệu, truy vấn biểu đồ và một số tình huống workflow.

## Thêm Nguồn Dữ Liệu

Sau khi kích hoạt plugin, thêm nguồn dữ liệu NocoBase bên ngoài trong Trình quản lý nguồn dữ liệu và điền thông tin truy cập của ứng dụng từ xa.

| Tùy chọn | Mô tả |
| --- | --- |
| API URL | API URL đầy đủ của ứng dụng NocoBase từ xa, ví dụ `https://example.com/api` |
| Origin | Origin công khai của ứng dụng NocoBase từ xa, ví dụ `https://example.com`. Mục này chủ yếu dùng để xử lý URL xem trước file cục bộ trong ứng dụng từ xa |
| API key | Thông tin xác thực mà ứng dụng hiện tại dùng để truy cập ứng dụng NocoBase từ xa |
| Header yêu cầu | Header bổ sung gửi đến ứng dụng từ xa, ví dụ thông tin space |
| Timeout | Thời gian chờ của yêu cầu truy cập ứng dụng từ xa |

Sau khi nguồn dữ liệu được bật, hệ thống sẽ tải collection từ ứng dụng từ xa.

![](https://static-docs.nocobase.com/202606101149185.png)

## Quyền

Nguồn dữ liệu NocoBase bên ngoài chịu ảnh hưởng bởi quyền trong cả ứng dụng hiện tại và ứng dụng từ xa.

- Trong ứng dụng hiện tại, bạn có thể cấu hình quyền truy cập cho từng collection và field giống như các nguồn dữ liệu bên ngoài khác.
- Trong ứng dụng từ xa, dữ liệu được đọc và thao tác theo quyền của API key đã cấu hình.

Nguồn dữ liệu NocoBase bên ngoài không trả về metadata quyền dùng để kiểm soát chi tiết trạng thái hiển thị nút trên frontend. Vì vậy, một số nút có thể không tự động ẩn theo quyền như nguồn dữ liệu chính. Dù nút có hiển thị hay không, thao tác được gửi vẫn đi qua kiểm tra quyền phía server trong ứng dụng hiện tại, và thao tác không được phép sẽ bị từ chối.

:::warning{title=Lưu ý}
Hãy chuẩn bị một API key riêng cho nguồn dữ liệu NocoBase bên ngoài và chỉ cấp quyền collection cũng như thao tác cần thiết. Nếu người dùng có quyền trong ứng dụng hiện tại nhưng thao tác thất bại, hãy kiểm tra quyền của API key từ xa.
:::

## Sử Dụng Collection

Sau khi collection được tải thành công, chọn nguồn dữ liệu này trong cấu hình trang, cấu hình block, biểu đồ hoặc workflow để sử dụng collection từ ứng dụng từ xa.

Khi cấu trúc collection trong ứng dụng từ xa thay đổi, hãy tải lại collection trong ứng dụng hiện tại.

## Tính Năng

Nguồn dữ liệu NocoBase bên ngoài chủ yếu dùng để sử dụng collection và dữ liệu của ứng dụng từ xa trong ứng dụng hiện tại. Cấu trúc collection, cấu hình field và dữ liệu thực tế vẫn do ứng dụng từ xa quản lý.

### Collection và Field

Ứng dụng hiện tại tải metadata từ ứng dụng từ xa, bao gồm collection, giao diện field, tiêu đề và field quan hệ. So với nguồn dữ liệu cơ sở dữ liệu bên ngoài, thông thường bạn không cần cấu hình lại giao diện field hoặc tạo thủ công field quan hệ trong ứng dụng hiện tại.

Ứng dụng hiện tại không hỗ trợ cấu hình trực tiếp field của nguồn dữ liệu NocoBase bên ngoài. Để thêm field, điều chỉnh loại field hoặc sửa field quan hệ, hãy thực hiện trong ứng dụng từ xa rồi tải lại collection trong ứng dụng hiện tại.

### Bản Ghi và Dữ Liệu Liên Quan

Nguồn dữ liệu NocoBase bên ngoài hỗ trợ xem, tạo, chỉnh sửa và xóa bản ghi trong block trang, đồng thời hỗ trợ xem và duy trì dữ liệu liên quan. Thao tác được khởi tạo bởi ứng dụng hiện tại và gửi đến ứng dụng từ xa thông qua API key đã cấu hình.

### File và Tệp Đính Kèm

File được tải lên storage mà ứng dụng từ xa sử dụng. Ứng dụng hiện tại khởi tạo yêu cầu tải lên, xem trước và tải xuống, nhưng bản thân file không được lưu trong ứng dụng hiện tại.

Origin chủ yếu dùng để xử lý URL xem trước file được lưu cục bộ bởi ứng dụng từ xa. Nếu ứng dụng từ xa trả về đường dẫn tương đối, ứng dụng hiện tại dùng Origin để hoàn thiện URL truy cập file. Origin nên là địa chỉ truy cập công khai của ứng dụng NocoBase từ xa, ví dụ:

```text
https://example.com
```

Không dùng API URL làm Origin.

### Nhập và Xuất

Các thao tác nhập và xuất đọc hoặc ghi nguồn dữ liệu thông qua file bên ngoài, và được proxy sang ứng dụng từ xa để thực thi. Ứng dụng hiện tại xử lý thao tác của người dùng, chuyển tiếp yêu cầu và trả về kết quả tải xuống. Việc đọc và ghi dữ liệu thực tế được thực hiện bởi ứng dụng từ xa.

- Nhập bản ghi: ứng dụng hiện tại nhận file nhập đã tải lên và proxy sang ứng dụng từ xa để thực hiện nhập.
- Xuất bản ghi: ứng dụng hiện tại proxy yêu cầu sang ứng dụng từ xa để xuất bản ghi. Ở chế độ đồng bộ, file bản ghi do ứng dụng từ xa trả về được stream về trình duyệt để tải xuống. Ở chế độ bất đồng bộ, một tác vụ bất đồng bộ cục bộ được tạo, quá trình xuất bản ghi được khởi chạy ở ứng dụng từ xa, tiến độ được đồng bộ về tác vụ cục bộ và file kết quả được stream từ ứng dụng từ xa khi tải xuống.
- Xuất tệp đính kèm: ứng dụng hiện tại proxy yêu cầu sang ứng dụng từ xa để xuất tệp đính kèm. Ở chế độ đồng bộ, gói tệp đính kèm do ứng dụng từ xa trả về được stream về trình duyệt để tải xuống. Ở chế độ bất đồng bộ, một tác vụ bất đồng bộ cục bộ được tạo, quá trình xuất tệp đính kèm được khởi chạy ở ứng dụng từ xa, tiến độ được đồng bộ về tác vụ cục bộ và gói tệp đính kèm được stream từ ứng dụng từ xa khi tải xuống.

### In Theo Mẫu

In theo mẫu có thể sử dụng bản ghi từ nguồn dữ liệu NocoBase bên ngoài. Mẫu in và cấu hình hành động in được lưu trong ứng dụng hiện tại. Khi in, ứng dụng hiện tại đọc bản ghi từ xa và dữ liệu liên quan, rồi tạo file in trong ứng dụng hiện tại.

### Biểu Đồ

#### Bảng Truy Vấn

Nguồn dữ liệu NocoBase bên ngoài có thể dùng trong bảng truy vấn của biểu đồ. Ứng dụng hiện tại xử lý tham số truy vấn theo quyền biểu đồ, nguồn dữ liệu, collection và field đã cấu hình cục bộ, sau đó yêu cầu ứng dụng từ xa trả kết quả.

API key từ xa cũng cần có quyền truy cập dữ liệu tương ứng; nếu không, truy vấn sẽ thất bại.

#### Bảng SQL

Bảng SQL là chế độ truy vấn SQL trong biểu đồ và chỉ dùng cho truy vấn. Ứng dụng hiện tại lưu cấu hình SQL và khởi tạo lời gọi, còn SQL được proxy sang ứng dụng từ xa để thực thi.

Khi dùng bảng SQL, người dùng cục bộ cần có quyền cấu hình UI trong ứng dụng hiện tại, và API key từ xa cũng cần có quyền cấu hình UI trong ứng dụng từ xa. SQL không được phân tách theo quyền collection và field như bảng truy vấn. Hãy thận trọng khi cấp quyền cấu hình UI cho người dùng cục bộ và API key tương ứng.

### Workflow

Nguồn dữ liệu NocoBase bên ngoài có thể liên quan đến workflow trong cả ứng dụng hiện tại và ứng dụng từ xa. Ứng dụng hiện tại phản hồi các sự kiện trong trang cục bộ, nút và chuỗi yêu cầu API. Sau khi ứng dụng từ xa nhận yêu cầu được proxy, nó xử lý theo cấu hình workflow riêng.

Ứng dụng hiện tại không lắng nghe sự kiện tạo, cập nhật hoặc xóa xảy ra bên trong collection từ xa. Sự kiện collection từ xa chỉ được kích hoạt trong ứng dụng từ xa.

#### Trigger

Bảng sau mô tả cách các trigger chịu ảnh hưởng bởi nguồn dữ liệu NocoBase bên ngoài hoạt động trong ứng dụng hiện tại và ứng dụng từ xa khi workflow tương ứng được bật.

| Trigger | Ứng dụng hiện tại | Ứng dụng từ xa | Mô tả |
| --- | --- | --- | --- |
| Sự kiện trước hành động | Kích hoạt | Chỉ kích hoạt ở chế độ global | Trong ứng dụng hiện tại, chế độ global được kích hoạt, còn chế độ local theo binding nút của ứng dụng hiện tại. Sau khi ứng dụng từ xa nhận yêu cầu được proxy, chỉ chế độ global được kích hoạt |
| Sự kiện sau hành động | Kích hoạt | Chỉ kích hoạt ở chế độ global | Trong ứng dụng hiện tại, chế độ global được kích hoạt, còn chế độ local theo binding nút của ứng dụng hiện tại. Sau khi ứng dụng từ xa nhận yêu cầu được proxy, chỉ chế độ global được kích hoạt |
| Sự kiện hành động tùy chỉnh | Kích hoạt | Không kích hoạt | Nút "Trigger workflow" được binding trong ứng dụng hiện tại sẽ kích hoạt workflow cục bộ. Các yêu cầu CRUD được proxy không kích hoạt sự kiện hành động tùy chỉnh từ xa |
| Sự kiện collection | Không kích hoạt | Kích hoạt | Dữ liệu thực tế thay đổi trong ứng dụng từ xa. Ứng dụng hiện tại không kích hoạt sự kiện collection cục bộ, còn ứng dụng từ xa kích hoạt sự kiện collection của chính nó |
| Trigger theo lịch của field ngày | Không kích hoạt | Kích hoạt | Ứng dụng hiện tại không kích hoạt dựa trên field trong collection từ xa. Ứng dụng từ xa kích hoạt theo cấu hình field ngày của chính nó |

Các trigger không phụ thuộc vào nguồn dữ liệu được kích hoạt trong ứng dụng hiện tại và ứng dụng từ xa theo cấu hình riêng của từng ứng dụng.

Để điều phối workflow thao tác dữ liệu NocoBase bên ngoài trong ứng dụng hiện tại, nên dùng sự kiện trước hành động, sự kiện sau hành động hoặc sự kiện hành động tùy chỉnh. Workflow đã có trong ứng dụng từ xa chạy độc lập trong ứng dụng từ xa.

#### Node

Bảng sau chỉ liệt kê các node liên quan đến nguồn dữ liệu. Các node chung như điều kiện, tính toán, vòng lặp và xử lý JSON không phụ thuộc vào loại nguồn dữ liệu và có thể dùng như bình thường.

| Node | Có thể dùng | Mô tả |
| --- | --- | --- |
| Query records | Có thể dùng | Truy vấn bản ghi trong ứng dụng từ xa |
| Create record | Có thể dùng | Tạo bản ghi trong ứng dụng từ xa |
| Update record | Có thể dùng | Cập nhật bản ghi trong ứng dụng từ xa |
| Delete record | Có thể dùng | Xóa bản ghi trong ứng dụng từ xa |
| Node SQL | Không thể dùng | Node SQL của workflow chỉ hỗ trợ nguồn dữ liệu cơ sở dữ liệu |
| Node tổng hợp | Không thể dùng | Node tổng hợp chỉ hỗ trợ nguồn dữ liệu cơ sở dữ liệu |

## FAQ

### Collection Không Hiển Thị

Kiểm tra xem nguồn dữ liệu đã được bật chưa, API URL và API key có đúng không. Ứng dụng từ xa cũng cần cho phép API key đó truy cập collection tương ứng.

### File Tải Lên Thành Công Nhưng Không Xem Trước Được

Nếu ứng dụng hiện tại hoặc ứng dụng từ xa dùng storage file cục bộ, hãy kiểm tra Origin có phải là địa chỉ truy cập công khai của ứng dụng tương ứng không. Origin không nên là API URL.

### Ứng Dụng Hiện Tại Có Quyền Nhưng Thao Tác Thất Bại

Kiểm tra quyền API key trong ứng dụng từ xa. Nguồn dữ liệu NocoBase bên ngoài chịu ảnh hưởng bởi quyền của cả ứng dụng hiện tại và ứng dụng từ xa.

### Collection Không Dùng Được Sau Khi Dịch Vụ Từ Xa Lỗi

Nếu ứng dụng từ xa trả về 502, khởi động lại hoặc tạm thời không khả dụng, ứng dụng hiện tại có thể tạm thời không đọc được metadata collection từ xa. Sau khi dịch vụ từ xa khôi phục, ứng dụng hiện tại sẽ tự động tải lại metadata vào lần tiếp theo collection của nguồn dữ liệu này được truy cập.

### Vì Sao Không Thể Cấu Hình Field Trong Ứng Dụng Hiện Tại

Nguồn dữ liệu NocoBase bên ngoài sử dụng cấu trúc collection và cấu hình field từ ứng dụng từ xa. Hãy điều chỉnh field trong ứng dụng từ xa, sau đó tải lại collection trong ứng dụng hiện tại.
