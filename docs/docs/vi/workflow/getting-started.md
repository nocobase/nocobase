:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Bắt đầu nhanh

## Cấu hình luồng công việc đầu tiên của bạn

Từ menu cấu hình plugin trên thanh menu trên cùng, truy cập trang quản lý plugin luồng công việc:

![Lối vào quản lý plugin luồng công việc](https://static-docs.nocobase.com/20251027222721.png)

Giao diện quản lý sẽ liệt kê tất cả các luồng công việc đã được tạo:

![Quản lý luồng công việc](https://static-docs.nocobase.com/20251027222900.png)

Nhấp vào nút “Tạo mới” để tạo một luồng công việc mới, sau đó chọn sự kiện bộ sưu tập:

![Tạo luồng công việc](https://static-docs.nocobase.com/20251027222951.png)

Sau khi gửi, nhấp vào liên kết “Cấu hình” trong danh sách để vào giao diện cấu hình luồng công việc:

![Một luồng công việc trống](https://static-docs.nocobase.com/20251027223131.png)

Tiếp theo, nhấp vào thẻ của trình kích hoạt để mở ngăn cấu hình trình kích hoạt. Chọn một bộ sưu tập đã tạo trước đó (ví dụ: bộ sưu tập “Bài viết”), chọn “Sau khi thêm bản ghi” cho thời điểm kích hoạt, sau đó nhấp vào nút “Lưu” để hoàn tất cấu hình trình kích hoạt:

![Cấu hình trình kích hoạt](https://static-docs.nocobase.com/20251027224735.png)

Sau đó, chúng ta có thể nhấp vào nút dấu cộng trong luồng để thêm một nút. Ví dụ, chọn một nút tính toán để nối trường “Tiêu đề” và trường “ID” từ dữ liệu của trình kích hoạt:

![Thêm nút tính toán](https://static-docs.nocobase.com/20251027224842.png)

Nhấp vào thẻ nút để mở ngăn cấu hình nút. Sử dụng hàm tính toán `CONCATENATE` do Formula.js cung cấp để nối các trường “Tiêu đề” và “ID”. Hai trường này được chèn thông qua bộ chọn biến:

![Nút tính toán sử dụng hàm và biến](https://static-docs.nocobase.com/20251027224939.png)

Sau đó, tạo một nút cập nhật bản ghi để lưu kết quả vào trường “Tiêu đề”:

![Tạo nút cập nhật bản ghi](https://static-docs.nocobase.com/20251027232654.png)

Tương tự, nhấp vào thẻ để mở ngăn cấu hình nút cập nhật bản ghi. Chọn bộ sưu tập “Bài viết”, chọn ID dữ liệu từ trình kích hoạt cho ID bản ghi cần cập nhật, chọn “Tiêu đề” cho trường cần cập nhật, và chọn kết quả từ nút tính toán cho giá trị cập nhật:

![Cấu hình nút cập nhật bản ghi](https://static-docs.nocobase.com/20251027232802.png)

Cuối cùng, nhấp vào công tắc “Bật”/“Tắt” trên thanh công cụ ở góc trên bên phải để chuyển luồng công việc sang trạng thái đã bật, nhờ đó luồng công việc có thể được kích hoạt và thực thi.

## Kích hoạt luồng công việc

Quay lại giao diện chính của hệ thống, tạo một bài viết thông qua khối bài viết và điền tiêu đề bài viết:

![Tạo dữ liệu bài viết](https://static-docs.nocobase.com/20251027233004.png)

Sau khi gửi và làm mới khối, bạn sẽ thấy tiêu đề bài viết đã tự động được cập nhật theo định dạng “Tiêu đề bài viết + ID bài viết”:

![Tiêu đề bài viết được sửa đổi bởi luồng công việc](https://static-docs.nocobase.com/20251027233043.png)

:::info{title=Mẹo}
Vì các luồng công việc được kích hoạt bởi sự kiện bộ sưu tập được thực thi không đồng bộ, bạn sẽ không thấy dữ liệu cập nhật ngay lập tức trên giao diện sau khi gửi dữ liệu. Tuy nhiên, sau một thời gian ngắn, bạn có thể thấy nội dung đã cập nhật bằng cách làm mới trang hoặc khối.
:::

## Xem lịch sử thực thi

Luồng công việc vừa rồi đã được kích hoạt và thực thi thành công một lần. Chúng ta có thể quay lại giao diện quản lý luồng công việc để xem lịch sử thực thi tương ứng:

![Xem danh sách luồng công việc](https://static-docs.nocobase.com/20251027233246.png)

Trong danh sách luồng công việc, bạn có thể thấy luồng công việc này đã tạo ra một lịch sử thực thi. Nhấp vào liên kết số lần để mở các bản ghi lịch sử thực thi của luồng công việc tương ứng:

![Danh sách lịch sử thực thi của luồng công việc tương ứng](https://static-docs.nocobase.com/20251027233341.png)

Nhấp vào liên kết “Xem” để vào trang chi tiết của lần thực thi đó, nơi bạn có thể thấy trạng thái thực thi và dữ liệu kết quả của mỗi nút:

![Chi tiết lịch sử thực thi luồng công việc](https://static-docs.nocobase.com/20251027233615.png)

Dữ liệu ngữ cảnh của trình kích hoạt và dữ liệu kết quả của việc thực thi nút đều có thể được xem bằng cách nhấp vào nút trạng thái ở góc trên bên phải của thẻ tương ứng. Ví dụ, chúng ta hãy xem dữ liệu kết quả của nút tính toán:

![Kết quả nút tính toán](https://static-docs.nocobase.com/20251027233635.png)

Bạn có thể thấy rằng dữ liệu kết quả của nút tính toán chứa tiêu đề đã được tính toán, đây chính là dữ liệu mà nút cập nhật bản ghi tiếp theo sẽ cập nhật.

## Tóm tắt

Thông qua các bước trên, chúng ta đã hoàn thành việc cấu hình và kích hoạt một luồng công việc đơn giản, đồng thời đã làm quen với các khái niệm cơ bản sau:

-   **Luồng công việc**: Dùng để định nghĩa thông tin cơ bản của một luồng, bao gồm tên, loại trình kích hoạt và trạng thái bật/tắt. Bạn có thể cấu hình bất kỳ số lượng nút nào trong đó. Đây là thực thể chứa luồng.
-   **Trình kích hoạt**: Mỗi luồng công việc chứa một trình kích hoạt, có thể được cấu hình với các điều kiện cụ thể để luồng công việc được kích hoạt. Đây là điểm vào của luồng.
-   **Nút**: Nút là một đơn vị lệnh trong một luồng công việc thực hiện một hành động cụ thể. Nhiều nút trong một luồng công việc tạo thành một quy trình thực thi hoàn chỉnh thông qua các mối quan hệ thượng nguồn và hạ nguồn.
-   **Thực thi**: Một thực thi là đối tượng thực thi cụ thể sau khi một luồng công việc được kích hoạt, còn được gọi là bản ghi thực thi hoặc lịch sử thực thi. Nó chứa thông tin như trạng thái thực thi và dữ liệu ngữ cảnh của trình kích hoạt. Ngoài ra còn có các kết quả thực thi tương ứng cho mỗi nút, bao gồm trạng thái thực thi và thông tin dữ liệu kết quả của nút.

Để sử dụng chuyên sâu hơn, bạn có thể tham khảo thêm các nội dung sau:

-   [Trình kích hoạt](./triggers/index)
-   [Nút](./nodes/index)
-   [Sử dụng biến](./advanced/variables)
-   [Thực thi](./advanced/executions)
-   [Quản lý phiên bản](./advanced/revisions)
-   [Tùy chọn nâng cao](./advanced/options)