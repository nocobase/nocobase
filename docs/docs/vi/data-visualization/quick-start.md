:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Bắt đầu nhanh

Hướng dẫn này sẽ giúp bạn cấu hình một biểu đồ từ đầu bằng cách sử dụng các tính năng cơ bản và cần thiết. Các khả năng tùy chọn khác sẽ được trình bày chi tiết trong các chương sau.

Điều kiện tiên quyết:
- Đã cấu hình nguồn dữ liệu và bộ sưu tập (bảng dữ liệu), đồng thời có quyền đọc.

## Thêm khối biểu đồ

Trong trình thiết kế trang, hãy nhấp vào "Thêm khối", chọn "Biểu đồ" và thêm một khối biểu đồ.

![clipboard-image-1761554593](https://static-docs.nocobase.com/clipboard-image-1761554593.png)

Sau khi thêm, nhấp vào "Cấu hình" ở góc trên bên phải của khối.

![clipboard-image-1761554709](https://static-docs.nocobase.com/clipboard-image-1761554709.png)

Bảng cấu hình biểu đồ sẽ mở ra ở phía bên phải. Bảng này bao gồm ba phần: Truy vấn dữ liệu, Tùy chọn biểu đồ và Sự kiện.

![clipboard-image-1761554848](https://static-docs.nocobase.com/clipboard-image-1761554848.png)

## Cấu hình truy vấn dữ liệu
Trong bảng "Truy vấn dữ liệu", bạn có thể cấu hình nguồn dữ liệu, điều kiện lọc truy vấn và các tùy chọn liên quan.

- Đầu tiên, chọn nguồn dữ liệu và bộ sưu tập
  - Trong bảng "Truy vấn dữ liệu", chọn nguồn dữ liệu và bộ sưu tập làm cơ sở cho truy vấn.
  - Nếu bộ sưu tập không thể chọn hoặc trống, trước tiên hãy kiểm tra xem nó đã được tạo chưa và người dùng hiện tại có quyền truy cập hay không.

- Cấu hình các số liệu (Measures)
  - Chọn một hoặc nhiều trường số làm số liệu.
  - Đặt hàm tổng hợp cho mỗi số liệu: Sum (Tổng) / Count (Đếm) / Avg (Trung bình) / Max (Tối đa) / Min (Tối thiểu).

- Cấu hình các chiều (Dimensions)
  - Chọn một hoặc nhiều trường làm chiều nhóm (ví dụ: ngày, danh mục, khu vực, v.v.).
  - Đối với các trường ngày/giờ, có thể đặt định dạng (ví dụ: `YYYY-MM`, `YYYY-MM-DD`) để hiển thị thống nhất.

![clipboard-image-1761555060](https://static-docs.nocobase.com/clipboard-image-1761555060.png)

Các điều kiện khác như lọc, sắp xếp và phân trang là tùy chọn.

## Chạy truy vấn và xem dữ liệu

- Nhấp vào "Chạy truy vấn" để lấy dữ liệu và hiển thị biểu đồ xem trước trực tiếp ở phía bên trái của trang.
- Bạn có thể nhấp vào "Xem dữ liệu" để xem trước kết quả dữ liệu trả về, hỗ trợ chuyển đổi giữa định dạng Bảng (Table) và JSON. Nhấp lại để thu gọn phần xem trước dữ liệu.
- Nếu kết quả dữ liệu trống hoặc không như mong đợi, hãy quay lại bảng truy vấn để kiểm tra quyền của bộ sưu tập, ánh xạ trường cho các số liệu/chiều và kiểu dữ liệu.

![clipboard-image-1761555228](https://static-docs.nocobase.com/clipboard-image-1761555228.png)

## Cấu hình tùy chọn biểu đồ

Trong bảng "Tùy chọn biểu đồ", bạn có thể chọn loại biểu đồ và cấu hình các tùy chọn của nó.

- Đầu tiên, chọn loại biểu đồ (ví dụ: đường/vùng, cột/thanh, tròn/vòng, phân tán, v.v.).
- Hoàn tất ánh xạ trường cốt lõi:
  - Biểu đồ đường/vùng/cột/thanh: `xField` (chiều), `yField` (số liệu), `seriesField` (chuỗi, tùy chọn)
  - Biểu đồ tròn/vòng: `Category` (chiều phân loại), `Value` (số liệu)
  - Biểu đồ phân tán: `xField`, `yField` (hai số liệu hoặc chiều)
  - Để biết thêm cấu hình cho các loại biểu đồ khác, bạn có thể tham khảo tài liệu ECharts: [Axis](https://echarts.apache.org/handbook/en/concepts/axis)
- Sau khi nhấp vào "Chạy truy vấn", ánh xạ trường sẽ tự động hoàn tất theo mặc định. Nếu bạn thay đổi các chiều/số liệu, vui lòng kiểm tra lại ánh xạ.

![clipboard-image-1761555586](https://static-docs.nocobase.com/clipboard-image-1761555586.png)

## Xem trước và Lưu
Các thay đổi cấu hình sẽ tự động cập nhật xem trước theo thời gian thực, bạn có thể xem biểu đồ ở phía bên trái của trang. Tuy nhiên, xin lưu ý rằng tất cả các thay đổi sẽ chưa được lưu thực sự cho đến khi bạn nhấp vào nút "Lưu".

Bạn cũng có thể sử dụng các nút ở phía dưới:

- **Xem trước**: Các thay đổi cấu hình sẽ tự động làm mới phần xem trước theo thời gian thực. Bạn cũng có thể nhấp vào nút "Xem trước" ở phía dưới để kích hoạt làm mới thủ công.
- **Hủy**: Nếu bạn không muốn giữ lại các thay đổi cấu hình hiện tại, bạn có thể nhấp vào nút "Hủy" ở phía dưới hoặc làm mới trang để hoàn tác các thay đổi này và quay về trạng thái đã lưu trước đó.
- **Lưu**: Nhấp vào "Lưu" để thực sự lưu tất cả các cấu hình truy vấn và biểu đồ hiện tại vào cơ sở dữ liệu, các thay đổi này sẽ có hiệu lực đối với tất cả người dùng.

![clipboard-image-1761555803](https://static-docs.nocobase.com/clipboard-image-1761555803.png)

## Các lưu ý thường gặp

- Cấu hình tối thiểu khả dụng: Chọn một bộ sưu tập + ít nhất một số liệu; nên thêm các chiều để dễ dàng hiển thị theo nhóm.
- Đối với chiều ngày, nên đặt định dạng phù hợp (ví dụ: chọn `YYYY-MM` để thống kê theo tháng) để tránh trục X bị gián đoạn hoặc lộn xộn.
- Nếu truy vấn trống hoặc biểu đồ không hiển thị:
  - Kiểm tra bộ sưu tập/quyền và ánh xạ trường;
  - Trong "Xem dữ liệu", xác nhận tên cột và kiểu dữ liệu có khớp với ánh xạ biểu đồ hay không.
- Xem trước chỉ là tạm thời: Nó chỉ dùng để xác minh và điều chỉnh, chỉ có hiệu lực chính thức sau khi bạn nhấp vào "Lưu".