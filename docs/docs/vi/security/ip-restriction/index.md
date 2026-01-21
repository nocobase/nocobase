---
pkg: "@nocobase/plugin-ip-restriction"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::



# Giới hạn IP

## Giới thiệu

NocoBase cho phép quản trị viên thiết lập danh sách trắng hoặc danh sách đen cho IP truy cập của người dùng, nhằm hạn chế các kết nối mạng bên ngoài trái phép hoặc chặn các địa chỉ IP độc hại đã biết, từ đó giảm thiểu rủi ro bảo mật. Đồng thời, NocoBase cũng hỗ trợ quản trị viên truy vấn nhật ký từ chối truy cập để xác định các IP rủi ro.

## Quy tắc cấu hình

![2025-01-23-10-07-34-20250123100733](https://static-docs.nocobase.com/2025-01-23-10-07-34-20250123100733.png)

### Chế độ lọc IP

- **Danh sách đen**: Khi IP truy cập của người dùng khớp với một IP trong danh sách, hệ thống sẽ **từ chối** truy cập; các IP không khớp mặc định sẽ được **cho phép** truy cập.
- **Danh sách trắng**: Khi IP truy cập của người dùng khớp với một IP trong danh sách, hệ thống sẽ **cho phép** truy cập; các IP không khớp mặc định sẽ bị **cấm** truy cập.

### Danh sách IP

Dùng để định nghĩa các địa chỉ IP được phép hoặc bị cấm truy cập vào hệ thống. Chức năng cụ thể của nó phụ thuộc vào chế độ lọc IP đã chọn. Hỗ trợ nhập địa chỉ IP hoặc địa chỉ dải mạng CIDR, nhiều địa chỉ có thể được phân tách bằng dấu phẩy hoặc xuống dòng.

## Truy vấn nhật ký

Sau khi người dùng bị từ chối truy cập, IP truy cập sẽ được ghi vào nhật ký hệ thống, và bạn có thể tải xuống tệp nhật ký tương ứng để phân tích.

![2025-01-17-13-33-51-20250117133351](https://static-docs.nocobase.com/2025-01-17-13-33-51-20250117133351.png)

Ví dụ nhật ký:

![2025-01-14-14-42-06-20250114144205](https://static-docs.nocobase.com/2025-01-14-14-42-06-20250114144205.png)

## Khuyến nghị cấu hình

### Khuyến nghị cho chế độ Danh sách đen

- Thêm các địa chỉ IP độc hại đã biết để ngăn chặn các cuộc tấn công mạng tiềm ẩn.
- Thường xuyên kiểm tra và cập nhật danh sách đen, loại bỏ các địa chỉ IP không hợp lệ hoặc không còn cần chặn.

### Khuyến nghị cho chế độ Danh sách trắng

- Thêm các địa chỉ IP mạng nội bộ đáng tin cậy (ví dụ: dải mạng văn phòng) để đảm bảo truy cập an toàn vào các hệ thống cốt lõi.
- Tránh đưa các địa chỉ IP được cấp phát động vào danh sách trắng để ngăn ngừa gián đoạn truy cập.

### Khuyến nghị chung

- Sử dụng dải mạng CIDR để đơn giản hóa cấu hình, ví dụ: dùng `192.168.0.0/24` thay vì thêm từng địa chỉ IP riêng lẻ.
- Thường xuyên sao lưu cấu hình danh sách IP để có thể khôi phục nhanh chóng khi có lỗi thao tác hoặc sự cố hệ thống.
- Thường xuyên giám sát nhật ký truy cập để xác định các IP bất thường và điều chỉnh danh sách đen/trắng kịp thời.