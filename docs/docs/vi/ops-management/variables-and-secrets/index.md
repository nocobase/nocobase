---
pkg: "@nocobase/plugin-environment-variables"
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::



# Biến môi trường và Khóa bí mật

## Giới thiệu

Quản lý và cấu hình tập trung các biến môi trường và khóa bí mật, dùng để lưu trữ dữ liệu nhạy cảm, tái sử dụng dữ liệu cấu hình, cô lập cấu hình môi trường, v.v.

## Khác biệt so với `.env`

| **Đặc điểm** | **Tệp `.env`** | **Biến môi trường và Khóa bí mật được cấu hình động** |
| ------------ | ------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Vị trí lưu trữ** | Được lưu trữ trong tệp `.env` tại thư mục gốc của dự án | Được lưu trữ trong bảng `environmentVariables` trong cơ sở dữ liệu |
| **Phương thức tải** | Được tải vào `process.env` bằng các công cụ như `dotenv` khi ứng dụng khởi động | Được đọc động và tải vào `app.environment` khi ứng dụng khởi động |
| **Phương thức sửa đổi** | Yêu cầu chỉnh sửa trực tiếp tệp, ứng dụng cần được khởi động lại để các thay đổi có hiệu lực | Hỗ trợ sửa đổi trong thời gian chạy, các thay đổi có hiệu lực ngay lập tức sau khi tải lại cấu hình ứng dụng |
| **Cô lập môi trường** | Mỗi môi trường (phát triển, thử nghiệm, sản xuất) yêu cầu duy trì riêng các tệp `.env` | Mỗi môi trường (phát triển, thử nghiệm, sản xuất) yêu cầu duy trì riêng dữ liệu trong bảng `environmentVariables` |
| **Trường hợp áp dụng** | Phù hợp cho các cấu hình tĩnh cố định, chẳng hạn như thông tin cơ sở dữ liệu chính của ứng dụng | Phù hợp cho các cấu hình động cần điều chỉnh thường xuyên hoặc liên kết với logic nghiệp vụ, chẳng hạn như cơ sở dữ liệu bên ngoài, thông tin lưu trữ tệp, v.v. |

## Cài đặt

Đây là một plugin tích hợp sẵn, không cần cài đặt riêng.

## Mục đích sử dụng

### Tái sử dụng dữ liệu cấu hình

Ví dụ, nếu nhiều nơi trong một luồng công việc (workflow) cần các nút gửi email và đều yêu cầu cấu hình SMTP, bạn có thể lưu cấu hình SMTP chung vào các biến môi trường.

![20250102181045](https://static-docs.nocobase.com/20250102181045.png)

### Lưu trữ dữ liệu nhạy cảm

Lưu trữ các thông tin cấu hình cơ sở dữ liệu bên ngoài, khóa lưu trữ tệp trên đám mây, và các dữ liệu tương tự.

![20250102103513](https://static-docs.nocobase.com/20250102103513.png)

### Cô lập cấu hình môi trường

Trong các môi trường khác nhau như phát triển, thử nghiệm và sản xuất, chúng ta sử dụng các chiến lược quản lý cấu hình độc lập để đảm bảo rằng cấu hình và dữ liệu của mỗi môi trường không can thiệp lẫn nhau. Mỗi môi trường có các cài đặt, biến và tài nguyên độc lập riêng, điều này giúp tránh xung đột giữa các môi trường phát triển, thử nghiệm và sản xuất, đồng thời đảm bảo hệ thống hoạt động như mong đợi trong mỗi môi trường.

Ví dụ, đối với dịch vụ lưu trữ tệp, cấu hình cho môi trường phát triển và môi trường sản xuất có thể khác nhau, như sau:

Môi trường Phát triển

```bash
FILE_STORAGE_OSS_BASE_URL=dev-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=dev-storage
```

Môi trường Sản xuất

```bash
FILE_STORAGE_OSS_BASE_URL=prod-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=prod-storage
```

## Quản lý biến môi trường

![20250102155314](https://static-docs.nocobase.com/20250102155314.png)

### Thêm biến môi trường

- Hỗ trợ thêm từng biến hoặc thêm hàng loạt
- Hỗ trợ lưu trữ dưới dạng văn bản thuần túy (plaintext) và mã hóa

![20250102155509](https://static-docs.nocobase.com/20250102155509.png)

Thêm từng biến

![20250102155731](https://static-docs.nocobase.com/20250102155731.png)

Thêm hàng loạt

![20250102155258](https://static-docs.nocobase.com/20250102155258.png)

## Lưu ý

### Khởi động lại ứng dụng

Sau khi sửa đổi hoặc xóa biến môi trường, một thông báo yêu cầu khởi động lại ứng dụng sẽ xuất hiện ở phía trên. Các thay đổi đối với biến môi trường sẽ chỉ có hiệu lực sau khi ứng dụng được khởi động lại.

![20250102155007](https://static-docs.nocobase.com/20250102155007.png)

### Lưu trữ mã hóa

Dữ liệu mã hóa của các biến môi trường sử dụng mã hóa đối xứng AES. KHÓA RIÊNG TƯ (PRIVATE KEY) để mã hóa và giải mã được lưu trữ trong thư mục `storage`. Vui lòng bảo quản cẩn thận; nếu bị mất hoặc ghi đè, dữ liệu đã mã hóa sẽ không thể giải mã được.

```bash
./storage/environment-variables/<app-name>/aes_key.dat
```

## Các plugin hiện hỗ trợ biến môi trường

### Hành động: Yêu cầu tùy chỉnh

![20250102180751](https://static-docs.nocobase.com/20250102180751.png)

### Xác thực: CAS

![20250102160129](https://static-docs.nocobase.com/20250102160129.png)

### Xác thực: DingTalk

![20250102160205](https://static-docs.nocobase.com/20250102160205.png)

### Xác thực: LDAP

![20250102160312](https://static-docs.nocobase.com/20250102160312.png)

### Xác thực: OIDC

![20250102160426](https://static-docs.nocobase.com/20250102160426.png)

### Xác thực: SAML

![20250102160652](https://static-docs.nocobase.com/20250102160652.png)

### Xác thực: WeCom

![20250102160758](https://static-docs.nocobase.com/20250102160758.png)

### Nguồn dữ liệu: MariaDB bên ngoài

![20250102160935](https://static-docs.nocobase.com/20250102160935.png)

### Nguồn dữ liệu: MySQL bên ngoài

![20250102173602](https://static-docs.nocobase.com/20250102173602.png)

### Nguồn dữ liệu: Oracle bên ngoài

![20250102174153](https://static-docs.nocobase.com/20250102174153.png)

### Nguồn dữ liệu: PostgreSQL bên ngoài

![20250102175630](https://static-docs.nocobase.com/20250102175630.png)

### Nguồn dữ liệu: SQL Server bên ngoài

![20250102175814](https://static-docs.nocobase.com/20250102175814.png)

### Nguồn dữ liệu: KingbaseES

![20250102175951](https://static-docs.nocobase.com/20250102175951.png)

### Nguồn dữ liệu: REST API

![20250102180109](https://static-docs.nocobase.com/20250102180109.png)

### Lưu trữ tệp: Cục bộ

![20250102161114](https://static-docs.nocobase.com/20250102161114.png)

### Lưu trữ tệp: Aliyun OSS

![20250102161404](https://static-docs.nocobase.com/20250102161404.png)

### Lưu trữ tệp: Amazon S3

![20250102163730](https://static-docs.nocobase.com/20250102163730.png)

### Lưu trữ tệp: Tencent COS

![20250102173109](https://static-docs.nocobase.com/20250102173109.png)

### Lưu trữ tệp: S3 Pro

Chưa được hỗ trợ

### Bản đồ: AMap

![20250102163803](https://static-docs.nocobase.com/20250102163803.png)

### Bản đồ: Google

![20250102171524](https://static-docs.nocobase.com/20250102171524.png)

### Cài đặt Email

Chưa được hỗ trợ

### Thông báo: Email

![20250102164059](https://static-docs.nocobase.com/20250102164059.png)

### Biểu mẫu công khai

![20250102163849](https://static-docs.nocobase.com/20250102163849.png)

### Cài đặt hệ thống

![20250102164139](https://static-docs.nocobase.com/20250102164139.png)

### Xác minh: SMS Aliyun

![20250102164247](https://static-docs.nocobase.com/20250102164247.png)

### Xác minh: SMS Tencent

![20250102165814](https://static-docs.nocobase.com/20250102165814.png)

### Luồng công việc

![20250102180537](https://static-docs.nocobase.com/20250102180537.png)