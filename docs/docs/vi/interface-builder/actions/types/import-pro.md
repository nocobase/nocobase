---
pkg: "@nocobase/plugin-action-import-pro"
title: "Action Import Pro"
description: "Action Import Pro: tính năng nhập nâng cao, hỗ trợ mẫu tùy chỉnh, nhập nhiều Table, xác thực dữ liệu."
keywords: "Import Pro,ImportPro,nhập nâng cao,mẫu tùy chỉnh,Interface Builder,NocoBase"
---
# Import Pro

## Giới thiệu

Plugin Import Pro cung cấp các tính năng nâng cao trên nền tảng tính năng nhập thông thường.

## Cài đặt

Plugin này phụ thuộc vào Plugin quản lý tác vụ bất đồng bộ, trước khi sử dụng cần bật Plugin quản lý tác vụ bất đồng bộ trước.

## Tính năng nâng cao

![20251029172052](https://static-docs.nocobase.com/20251029172052.png)



- Hỗ trợ Action nhập bất đồng bộ, thực thi trên thread độc lập, hỗ trợ nhập lượng dữ liệu lớn.

![20251029172129](https://static-docs.nocobase.com/20251029172129.png)

- Hỗ trợ tùy chọn nhập nâng cao.


## Hướng dẫn sử dụng

### Nhập bất đồng bộ

Sau khi thực hiện nhập, quy trình nhập sẽ thực thi trên thread nền độc lập, không cần bạn cấu hình thủ công. Trong giao diện người dùng, sau khi thực hiện thao tác nhập, phía trên bên phải sẽ hiển thị tác vụ nhập đang thực thi, và hiển thị tiến trình tác vụ theo thời gian thực.

![index-2024-12-30-09-21-05](https://static-docs.nocobase.com/index-2024-12-30-09-21-05.png)

Sau khi nhập kết thúc, có thể xem kết quả nhập trong tác vụ nhập.

#### Về đồng thời

Nếu muốn giới hạn việc chiếm dụng tài nguyên hệ thống khi tác vụ bất đồng bộ thực thi đồng thời, có thể sử dụng các biến môi trường sau để kiểm soát

- `ASYNC_TASK_MAX_CONCURRENCY`

Giới hạn số lượng tác vụ bất đồng bộ thực thi đồng thời, giá trị mặc định là 3

- `ASYNC_TASK_CONCURRENCY_MODE`

Chỉ định chế độ giới hạn thực thi đồng thời, các giá trị có thể chọn là `app` và `process`, mặc định là `app`.

Khi giá trị biến môi trường được đặt thành `app`, giới hạn mỗi sub-app có thể thực thi đồng thời tối đa số tác vụ bất đồng bộ là giá trị được chỉ định bởi `ASYNC_TASK_MAX_CONCURRENCY`.

Khi giá trị biến môi trường được đặt thành `process`, giới hạn tổng số tác vụ thực thi đồng thời của tất cả sub-app trong tiến trình không thể vượt quá giá trị được chỉ định bởi `ASYNC_TASK_MAX_CONCURRENCY`.

- `ASYNC_TASK_WORKER_MAX_OLD` và `ASYNC_TASK_WORKER_MAX_YOUNG`

Giới hạn bộ nhớ heap cũ tối đa (Mb) và bộ nhớ heap mới tối đa (Mb) có thể phân bổ cho thread worker thực thi tác vụ bất đồng bộ

#### Về hiệu năng

Để đánh giá hiệu năng nhập dữ liệu quy mô lớn, chúng tôi đã thực hiện các thử nghiệm so sánh dưới các trường hợp, loại Field và cấu hình kích hoạt khác nhau (cụ thể có thể có sự khác biệt dưới các cấu hình server, database khác nhau, chỉ để tham khảo):

| Lượng dữ liệu | Loại Field | Cấu hình nhập | Thời gian xử lý |
|------|---------|---------|---------|
| 1 triệu bản ghi | Chuỗi, số, ngày tháng, email, văn bản dài | • Kích hoạt workflow: Không<br>• Nhận diện trùng lặp: Không | Khoảng 1 phút |
| 500.000 bản ghi | Chuỗi, số, ngày tháng, email, văn bản dài, nhiều-nhiều | • Kích hoạt workflow: Không<br>• Nhận diện trùng lặp: Không | Khoảng 16 phút |
| 500.000 bản ghi | Chuỗi, số, ngày tháng, email, văn bản dài, nhiều-nhiều, nhiều-một | • Kích hoạt workflow: Không<br>• Nhận diện trùng lặp: Không | Khoảng 22 phút |
| 500.000 bản ghi | Chuỗi, số, ngày tháng, email, văn bản dài, nhiều-nhiều, nhiều-một | • Kích hoạt workflow: Kích hoạt thông báo bất đồng bộ<br>• Nhận diện trùng lặp: Không | Khoảng 22 phút |
| 500.000 bản ghi | Chuỗi, số, ngày tháng, email, văn bản dài, nhiều-nhiều, nhiều-một | • Kích hoạt workflow: Kích hoạt thông báo bất đồng bộ<br>• Nhận diện trùng lặp: Cập nhật trùng lặp, có 50.000 dữ liệu trùng lặp | Khoảng 3 giờ |

Theo kết quả thử nghiệm hiệu năng trên và một số thiết kế hiện có, có các giải thích và khuyến nghị sau về các yếu tố ảnh hưởng:

1. **Cơ chế xử lý bản ghi trùng lặp**: Khi chọn tùy chọn **Cập nhật bản ghi trùng lặp** hoặc **Chỉ cập nhật bản ghi trùng lặp**, hệ thống sẽ thực hiện thao tác truy vấn và cập nhật từng bản ghi, điều này sẽ làm giảm hiệu suất nhập đáng kể. Nếu Excel của bạn có dữ liệu trùng lặp không cần thiết, sẽ ảnh hưởng đáng kể hơn đến tốc độ nhập, khuyến nghị làm sạch dữ liệu trùng lặp không cần thiết trong Excel trước khi nhập (như sử dụng công cụ chuyên dụng để loại bỏ trùng lặp), sau đó nhập vào hệ thống, điều này có thể tránh lãng phí thời gian không cần thiết.

2. **Hiệu suất xử lý Field quan hệ**: Hệ thống xử lý Field quan hệ bằng cách truy vấn liên kết từng bản ghi, điều này sẽ trở thành điểm nghẽn hiệu suất trong các trường hợp dữ liệu lớn. Đối với cấu trúc quan hệ đơn giản (như liên kết một-nhiều giữa hai Table), khuyến nghị áp dụng chiến lược nhập theo bước: Trước tiên nhập dữ liệu cơ sở của Table chính, sau khi hoàn thành rồi mới thiết lập quan hệ giữa các Table. Nếu nhu cầu nghiệp vụ phải nhập dữ liệu quan hệ đồng thời, vui lòng tham khảo kết quả thử nghiệm hiệu suất trong bảng trên để lập kế hoạch thời gian nhập hợp lý.

3. **Cơ chế xử lý workflow**: Không khuyến nghị bật kích hoạt workflow trong các trường hợp nhập dữ liệu quy mô lớn, chủ yếu dựa trên hai khía cạnh sau:
   - Trạng thái tác vụ nhập hiển thị 100%, không kết thúc ngay lập tức, hệ thống vẫn cần thời gian bổ sung để xử lý việc tạo kế hoạch thực thi workflow. Trong giai đoạn này hệ thống sẽ tạo kế hoạch thực thi workflow tương ứng cho mỗi dữ liệu được nhập, chiếm dụng thread nhập, nhưng không ảnh hưởng đến việc sử dụng dữ liệu đã được nhập.
   - Sau khi tác vụ nhập hoàn toàn kết thúc, việc thực thi đồng thời nhiều workflow có thể dẫn đến tài nguyên hệ thống bị căng thẳng, ảnh hưởng đến tốc độ phản hồi tổng thể của hệ thống và trải nghiệm người dùng.

3 yếu tố ảnh hưởng trên sẽ được xem xét tối ưu hóa thêm sau này.

### Cấu hình nhập

#### Tùy chọn nhập - Có kích hoạt workflow hay không

![20251029172235](https://static-docs.nocobase.com/20251029172235.png)

Khi nhập có thể chọn có kích hoạt workflow hay không. Nếu đánh dấu tùy chọn này và Table dữ liệu này đã bind workflow (sự kiện Table dữ liệu), việc nhập sẽ kích hoạt workflow thực thi từng hàng.

#### Tùy chọn nhập - Nhận diện bản ghi trùng lặp

![20251029172421](https://static-docs.nocobase.com/20251029172421.png)

Đánh dấu tùy chọn này, chọn chế độ tương ứng, khi nhập sẽ nhận diện bản ghi trùng lặp và xử lý.

Các tùy chọn trong cấu hình nhập sẽ được áp dụng làm giá trị mặc định, admin có thể kiểm soát có cho phép người tải lên sửa đổi các tùy chọn này hay không (ngoại trừ tùy chọn kích hoạt workflow).

**Cài đặt quyền người tải lên**

![20251029172516](https://static-docs.nocobase.com/20251029172516.png)


- Cho phép người tải lên sửa đổi tùy chọn nhập

![20251029172617](https://static-docs.nocobase.com/20251029172617.png)

- Vô hiệu hóa người tải lên sửa đổi tùy chọn nhập

![20251029172655](https://static-docs.nocobase.com/20251029172655.png)

##### Giải thích chế độ

- Bỏ qua bản ghi trùng lặp: Truy vấn bản ghi hiện có theo nội dung của "Field theo", nếu bản ghi đã tồn tại, thì bỏ qua hàng này; nếu không tồn tại, thì nhập làm bản ghi mới.
- Cập nhật bản ghi trùng lặp: Truy vấn bản ghi hiện có theo nội dung của "Field theo", nếu bản ghi đã tồn tại, thì cập nhật bản ghi này; nếu không tồn tại, thì nhập làm bản ghi mới.
- Chỉ cập nhật bản ghi trùng lặp: Truy vấn bản ghi hiện có theo nội dung của "Field theo", nếu bản ghi đã tồn tại, thì cập nhật bản ghi này; nếu không tồn tại, thì bỏ qua.

##### Field theo

Hệ thống nhận diện hàng có phải là bản ghi trùng lặp hay không dựa trên giá trị Field này.


- [Quy tắc liên kết](/interface-builder/actions/action-settings/linkage-rule): hiển thị/ẩn nút bấm động;
- [Chỉnh sửa nút bấm](/interface-builder/actions/action-settings/edit-button): chỉnh sửa tiêu đề, loại, biểu tượng của nút bấm;
