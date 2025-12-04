---
pkg: "@nocobase/plugin-action-import-pro"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Import Pro

## Giới thiệu

Plugin Import Pro mang đến các tính năng nâng cao so với chức năng nhập liệu tiêu chuẩn.

## Cài đặt

Plugin này yêu cầu plugin Quản lý Tác vụ Bất đồng bộ. Để sử dụng, bạn cần bật plugin Quản lý Tác vụ Bất đồng bộ trước.

## Cải tiến tính năng

![20251029172052](https://static-docs.nocobase.com/20251029172052.png)

- Hỗ trợ các thao tác nhập liệu bất đồng bộ, thực thi trên một luồng độc lập, cho phép nhập liệu lượng lớn dữ liệu.

![20251029172129](https://static-docs.nocobase.com/20251029172129.png)

- Hỗ trợ các tùy chọn nhập liệu nâng cao.

## Hướng dẫn sử dụng

### Nhập liệu bất đồng bộ

Sau khi thực hiện nhập liệu, quá trình nhập liệu sẽ chạy trong một luồng nền độc lập mà không yêu cầu người dùng cấu hình thủ công. Trên giao diện người dùng, sau khi bắt đầu thao tác nhập liệu, tác vụ nhập liệu đang chạy sẽ hiển thị ở góc trên bên phải và hiển thị tiến độ tác vụ theo thời gian thực.

![index-2024-12-30-09-21-05](https://static-docs.nocobase.com/index-2024-12-30-09-21-05.png)

Sau khi quá trình nhập liệu hoàn tất, bạn có thể xem kết quả trong các tác vụ nhập liệu.

#### Về hiệu suất

Để đánh giá hiệu suất của việc nhập liệu dữ liệu quy mô lớn, chúng tôi đã thực hiện các bài kiểm tra so sánh trong các kịch bản, loại trường và cấu hình kích hoạt khác nhau (kết quả có thể khác nhau tùy thuộc vào cấu hình máy chủ và cơ sở dữ liệu, chỉ mang tính tham khảo):

| Khối lượng dữ liệu | Loại trường | Cấu hình nhập liệu | Thời gian xử lý |
|------|---------|---------|---------|
| 1 triệu bản ghi | Chuỗi, Số, Ngày, Email, Văn bản dài | • Kích hoạt luồng công việc: Không<br>• Nhận diện bản ghi trùng lặp: Không | Khoảng 1 phút |
| 500.000 bản ghi | Chuỗi, Số, Ngày, Email, Văn bản dài, Nhiều-nhiều | • Kích hoạt luồng công việc: Không<br>• Nhận diện bản ghi trùng lặp: Không | Khoảng 16 phút|
| 500.000 bản ghi | Chuỗi, Số, Ngày, Email, Văn bản dài, Nhiều-nhiều, Nhiều-một | • Kích hoạt luồng công việc: Không<br>• Nhận diện bản ghi trùng lặp: Không | Khoảng 22 phút |
| 500.000 bản ghi | Chuỗi, Số, Ngày, Email, Văn bản dài, Nhiều-nhiều, Nhiều-một | • Kích hoạt luồng công việc: Kích hoạt thông báo bất đồng bộ<br>• Nhận diện bản ghi trùng lặp: Không | Khoảng 22 phút |
| 500.000 bản ghi | Chuỗi, Số, Ngày, Email, Văn bản dài, Nhiều-nhiều, Nhiều-một | • Kích hoạt luồng công việc: Kích hoạt thông báo bất đồng bộ<br>• Nhận diện bản ghi trùng lặp: Cập nhật bản ghi trùng lặp, với 50.000 bản ghi trùng lặp | Khoảng 3 giờ |

Dựa trên kết quả kiểm tra hiệu suất trên và một số thiết kế hiện có, dưới đây là một số giải thích và đề xuất liên quan đến các yếu tố ảnh hưởng:

1.  **Cơ chế xử lý bản ghi trùng lặp**: Khi chọn tùy chọn **Cập nhật bản ghi trùng lặp** hoặc **Chỉ cập nhật bản ghi trùng lặp**, hệ thống sẽ thực hiện các thao tác truy vấn và cập nhật từng dòng một, điều này sẽ làm giảm đáng kể hiệu suất nhập liệu. Nếu tệp Excel của bạn chứa dữ liệu trùng lặp không cần thiết, nó sẽ ảnh hưởng đáng kể hơn nữa đến tốc độ nhập liệu. Bạn nên làm sạch dữ liệu trùng lặp không cần thiết trong tệp Excel (ví dụ: sử dụng các công cụ chuyên nghiệp để loại bỏ trùng lặp) trước khi nhập vào hệ thống, để tránh lãng phí thời gian không cần thiết.

2.  **Hiệu suất xử lý trường quan hệ**: Hệ thống xử lý các trường quan hệ bằng cách truy vấn các liên kết từng dòng một, điều này có thể trở thành nút thắt cổ chai về hiệu suất trong các kịch bản dữ liệu lớn. Đối với các cấu trúc quan hệ đơn giản (ví dụ: liên kết một-nhiều giữa hai bộ sưu tập), nên áp dụng chiến lược nhập liệu theo từng bước: trước tiên nhập dữ liệu cơ bản của bộ sưu tập chính, sau khi hoàn tất thì thiết lập quan hệ giữa các bộ sưu tập. Nếu yêu cầu nghiệp vụ bắt buộc phải nhập dữ liệu quan hệ đồng thời, vui lòng tham khảo kết quả kiểm tra hiệu suất trong bảng trên để lập kế hoạch thời gian nhập liệu hợp lý.

3.  **Cơ chế kích hoạt luồng công việc**: Không nên bật kích hoạt luồng công việc trong các kịch bản nhập liệu dữ liệu quy mô lớn, chủ yếu dựa trên hai lý do sau:
    -   Trạng thái tác vụ nhập liệu hiển thị 100% nhưng không kết thúc ngay lập tức. Hệ thống vẫn cần thêm thời gian để tạo các kế hoạch thực thi luồng công việc. Trong giai đoạn này, hệ thống sẽ tạo một kế hoạch thực thi luồng công việc tương ứng cho mỗi bản ghi được nhập, chiếm dụng luồng nhập liệu nhưng không ảnh hưởng đến việc sử dụng dữ liệu đã nhập.
    -   Sau khi tác vụ nhập liệu hoàn tất hoàn toàn, việc thực thi đồng thời một lượng lớn luồng công việc có thể gây căng thẳng tài nguyên hệ thống, ảnh hưởng đến tốc độ phản hồi tổng thể của hệ thống và trải nghiệm người dùng.

3 yếu tố ảnh hưởng trên sẽ được xem xét để tối ưu hóa thêm trong tương lai.

### Cấu hình nhập liệu

#### Tùy chọn nhập liệu - Kích hoạt luồng công việc

![20251029172235](https://static-docs.nocobase.com/20251029172235.png)

Khi nhập liệu, bạn có thể chọn có kích hoạt luồng công việc hay không. Nếu tùy chọn này được chọn và bộ sưu tập dữ liệu đó được liên kết với một luồng công việc (sự kiện bộ sưu tập dữ liệu), quá trình nhập liệu sẽ kích hoạt thực thi luồng công việc theo từng dòng.

#### Tùy chọn nhập liệu - Nhận diện bản ghi trùng lặp

![20251029172421](https://static-docs.nocobase.com/20251029172421.png)

Chọn tùy chọn này và chọn chế độ tương ứng, hệ thống sẽ nhận diện và xử lý các bản ghi trùng lặp trong quá trình nhập liệu.

Các tùy chọn trong cấu hình nhập liệu sẽ được áp dụng làm giá trị mặc định. Quản trị viên có thể kiểm soát liệu có cho phép người tải lên sửa đổi các tùy chọn này hay không (ngoại trừ tùy chọn kích hoạt luồng công việc).

**Cài đặt quyền của người tải lên**

![20251029172516](https://static-docs.nocobase.com/20251029172516.png)

- Cho phép người tải lên sửa đổi tùy chọn nhập liệu

![20251029172617](https://static-docs.nocobase.com/20251029172617.png)

- Vô hiệu hóa quyền sửa đổi tùy chọn nhập liệu của người tải lên

![20251029172655](https://static-docs.nocobase.com/20251029172655.png)

##### Mô tả chế độ

-   **Bỏ qua bản ghi trùng lặp**: Truy vấn các bản ghi hiện có dựa trên nội dung của “Trường nhận diện”. Nếu bản ghi đã tồn tại, dòng này sẽ được bỏ qua; nếu không tồn tại, nó sẽ được nhập dưới dạng bản ghi mới.
-   **Cập nhật bản ghi trùng lặp**: Truy vấn các bản ghi hiện có dựa trên nội dung của “Trường nhận diện”. Nếu bản ghi đã tồn tại, bản ghi này sẽ được cập nhật; nếu không tồn tại, nó sẽ được nhập dưới dạng bản ghi mới.
-   **Chỉ cập nhật bản ghi trùng lặp**: Truy vấn các bản ghi hiện có dựa trên nội dung của “Trường nhận diện”. Nếu bản ghi đã tồn tại, bản ghi này sẽ được cập nhật; nếu không tồn tại, nó sẽ được bỏ qua.

##### Trường nhận diện

Hệ thống nhận diện một dòng có phải là bản ghi trùng lặp hay không dựa trên giá trị của trường này.

-   [Quy tắc liên kết](/interface-builder/actions/action-settings/linkage-rule): Hiển thị/ẩn nút động;
-   [Nút chỉnh sửa](/interface-builder/actions/action-settings/edit-button): Chỉnh sửa tiêu đề, loại và biểu tượng của nút;