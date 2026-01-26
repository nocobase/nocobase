:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Các loại trường Ngày giờ

## Các loại trường Ngày giờ

Các loại trường ngày giờ bao gồm:

-   **Ngày giờ (có múi giờ)** - Các giá trị ngày giờ sẽ được chuẩn hóa thành giờ UTC (Giờ Phối hợp Quốc tế) và được điều chỉnh múi giờ khi cần thiết.
-   **Ngày giờ (không múi giờ)** - Lưu trữ thông tin ngày và giờ mà không kèm theo múi giờ.
-   **Ngày (không giờ)** - Chỉ lưu trữ thông tin ngày, không bao gồm phần thời gian.
-   **Giờ** - Chỉ lưu trữ thông tin giờ, không bao gồm phần ngày.
-   **Dấu thời gian Unix** - Được lưu trữ dưới dạng dấu thời gian Unix, thường là số giây đã trôi qua kể từ ngày 1 tháng 1 năm 1970.

Dưới đây là các ví dụ cho từng loại trường ngày giờ:

| **Loại trường**           | **Giá trị ví dụ**          | **Mô tả**                                      |
|---------------------------|----------------------------|------------------------------------------------|
| Ngày giờ (có múi giờ)     | 2024-08-24T07:30:00.000Z   | Được chuyển đổi sang UTC và có thể điều chỉnh theo múi giờ |
| Ngày giờ (không múi giờ)  | 2024-08-24 15:30:00        | Lưu trữ ngày và giờ mà không kèm múi giờ       |
| Ngày (không giờ)          | 2024-08-24                 | Chỉ lưu trữ ngày, không có thông tin giờ        |
| Giờ                       | 15:30:00                   | Chỉ lưu trữ giờ, không bao gồm chi tiết ngày   |
| Dấu thời gian Unix        | 1724437800                 | Biểu thị số giây kể từ 00:00:00 UTC ngày 1 tháng 1 năm 1970 |

## So sánh các nguồn dữ liệu

Bảng so sánh giữa NocoBase, MySQL và PostgreSQL:

| **Loại trường**           | **NocoBase**               | **MySQL**                  | **PostgreSQL**                         |
|---------------------------|----------------------------|----------------------------|----------------------------------------|
| Ngày giờ (có múi giờ)     | Datetime with timezone     | TIMESTAMP<br/> DATETIME    | TIMESTAMP WITH TIME ZONE               |
| Ngày giờ (không múi giờ)  | Datetime without timezone  | DATETIME                   | TIMESTAMP WITHOUT TIME ZONE            |
| Ngày (không giờ)          | Date                       | DATE                       | DATE                                   |
| Giờ                       | Time                       | TIME                       | TIME WITHOUT TIME ZONE                 |
| Dấu thời gian Unix        | Unix timestamp             | INTEGER<br/>BIGINT         | INTEGER<br/>BIGINT                     |
| Giờ (có múi giờ)          | -                          | -                          | TIME WITH TIME ZONE                    |

**Lưu ý:**
-   Loại TIMESTAMP của MySQL có phạm vi dữ liệu từ `1970-01-01 00:00:01 UTC` đến `2038-01-19 03:14:07 UTC`. Đối với các ngày giờ nằm ngoài phạm vi này, bạn nên sử dụng DATETIME hoặc BIGINT để lưu trữ dấu thời gian Unix.

## Quy trình xử lý lưu trữ Ngày giờ

### Có múi giờ

Bao gồm `Ngày giờ (có múi giờ)` và `Dấu thời gian Unix`.

![20240824191933](https://static-docs.nocobase.com/20240824191933.png)

**Lưu ý:**
-   Để hỗ trợ phạm vi ngày rộng hơn, NocoBase sử dụng kiểu DATETIME trong MySQL cho các trường Ngày giờ (có múi giờ). Giá trị ngày được lưu trữ sẽ được chuyển đổi dựa trên biến môi trường TZ của máy chủ, điều này có nghĩa là nếu biến môi trường TZ thay đổi, giá trị Ngày giờ được lưu trữ cũng sẽ thay đổi.
-   Do có sự khác biệt múi giờ giữa UTC và giờ địa phương, việc hiển thị trực tiếp giá trị UTC thô có thể gây nhầm lẫn cho người dùng.

### Không múi giờ

![20240824185600](https://static-docs.nocobase.com/20240824185600.png)

## UTC

UTC (Giờ Phối hợp Quốc tế, Coordinated Universal Time) là tiêu chuẩn thời gian toàn cầu được sử dụng để điều phối và đồng bộ hóa thời gian trên khắp thế giới. Đây là một tiêu chuẩn thời gian có độ chính xác cao, được duy trì bởi đồng hồ nguyên tử và đồng bộ với sự tự quay của Trái Đất.

Sự khác biệt giữa giờ UTC và giờ địa phương có thể gây nhầm lẫn khi hiển thị trực tiếp các giá trị UTC thô. Ví dụ:

| **Múi giờ** | **Ngày giờ**             |
|-------------|--------------------------|
| UTC         | 2024-08-24T07:30:00.000Z |
| UTC+8       | 2024-08-24 15:30:00      |
| UTC+5       | 2024-08-24 12:30:00      |
| UTC-5       | 2024-08-24 02:30:00      |
| UTC+0       | 2024-08-24 07:30:00      |
| UTC-6       | 2024-08-23 01:30:00      |

Tất cả các thời gian trên đều biểu thị cùng một khoảnh khắc, chỉ khác nhau về múi giờ.