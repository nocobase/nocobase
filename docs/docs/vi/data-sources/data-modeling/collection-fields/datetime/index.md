---
title: "Tổng quan"
description: "Các loại trường ngày giờ: có/không có múi giờ, ngày, giờ, dấu thời gian Unix, đối chiếu loại dữ liệu NocoBase/MySQL/PostgreSQL."
keywords: "ngày giờ,DateTime,trường thời gian,có múi giờ,không có múi giờ,dấu thời gian Unix,NocoBase"
---

# Tổng quan

## Các loại trường ngày giờ

Các loại trường ngày giờ bao gồm:

- **Ngày giờ (có múi giờ)** - Ngày giờ sẽ được chuyển đổi thống nhất sang giờ UTC (Giờ Phối hợp Quốc tế) và được chuyển đổi múi giờ khi cần;
- **Ngày giờ (không có múi giờ)** - Lưu trữ ngày và giờ không kèm thông tin múi giờ;
- **Ngày (không bao gồm giờ)** - Chỉ lưu trữ ngày, không bao gồm phần thời gian;
- **Giờ** - Chỉ lưu trữ giờ, không bao gồm phần ngày;
- **Dấu thời gian Unix** - Được lưu trữ dưới dạng dấu thời gian Unix, thường là số giây kể từ ngày 1 tháng 1 năm 1970.

Ví dụ về các loại trường liên quan đến ngày giờ:

| **Loại trường**         | **Giá trị ví dụ**                 | **Mô tả**                                   |
|--------------------|---------------------------|--------------------------------------------|
| Ngày giờ (có múi giờ)    | 2024-08-24T07:30:00.000Z   | Ngày giờ sẽ được chuyển đổi thống nhất sang giờ UTC (Giờ Phối hợp Quốc tế)      |
| Ngày giờ (không có múi giờ)  | 2024-08-24 15:30:00        | Ngày giờ không kèm múi giờ, chỉ ghi nhận ngày và giờ             |
| Ngày (không bao gồm giờ)     | 2024-08-24                 | Chỉ lưu trữ thông tin ngày, không bao gồm giờ                     |
| Giờ               | 15:30:00                   | Chỉ lưu trữ thông tin giờ, không bao gồm ngày                     |
| Dấu thời gian Unix        | 1724437800                 | Số giây đã trôi qua kể từ 00:00:00 ngày 1 tháng 1 năm 1970 theo giờ UTC |

## Đối chiếu các nguồn dữ liệu

Bảng đối chiếu giữa NocoBase, MySQL và PostgreSQL:

| **Loại trường**       | **NocoBase**               | **MySQL**          | **PostgreSQL**                |
|------------------|-----------------------------|--------------------|-------------------------------|
| Ngày giờ (có múi giờ)   | Datetime with timezone    | TIMESTAMP<br/> DATETIME | TIMESTAMP WITH TIME ZONE      |
| Ngày giờ (không có múi giờ)  | Datetime without timezone  | DATETIME           | TIMESTAMP WITHOUT TIME ZONE   |
| Ngày (không bao gồm giờ)     | Date                      | DATE                 | DATE                          |
| Giờ               | Time                     | TIME                 | TIME WITHOUT TIME ZONE        |
| Dấu thời gian Unix        | Unix timestamp            | INTEGER<br/>BIGINT   | INTEGER<br/>BIGINT              |
| Giờ (có múi giờ)      | -                         | -                  | TIME WITH TIME ZONE           |

Lưu ý:
- Phạm vi dữ liệu của TIMESTAMP trong MySQL nằm giữa giờ UTC `1970-01-01 00:00:01 ~ 2038-01-19 03:14:07`, khi vượt quá phạm vi này, nên sử dụng DATETIME hoặc BIGINT để lưu trữ dấu thời gian Unix.

## Quy trình xử lý việc lưu trữ ngày giờ

### Có múi giờ

Bao gồm`日期时间（不含时区）` và `Unix 时间戳`

![20240824191933](https://static-docs.nocobase.com/20240824191933.png)

Lưu ý:
- Để hỗ trợ phạm vi dữ liệu rộng hơn, trường ngày giờ (có múi giờ) của NocoBase được sử dụng DATETIME trong cơ sở dữ liệu MySQL. Giá trị ngày được lưu trữ là giá trị sau khi chuyển đổi theo biến môi trường TZ của máy chủ. Nếu biến môi trường TZ thay đổi, giá trị ngày giờ được lưu trữ cũng sẽ thay đổi.
- Giờ UTC và giờ địa phương có chênh lệch múi giờ, việc hiển thị trực tiếp giá trị UTC gốc có thể khiến người dùng hiểu nhầm.

### Không có múi giờ

![20240824185600](https://static-docs.nocobase.com/20240824185600.png)

## UTC

UTC (Giờ Phối hợp Quốc tế, Coordinated Universal Time) là tiêu chuẩn thời gian toàn cầu, được sử dụng để điều phối và thống nhất thời gian trên toàn thế giới. Đây là tiêu chuẩn thời gian có độ chính xác cao dựa trên đồng hồ nguyên tử và được duy trì đồng bộ với chuyển động tự quay của Trái Đất.

Giờ UTC và giờ địa phương có chênh lệch múi giờ, việc hiển thị trực tiếp giá trị UTC gốc có thể khiến người dùng hiểu nhầm, ví dụ:

| **Múi giờ**       | **Ngày giờ**                      |
|----------------|----------------------------------|
| UTC            | 2024-08-24T07:30:00.000Z          |
| Múi giờ phía Đông 8 (UTC+8) | 2024-08-24 15:30:00               |
| Múi giờ phía Đông 5 (UTC+5) | 2024-08-24 12:30:00               |
| Múi giờ phía Tây 5 (UTC-5) | 2024-08-24 02:30:00               |
| Giờ Anh (UTC+0) | 2024-08-24 07:30:00              |
| Giờ miền Trung (UTC-6) | 2024-08-23 01:30:00              |

Tất cả các giá trị trên đều biểu thị cùng một thời điểm, chỉ khác nhau về múi giờ.
