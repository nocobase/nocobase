---
title: 'NocoBase bên ngoài'
description: 'Kết nối một ứng dụng NocoBase khác làm nguồn dữ liệu bên ngoài cho ứng dụng hiện tại, đồng thời tìm hiểu cách cấu hình, các khả năng được hỗ trợ và những hạn chế khi sử dụng trong workflow.'
keywords: 'NocoBase bên ngoài,Nguồn dữ liệu NocoBase,Quản lý nguồn dữ liệu,Workflow,NocoBase'
---

# NocoBase bên ngoài

## Giới thiệu

Nguồn dữ liệu NocoBase bên ngoài có thể kết nối một ứng dụng NocoBase khác vào ứng dụng hiện tại, đồng thời giữ lại siêu dữ liệu đã được cấu hình trong ứng dụng từ xa, chẳng hạn như bảng dữ liệu, giao diện trường, tiêu đề và trường quan hệ.

So với nguồn dữ liệu cơ sở dữ liệu bên ngoài, sau khi kết nối NocoBase bên ngoài, thông thường bạn không cần cấu hình lại giao diện trường hoặc tạo thủ công các trường quan hệ. Ngoài việc xem, thêm, chỉnh sửa và xóa bản ghi, tính năng này còn hỗ trợ tải lên và xem trước tệp, nhập xuất dữ liệu, truy vấn biểu đồ và một số trường hợp sử dụng workflow.

## Thêm nguồn dữ liệu

Sau khi kích hoạt plugin, hãy thêm nguồn dữ liệu NocoBase bên ngoài trong phần 「Quản lý nguồn dữ liệu」 và điền thông tin truy cập của ứng dụng từ xa.

| Mục cấu hình | Mô tả                                                                                           |
| -------- | ---------------------------------------------------------------------------------------------- |
| Địa chỉ API | Địa chỉ API đầy đủ của ứng dụng NocoBase từ xa, ví dụ `https://example.com/api`                              |
| Origin   | Nguồn truy cập của ứng dụng NocoBase từ xa, ví dụ `https://example.com`, chủ yếu dùng để xử lý địa chỉ xem trước tệp cục bộ của ứng dụng từ xa |
| API key  | Thông tin xác thực được ứng dụng hiện tại sử dụng khi truy cập NocoBase từ xa                                                         |
| Header yêu cầu | Các header yêu cầu cần truyền thêm cho ứng dụng từ xa, chẳng hạn như thông tin không gian                                                   |
| Thời gian chờ | Thời gian chờ của yêu cầu khi truy cập ứng dụng từ xa                                                                     |

Sau khi bật nguồn dữ liệu, hệ thống sẽ tải các bảng dữ liệu của ứng dụng từ xa.

![](https://static-docs.nocobase.com/202606101149185.png)

## Mô tả quyền

Nguồn dữ liệu NocoBase bên ngoài đồng thời chịu ảnh hưởng của quyền trong ứng dụng hiện tại và ứng dụng từ xa.

- Ứng dụng hiện tại có thể cấu hình quyền truy cập các bảng và trường khác nhau như với những nguồn dữ liệu bên ngoài khác;
- Ứng dụng từ xa sẽ đọc và thao tác trên dữ liệu tương ứng dựa trên quyền của API key đã cấu hình.

Nguồn dữ liệu NocoBase bên ngoài không trả về siêu dữ liệu quyền dùng để kiểm soát chi tiết trạng thái hiển thị nút ở giao diện người dùng, vì vậy một số nút có thể không tự động ẩn theo quyền như ở nguồn dữ liệu chính. Bất kể nút có hiển thị hay không, thao tác gửi vẫn sẽ được kiểm tra quyền ở phía máy chủ của ứng dụng hiện tại; thao tác chưa được cấp quyền sẽ bị từ chối.

:::warning{title=Lưu ý}
Bạn nên chuẩn bị riêng một API key cho nguồn dữ liệu NocoBase bên ngoài và chỉ cấp các quyền thao tác và quyền truy cập bảng dữ liệu cần thiết. Nếu ứng dụng hiện tại có quyền nhưng thao tác thất bại, hãy kiểm tra quyền của API key từ xa.
:::

## Sử dụng bảng dữ liệu

Sau khi tải bảng dữ liệu thành công, hãy chọn nguồn dữ liệu này trong cấu hình trang, cấu hình block, biểu đồ hoặc workflow để sử dụng các bảng dữ liệu trong ứng dụng từ xa.

Sau khi cấu trúc bảng dữ liệu của ứng dụng từ xa thay đổi, cần tải lại bảng dữ liệu trong ứng dụng hiện tại.

## Mô tả tính năng

Nguồn dữ liệu NocoBase bên ngoài chủ yếu được dùng để sử dụng các bảng dữ liệu và dữ liệu của ứng dụng từ xa trong ứng dụng hiện tại. Cấu trúc bảng dữ liệu, cấu hình trường và dữ liệu thực tế vẫn do ứng dụng từ xa quản lý.

### Bảng dữ liệu và trường

Ứng dụng hiện tại sẽ tải siêu dữ liệu của ứng dụng từ xa, chẳng hạn như bảng dữ liệu, giao diện trường, tiêu đề và trường quan hệ. So với nguồn dữ liệu cơ sở dữ liệu bên ngoài, thông thường bạn không cần cấu hình lại giao diện trường hoặc tạo thủ công các trường quan hệ trong ứng dụng hiện tại.

Ứng dụng hiện tại không hỗ trợ cấu hình trực tiếp các trường của nguồn dữ liệu NocoBase bên ngoài. Khi cần thêm trường, điều chỉnh kiểu trường hoặc sửa trường quan hệ, hãy thực hiện trong ứng dụng từ xa, sau đó quay lại ứng dụng hiện tại để tải lại bảng dữ liệu.

### Bản ghi và dữ liệu liên kết

Nguồn dữ liệu NocoBase bên ngoài hỗ trợ xem, thêm, chỉnh sửa và xóa bản ghi trong các block của trang, đồng thời hỗ trợ xem và duy trì dữ liệu liên kết. Thao tác sẽ do ứng dụng hiện tại khởi tạo và gửi yêu cầu đến ứng dụng từ xa thông qua API key đã cấu hình.

### Tệp và tệp đính kèm

Tệp sẽ được tải lên bộ lưu trữ mà ứng dụng từ xa đang sử dụng. Ứng dụng hiện tại chịu trách nhiệm khởi tạo yêu cầu tải lên, xem trước và tải xuống; bản thân tệp không được lưu trong ứng dụng hiện tại.

Origin chủ yếu dùng để xử lý địa chỉ xem trước của các tệp trong bộ lưu trữ cục bộ của ứng dụng từ xa. Nếu phản hồi từ xa là đường dẫn tương đối, ứng dụng hiện tại sẽ dùng Origin để bổ sung địa chỉ truy cập tệp. Origin nên được điền bằng địa chỉ truy cập công khai của ứng dụng NocoBase từ xa, ví dụ:

```text
https://example.com
```

Không điền địa chỉ API vào Origin.

### Nhập xuất dữ liệu

Nhập và xuất dữ liệu là các thao tác đọc ghi nguồn dữ liệu thông qua tệp bên ngoài, tất cả đều được chuyển tiếp để thực thi trong ứng dụng từ xa. Ứng dụng hiện tại chịu trách nhiệm tiếp nhận thao tác của người dùng, chuyển tiếp yêu cầu và trả về kết quả tải xuống; việc đọc ghi dữ liệu thực tế do ứng dụng từ xa hoàn tất.

- Nhập bản ghi: ứng dụng hiện tại tiếp nhận tệp nhập được tải lên và chuyển tiếp đến ứng dụng từ xa để thực hiện việc nhập;
- Xuất bản ghi: ứng dụng hiện tại chuyển tiếp yêu cầu xuất bản ghi đến ứng dụng từ xa. Ở chế độ đồng bộ, luồng tệp bản ghi do ứng dụng từ xa trả về sẽ được chuyển tiếp cho trình duyệt để tải xuống; ở chế độ không đồng bộ, một tác vụ không đồng bộ cục bộ sẽ được tạo, việc xuất bản ghi được khởi tạo trong ứng dụng từ xa và tiến độ được đồng bộ hóa, khi tải xuống kết quả, luồng tệp bản ghi sẽ được lấy từ ứng dụng từ xa;
- Xuất tệp đính kèm: ứng dụng hiện tại chuyển tiếp yêu cầu xuất tệp đính kèm đến ứng dụng từ xa. Ở chế độ đồng bộ, gói tệp đính kèm do ứng dụng từ xa trả về sẽ được chuyển tiếp cho trình duyệt để tải xuống; ở chế độ không đồng bộ, một tác vụ không đồng bộ cục bộ sẽ được tạo, việc xuất tệp đính kèm được khởi tạo trong ứng dụng từ xa và tiến độ được đồng bộ hóa, khi tải xuống kết quả, luồng gói tệp đính kèm sẽ được lấy từ ứng dụng từ xa.

### In mẫu

Tính năng in mẫu có thể sử dụng các bản ghi trong nguồn dữ liệu NocoBase bên ngoài. Mẫu in và cấu hình thao tác in được lưu trong ứng dụng hiện tại; khi in, ứng dụng hiện tại sẽ đọc bản ghi và dữ liệu liên kết từ xa, sau đó tạo tệp in trong ứng dụng hiện tại.

### Biểu đồ

#### Bảng điều khiển truy vấn

Nguồn dữ liệu NocoBase bên ngoài có thể được sử dụng cho bảng điều khiển truy vấn biểu đồ. Ứng dụng hiện tại sẽ xử lý các tham số truy vấn theo biểu đồ, nguồn dữ liệu, bảng dữ liệu và quyền trường được cấu hình cục bộ, sau đó gửi yêu cầu đến ứng dụng từ xa để trả về kết quả.

API key từ xa cũng cần có quyền truy cập dữ liệu tương ứng, nếu không truy vấn sẽ thất bại.

#### Bảng điều khiển SQL

Bảng điều khiển SQL là chế độ truy vấn SQL của biểu đồ và chỉ dùng để truy vấn. Ứng dụng hiện tại chịu trách nhiệm lưu cấu hình SQL và khởi tạo lệnh gọi; SQL sẽ được chuyển tiếp để thực thi trong ứng dụng từ xa.

Khi sử dụng bảng điều khiển SQL, người dùng cục bộ cần có quyền cấu hình giao diện người dùng trong ứng dụng hiện tại, đồng thời API key từ xa cũng cần có quyền cấu hình giao diện người dùng trong ứng dụng từ xa. SQL sẽ không phân tách các tham số truy vấn theo quyền bảng dữ liệu và trường như bảng điều khiển truy vấn, vì vậy hãy thận trọng khi cấp quyền cấu hình giao diện người dùng cho người dùng cục bộ và API key tương ứng.

### Workflow

Nguồn dữ liệu NocoBase bên ngoài có thể liên quan đến hai bộ workflow trong ứng dụng hiện tại và ứng dụng từ xa. Ứng dụng hiện tại xử lý các sự kiện trong chuỗi yêu cầu của trang, nút và API cục bộ; sau khi nhận được yêu cầu được chuyển tiếp, ứng dụng từ xa sẽ xử lý theo cấu hình workflow riêng.

Cần lưu ý rằng ứng dụng hiện tại sẽ không lắng nghe các sự kiện thêm, cập nhật và xóa phát sinh bên trong bảng dữ liệu từ xa. Sự kiện của bảng dữ liệu từ xa chỉ được kích hoạt trong ứng dụng từ xa.

#### Các trigger

Bảng dưới đây mô tả tình huống kích hoạt trong ứng dụng hiện tại và ứng dụng từ xa của các trigger chịu ảnh hưởng của nguồn dữ liệu NocoBase bên ngoài khi workflow tương ứng đã được bật.

| Trigger           | Ứng dụng hiện tại | Ứng dụng từ xa       | Mô tả                                                                                         |
| ---------------- | -------- | -------------- | -------------------------------------------------------------------------------------------- |
| Sự kiện trước yêu cầu       | Kích hoạt     | Chỉ kích hoạt ở chế độ toàn cục | Ứng dụng hiện tại kích hoạt ở chế độ toàn cục, chế độ cục bộ kích hoạt theo liên kết nút của ứng dụng hiện tại; sau khi ứng dụng từ xa nhận được yêu cầu được chuyển tiếp, chỉ chế độ toàn cục được kích hoạt |
| Sự kiện sau yêu cầu       | Kích hoạt     | Chỉ kích hoạt ở chế độ toàn cục | Ứng dụng hiện tại kích hoạt ở chế độ toàn cục, chế độ cục bộ kích hoạt theo liên kết nút của ứng dụng hiện tại; sau khi ứng dụng từ xa nhận được yêu cầu được chuyển tiếp, chỉ chế độ toàn cục được kích hoạt |
| Sự kiện thao tác tùy chỉnh   | Kích hoạt     | Không kích hoạt         | Nút 「Kích hoạt workflow」 được liên kết trong ứng dụng hiện tại sẽ kích hoạt quy trình cục bộ; yêu cầu CRUD được chuyển tiếp sẽ không kích hoạt sự kiện thao tác tùy chỉnh từ xa     |
| Sự kiện bảng dữ liệu       | Không kích hoạt   | Kích hoạt           | Dữ liệu thực tế thay đổi ở ứng dụng từ xa, ứng dụng hiện tại không kích hoạt sự kiện bảng dữ liệu cục bộ; ứng dụng từ xa kích hoạt sự kiện bảng dữ liệu của chính nó               |
| Kích hoạt định kỳ theo trường ngày | Không kích hoạt   | Kích hoạt           | Ứng dụng hiện tại không kích hoạt dựa trên trường của bảng dữ liệu từ xa; ứng dụng từ xa kích hoạt theo cấu hình trường ngày của chính nó                         |

Các trigger không phụ thuộc vào nguồn dữ liệu sẽ được kích hoạt trong ứng dụng hiện tại và ứng dụng từ xa theo cấu hình tương ứng.

Nếu cần xây dựng quy trình thao tác với dữ liệu NocoBase bên ngoài trong ứng dụng hiện tại, bạn nên sử dụng sự kiện trước yêu cầu, sự kiện sau yêu cầu hoặc sự kiện thao tác tùy chỉnh. Các workflow đã có trong ứng dụng từ xa sẽ được ứng dụng từ xa thực thi độc lập.

#### Node

Bảng dưới đây chỉ liệt kê các node liên quan đến nguồn dữ liệu. Các node dùng chung như điều kiện, tính toán, vòng lặp và xử lý JSON không phụ thuộc vào loại nguồn dữ liệu, có thể sử dụng như workflow thông thường.

| Node     | Có thể sử dụng | Mô tả                              |
| -------- | -------- | --------------------------------- |
| Truy vấn bản ghi | Có thể sử dụng     | Truy vấn các bản ghi trong ứng dụng từ xa              |
| Tạo bản ghi | Có thể sử dụng     | Tạo bản ghi trong ứng dụng từ xa                |
| Cập nhật bản ghi | Có thể sử dụng     | Cập nhật các bản ghi trong ứng dụng từ xa              |
| Xóa bản ghi | Có thể sử dụng     | Xóa các bản ghi trong ứng dụng từ xa              |
| Node SQL | Không thể sử dụng   | Node SQL của workflow chỉ hỗ trợ nguồn dữ liệu cơ sở dữ liệu |
| Node tổng hợp | Không thể sử dụng   | Node tổng hợp chỉ hỗ trợ nguồn dữ liệu cơ sở dữ liệu        |

## Câu hỏi thường gặp

### Bảng dữ liệu không xuất hiện

Kiểm tra xem nguồn dữ liệu đã được bật hay chưa, đồng thời kiểm tra địa chỉ API và API key có chính xác hay không. Ứng dụng từ xa cũng cần cho phép API key đó truy cập vào bảng dữ liệu tương ứng.

### Tải tệp lên thành công nhưng không thể xem trước

Nếu ứng dụng hiện tại hoặc ứng dụng từ xa sử dụng bộ lưu trữ tệp cục bộ, hãy kiểm tra Origin có được điền bằng địa chỉ truy cập công khai của ứng dụng tương ứng hay không. Origin không nên được điền bằng địa chỉ API.

### Ứng dụng hiện tại có quyền nhưng thao tác thất bại

Kiểm tra quyền của API key trong ứng dụng từ xa. Nguồn dữ liệu NocoBase bên ngoài đồng thời chịu ảnh hưởng của quyền trong ứng dụng hiện tại và quyền trong ứng dụng từ xa.

### Bảng dữ liệu không thể sử dụng sau khi dịch vụ từ xa gặp sự cố

Nếu ứng dụng từ xa gặp lỗi 502, khởi động lại hoặc tạm thời không khả dụng, ứng dụng hiện tại có thể tạm thời không đọc được siêu dữ liệu của bảng dữ liệu từ xa. Sau khi dịch vụ từ xa khôi phục, ứng dụng hiện tại sẽ tự động tải lại siêu dữ liệu vào lần tiếp theo truy cập các bảng dữ liệu của nguồn dữ liệu này.

### Tại sao không thể cấu hình trường trong ứng dụng hiện tại

Nguồn dữ liệu NocoBase bên ngoài sử dụng cấu trúc bảng dữ liệu và cấu hình trường của ứng dụng từ xa. Hãy điều chỉnh trường trong ứng dụng từ xa, sau đó quay lại ứng dụng hiện tại để tải lại bảng dữ liệu.
