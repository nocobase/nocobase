---
title: "Tổng quan"
description: "Loại Field datetime: có múi giờ/không có múi giờ, ngày, giờ, Unix timestamp, đối chiếu loại NocoBase/MySQL/PostgreSQL."
keywords: "datetime,DateTime,Field thời gian,có múi giờ,không có múi giờ,Unix timestamp,NocoBase"
---

# Tổng quan

## Các loại Field datetime

Các loại Field datetime bao gồm:

- **Datetime (có múi giờ)** - Datetime sẽ được chuyển đổi thống nhất sang giờ UTC (Giờ Phối hợp Quốc tế), và chuyển đổi múi giờ khi cần.
- **Datetime (không có múi giờ)** - Lưu trữ ngày và giờ không có thông tin múi giờ.
- **Ngày (không có giờ)** - Chỉ lưu trữ ngày, không bao gồm phần giờ.
- **Giờ** - Chỉ lưu trữ giờ, không bao gồm phần ngày.
- **Unix Timestamp** - Lưu trữ dưới dạng Unix timestamp, thường là số giây kể từ ngày 1 tháng 1 năm 1970.

Ví dụ về các loại Field liên quan đến ngày:

| **Loại Field**         | **Giá trị ví dụ**                 | **Mô tả**                                   |
|--------------------|---------------------------|--------------------------------------------|
| Datetime (có múi giờ)    | 2024-08-24T07:30:00.000Z   | Datetime sẽ được chuyển đổi thống nhất sang giờ UTC (Giờ Phối hợp Quốc tế)      |
| Datetime (không có múi giờ)  | 2024-08-24 15:30:00        | Datetime không có múi giờ, chỉ ghi ngày và giờ             |
| Ngày (không có giờ)     | 2024-08-24                 | Chỉ lưu trữ thông tin ngày, không bao gồm giờ                     |
| Giờ               | 15:30:00                   | Chỉ lưu trữ thông tin giờ, không bao gồm ngày                     |
| Unix Timestamp        | 1724437800                 | Số giây đã trôi qua tính từ giờ UTC 00:00:00 ngày 1 tháng 1 năm 1970 |

## Đối chiếu các Data Source

Bảng đối chiếu giữa NocoBase, MySQL và PostgreSQL:

| **Loại Field**       | **NocoBase**               | **MySQL**          | **PostgreSQL**                |
|------------------|-----------------------------|--------------------|-------------------------------|
| Datetime (có múi giờ)   | Datetime with timezone    | TIMESTAMP<br/> DATETIME | TIMESTAMP WITH TIME ZONE      |
| Datetime (không có múi giờ)  | Datetime without timezone  | DATETIME           | TIMESTAMP WITHOUT TIME ZONE   |
| Ngày (không có giờ)     | Date                      | DATE                 | DATE                          |
| Giờ               | Time                     | TIME                 | TIME WITHOUT TIME ZONE        |
| Unix Timestamp        | Unix timestamp            | INTEGER<br/>BIGINT   | INTEGER<br/>BIGINT              |
| Giờ (có múi giờ)      | -                         | -                  | TIME WITH TIME ZONE           |

Ghi chú:
- Phạm vi dữ liệu của MySQL TIMESTAMP nằm trong khoảng từ giờ UTC `1970-01-01 00:00:01 ~ 2038-01-19 03:14:07`. Khi vượt quá phạm vi này, nên sử dụng DATETIME hoặc BIGINT để lưu trữ Unix timestamp.

## Quy trình xử lý lưu trữ datetime

### Có múi giờ

Bao gồm `Datetime (không có múi giờ)` và `Unix Timestamp`

![20240824191933](https://static-docs.nocobase.com/20240824191933.png)

Ghi chú:
- Để hỗ trợ phạm vi dữ liệu rộng hơn, Field datetime (có múi giờ) của NocoBase sử dụng DATETIME trong database MySQL, giá trị ngày được lưu là giá trị đã chuyển đổi theo biến môi trường TZ của server. Nếu biến môi trường TZ thay đổi, giá trị lưu của datetime sẽ thay đổi.
- Giờ UTC và giờ địa phương có chênh lệch múi giờ, hiển thị trực tiếp giá trị UTC gốc có thể gây hiểu lầm cho người dùng.

### Không có múi giờ

![20240824185600](https://static-docs.nocobase.com/20240824185600.png)

## UTC

UTC (Giờ Phối hợp Quốc tế, Coordinated Universal Time) là chuẩn thời gian toàn cầu, được sử dụng để phối hợp và thống nhất thời gian ở các nơi trên thế giới. Đây là chuẩn thời gian có độ chính xác cao dựa trên đồng hồ nguyên tử và đồng bộ với thời gian quay của Trái Đất.

Giờ UTC và giờ địa phương có chênh lệch múi giờ, hiển thị trực tiếp giá trị UTC gốc có thể gây hiểu lầm cho người dùng, ví dụ:

| **Múi giờ**       | **Datetime**                      |
|----------------|----------------------------------|
| UTC            | 2024-08-24T07:30:00.000Z          |
| UTC+8 (Đông 8) | 2024-08-24 15:30:00               |
| UTC+5 (Đông 5) | 2024-08-24 12:30:00               |
| UTC-5 (Tây 5) | 2024-08-24 02:30:00               |
| Giờ Anh (UTC+0) | 2024-08-24 07:30:00              |
| Giờ Trung tâm (UTC-6) | 2024-08-23 01:30:00              |

Trên đây đều là cùng một thời điểm, chỉ khác nhau ở múi giờ.
