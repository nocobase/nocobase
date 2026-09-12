---
pkg: '@nocobase/plugin-ip-restriction'
title: "Hạn chế IP"
description: "Hạn chế IP: whitelist/blacklist IP, dải mạng CIDR, log từ chối truy cập, hạn chế truy cập trái phép, bảo vệ chống IP độc hại, tính năng phiên bản doanh nghiệp."
keywords: "Hạn chế IP,whitelist IP,blacklist IP,CIDR,log từ chối truy cập,phiên bản doanh nghiệp,NocoBase"
---

# Hạn chế IP

<PluginInfo licenseBundled="enterprise" name="ip-restriction"></PluginInfo>

## Giới thiệu

NocoBase hỗ trợ quản trị viên đặt whitelist hoặc blacklist cho IP truy cập của người dùng để hạn chế kết nối mạng bên ngoài trái phép hoặc chặn các địa chỉ IP độc hại đã biết, giảm rủi ro bảo mật. Đồng thời hỗ trợ quản trị viên truy vấn log từ chối truy cập, nhận diện IP rủi ro.

## Cấu hình quy tắc

![2025-01-23-10-07-34-20250123100733](https://static-docs.nocobase.com/2025-01-23-10-07-34-20250123100733.png)

### Chế độ lọc IP

- Blacklist: Khi IP truy cập của người dùng khớp với IP trong danh sách, hệ thống sẽ **từ chối** truy cập; các IP không khớp mặc định **cho phép** truy cập.
- Whitelist: Khi IP truy cập của người dùng khớp với IP trong danh sách, hệ thống sẽ **cho phép** truy cập; các IP không khớp mặc định **cấm** truy cập.

### Danh sách IP

Dùng để định nghĩa các địa chỉ IP được phép hoặc cấm truy cập hệ thống. Tác dụng cụ thể tùy thuộc vào kết quả lựa chọn chế độ lọc IP. Hỗ trợ nhập địa chỉ IP hoặc địa chỉ dải mạng CIDR, nhiều địa chỉ phân tách bằng dấu phẩy hoặc xuống dòng.

## Truy vấn log

Sau khi người dùng bị từ chối truy cập, IP truy cập sẽ được ghi vào log hệ thống, có thể tải file log tương ứng để phân tích.

![2025-01-17-13-33-51-20250117133351](https://static-docs.nocobase.com/2025-01-17-13-33-51-20250117133351.png)

Ví dụ log:

![2025-01-14-14-42-06-20250114144205](https://static-docs.nocobase.com/2025-01-14-14-42-06-20250114144205.png)

## Khuyến nghị cấu hình

### Khuyến nghị chế độ blacklist

Thêm các địa chỉ IP độc hại đã biết để ngăn chặn các cuộc tấn công mạng tiềm năng.
Định kỳ kiểm tra và cập nhật blacklist, xóa các địa chỉ IP không hợp lệ hoặc không cần chặn nữa.

### Khuyến nghị chế độ whitelist

Thêm các địa chỉ IP mạng nội bộ đáng tin cậy (như dải IP văn phòng) để đảm bảo truy cập an toàn vào hệ thống cốt lõi.
Tránh đưa các địa chỉ IP được cấp động vào whitelist để ngăn ngừa gián đoạn truy cập.

### Khuyến nghị chung

Sử dụng dải mạng CIDR để đơn giản hóa cấu hình, ví dụ thay vì thêm từng IP, sử dụng 192.168.0.0/24.
Định kỳ sao lưu cấu hình danh sách IP để khôi phục nhanh khi có lỗi thao tác hoặc lỗi hệ thống.
Định kỳ giám sát log truy cập, nhận diện các IP bất thường và điều chỉnh blacklist/whitelist kịp thời.
