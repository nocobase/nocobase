---
title: "Biến và Secret"
description: "Biến và Secret quản lý vận hành: cấu hình tập trung biến môi trường và secret, hỗ trợ lưu trữ dữ liệu nhạy cảm, tái sử dụng cấu hình, cô lập environment, sự khác biệt với .env, cấu hình SMTP workflow, cấu hình kết nối database."
keywords: "Biến và Secret,biến môi trường,dữ liệu nhạy cảm,tái sử dụng cấu hình,cô lập environment,quản lý vận hành,NocoBase"
---

# Biến và Secret

<PluginInfo name="environment-variables"></PluginInfo>

## Giới thiệu

Cấu hình và quản lý tập trung biến môi trường và secret, dùng cho lưu trữ dữ liệu nhạy cảm, tái sử dụng cấu hình dữ liệu, cô lập cấu hình environment...

## Sự khác biệt với `.env`

| **Đặc tính**     | **File `.env`**                                         | **Biến môi trường và Secret cấu hình động**                                             |
| ------------ | ------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Vị trí lưu trữ** | Lưu trữ trong file `.env` ở thư mục gốc dự án                        | Lưu trữ trong table `environmentVariables` của database                                 |
| **Cách load** | Qua các tool như `dotenv` load vào `process.env` khi application khởi động | Đọc động, load vào `app.environment` khi application khởi động                        |
| **Cách sửa đổi** | Cần chỉnh sửa file trực tiếp, sau khi sửa cần khởi động lại application mới có hiệu lực            | Hỗ trợ sửa đổi tại runtime, sau khi sửa chỉ cần reload cấu hình application là được                             |
| **Cô lập environment** | Mỗi environment (development, test, production) cần duy trì file `.env` riêng    | Mỗi environment (development, test, production) cần duy trì dữ liệu của table `environmentVariables` riêng |
| **Tình huống áp dụng** | Phù hợp với cấu hình tĩnh cố định, như thông tin database chính của application                  | Phù hợp với cấu hình động cần điều chỉnh thường xuyên hoặc gắn với business logic, như database bên ngoài, file storage... |

## Cài đặt

Plugin tích hợp sẵn, không cần cài đặt riêng.

## Mục đích

### Tái sử dụng cấu hình dữ liệu

Ví dụ workflow ở nhiều nơi cần Node email, đều cần cấu hình SMTP, có thể lưu cấu hình SMTP chung vào biến môi trường.

![20250102181045](https://static-docs.nocobase.com/20250102181045.png)

### Lưu trữ dữ liệu nhạy cảm

Lưu trữ thông tin cấu hình của các database bên ngoài, secret của cloud file storage...

![20250102103513](https://static-docs.nocobase.com/20250102103513.png)

### Cô lập cấu hình environment

Trong các environment khác nhau như phát triển software, kiểm thử và production, sử dụng chiến lược quản lý cấu hình độc lập để đảm bảo cấu hình và dữ liệu của mỗi environment không can thiệp lẫn nhau. Mỗi environment có cài đặt, biến và resource độc lập riêng, điều này có thể tránh xung đột giữa environment phát triển, kiểm thử và production, đồng thời đảm bảo hệ thống chạy đúng như mong đợi trong mỗi environment.

Ví dụ, dịch vụ file storage, cấu hình của environment phát triển và environment production có thể khác nhau, như sau:

Environment phát triển

```bash
FILE_STORAGE_OSS_BASE_URL=dev-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=dev-storage
```

Environment production

```bash
FILE_STORAGE_OSS_BASE_URL=prod-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=prod-storage
```

## Quản lý biến môi trường

![20250102155314](https://static-docs.nocobase.com/20250102155314.png)

### Thêm biến môi trường

- Hỗ trợ thêm đơn lẻ và hàng loạt
- Hỗ trợ plain text và mã hóa

![20250102155509](https://static-docs.nocobase.com/20250102155509.png)

Thêm đơn lẻ

![20250102155731](https://static-docs.nocobase.com/20250102155731.png)

Thêm hàng loạt

![20250102155258](https://static-docs.nocobase.com/20250102155258.png)

## Lưu ý

### Khởi động lại application

Sau khi sửa đổi hoặc xóa biến môi trường, sẽ xuất hiện thông báo khởi động lại application ở trên cùng, biến môi trường đã thay đổi chỉ có hiệu lực sau khi khởi động lại.

![20250102155007](https://static-docs.nocobase.com/20250102155007.png)

### Lưu trữ mã hóa

Dữ liệu mã hóa của biến môi trường sử dụng mã hóa đối xứng AES, PRIVATE KEY mã hóa và giải mã được lưu trong storage, vui lòng giữ kỹ, nếu mất hoặc ghi đè, dữ liệu mã hóa sẽ không thể giải mã.

```bash
./storage/environment-variables/<app-name>/aes_key.dat
```

## Các plugin hiện hỗ trợ biến môi trường

### Action: Custom request

![20250102180751](https://static-docs.nocobase.com/20250102180751.png)

### Auth: CAS

![20250102160129](https://static-docs.nocobase.com/20250102160129.png)

### Auth: DingTalk

![20250102160205](https://static-docs.nocobase.com/20250102160205.png)

### Auth: LDAP

![20250102160312](https://static-docs.nocobase.com/20250102160312.png)

### Auth: OIDC

![20250102160426](https://static-docs.nocobase.com/20250102160426.png)

### Auth: SAML

![20250102160652](https://static-docs.nocobase.com/20250102160652.png)

### Auth: WeCom

![20250102160758](https://static-docs.nocobase.com/20250102160758.png)

### Data source: External MariaDB

![20250102160935](https://static-docs.nocobase.com/20250102160935.png)

### Data source: External MySQL

![20250102173602](https://static-docs.nocobase.com/20250102173602.png)

### Data source: External Oracle

![20250102174153](https://static-docs.nocobase.com/20250102174153.png)

### Data source: External PostgreSQL

![20250102175630](https://static-docs.nocobase.com/20250102175630.png)

### Data source: External SQL Server

![20250102175814](https://static-docs.nocobase.com/20250102175814.png)

### Data source: KingbaseES

![20250102175951](https://static-docs.nocobase.com/20250102175951.png)

### Data source: REST API

![20250102180109](https://static-docs.nocobase.com/20250102180109.png)

### File storage: Local

![20250102161114](https://static-docs.nocobase.com/20250102161114.png)

### File storage: Aliyun OSS

![20250102161404](https://static-docs.nocobase.com/20250102161404.png)

### File storage: Amazon S3

![20250102163730](https://static-docs.nocobase.com/20250102163730.png)

### File storage: Tencent COS

![20250102173109](https://static-docs.nocobase.com/20250102173109.png)

### File storage: S3 Pro

Chưa thích ứng

### Map: AMap

![20250102163803](https://static-docs.nocobase.com/20250102163803.png)

### Map: Google

![20250102171524](https://static-docs.nocobase.com/20250102171524.png)

### Email settings

Chưa thích ứng

### Notification: Email

![20250102164059](https://static-docs.nocobase.com/20250102164059.png)

### Public forms

![20250102163849](https://static-docs.nocobase.com/20250102163849.png)

### System settings

![20250102164139](https://static-docs.nocobase.com/20250102164139.png)

### Verification: Aliyun SMS

![20250102164247](https://static-docs.nocobase.com/20250102164247.png)

### Verification: Tencent SMS

![20250102165814](https://static-docs.nocobase.com/20250102165814.png)

### Workflow

![20250102180537](https://static-docs.nocobase.com/20250102180537.png)
