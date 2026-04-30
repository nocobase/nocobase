---
title: "Sản phẩm, Báo giá và Đơn hàng"
description: "Hướng dẫn quản lý danh mục Sản phẩm CRM, Báo giá (kèm quy trình phê duyệt), Đơn hàng: từ duy trì Sản phẩm đến phê duyệt Báo giá đến giao hàng Đơn hàng đầy đủ."
keywords: "Quản lý Sản phẩm,Báo giá,Quản lý Đơn hàng,Quy trình phê duyệt,Đa tiền tệ,NocoBase CRM"
---

# Sản phẩm, Báo giá và Đơn hàng

> Chương này bao quát nửa sau của quy trình bán hàng: duy trì danh mục Sản phẩm, tạo và phê duyệt Báo giá, cùng với theo dõi giao hàng và thu hồi vốn của Đơn hàng. Báo giá cũng được đề cập trong [Quản lý Cơ hội](./guide-opportunities) (từ góc nhìn Cơ hội), chương này tập trung vào góc nhìn Sản phẩm và Đơn hàng.

![cn_03-products-orders](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_03-products-orders.png)

## Danh mục Sản phẩm

Từ menu phía trên, vào trang **Sản phẩm**, gồm hai tab:

### Danh sách Sản phẩm

Bên trái là cây phân loại (lọc bằng JS), bên phải là bảng Sản phẩm. Mỗi Sản phẩm gồm: tên, mã, phân loại, quy cách, đơn vị, giá niêm yết, giá vốn, tiền tệ.

![03-products-orders-2026-04-07-01-18-03](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-18-03.png)

Khi tạo Sản phẩm mới, ngoài thông tin cơ bản, còn có thể cấu hình **bảng con giá theo bậc**:

| Trường | Mô tả |
|------|------|
| Tiền tệ | Tiền tệ định giá |
| Số lượng tối thiểu | Số lượng khởi đầu của bậc giá đó |
| Số lượng tối đa | Giới hạn số lượng của bậc giá đó |
| Đơn giá | Đơn giá tương ứng với phạm vi số lượng đó |
| Tỷ lệ chiết khấu | Tỷ lệ chiết khấu theo lô |


![03-products-orders-2026-04-07-01-18-51](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-18-51.png)

Khi tạo Báo giá, sau khi chọn Sản phẩm, hệ thống sẽ tự động khớp giá theo bậc dựa trên số lượng.

![03-products-orders-2026-04-07-01-19-39](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-19-39.png)

### Quản lý phân loại

Tab thứ hai là bảng dạng cây của phân loại Sản phẩm, hỗ trợ lồng nhau nhiều cấp. Nhấn "Thêm phân loại con" để tạo phân loại con dưới node hiện tại.

![03-products-orders-2026-04-07-01-20-19](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-20-19.png)

---

## Báo giá

Báo giá thường được tạo từ chi tiết Cơ hội (xem chương "Tạo Báo giá" của [Cơ hội và Báo giá](./guide-opportunities)), ở đây bổ sung chi tiết Sản phẩm và quy trình phê duyệt của Báo giá.

### Chi tiết Sản phẩm

Trong bảng con dòng chi tiết của Báo giá, sau khi chọn Sản phẩm, nhiều trường sẽ được tự động điền:

| Trường | Mô tả |
|------|------|
| **Sản phẩm** | Chọn từ danh mục Sản phẩm |
| **Quy cách** | Chỉ đọc, tự động điền sau khi chọn Sản phẩm |
| **Đơn vị** | Chỉ đọc, tự động điền |
| **Số lượng** | Điền thủ công |
| **Giá niêm yết** | Chỉ đọc, giá niêm yết trong danh mục Sản phẩm |
| **Đơn giá** | Chỉ đọc, tự động khớp giá theo bậc dựa trên số lượng |
| **Tỷ lệ chiết khấu** | Chỉ đọc, chiết khấu trong giá theo bậc |
| **Giá trị dòng** | Tự động tính toán |

![03-products-orders-2026-04-07-01-22-22](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-22-22.gif)

Hệ thống tự động hoàn thành chuỗi tính giá: tổng phụ → chiết khấu → thuế → phí vận chuyển → tổng giá trị → giá trị quy đổi USD.

![03-products-orders-2026-04-07-01-23-13](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-23-13.gif)

### Hỗ trợ đa tiền tệ

Nếu Khách hàng giao dịch bằng tiền tệ ngoài USD, chọn loại tiền tệ tương ứng. Hệ thống sẽ **khóa tỷ giá hiện tại** khi tạo, và tự động quy đổi sang giá trị USD. Quản lý tỷ giá được duy trì tại trang **Cài đặt → Tỷ giá**.

### Phê duyệt

Sau khi tạo Báo giá cần qua phê duyệt, sau khi duyệt thì tạo Đơn hàng mới.

---

## Quản lý Đơn hàng

Từ menu phía trên, vào trang **Đơn hàng**. Cũng có thể tạo trực tiếp từ Báo giá đã duyệt trong chi tiết Cơ hội bằng cách nhấn "New Order".

### Danh sách Đơn hàng

Phía trên trang có các nút lọc:

| Nút | Ý nghĩa |
|------|------|
| **Tất cả** | Tất cả Đơn hàng |
| **Đang xử lý** | Đơn hàng đang thực hiện |
| **Chờ thanh toán** | Đợi Khách hàng thanh toán |
| **Đã giao hàng** | Đã giao đợi xác nhận nhận hàng |
| **Đã hoàn thành** | Quy trình kết thúc |

![03-products-orders-2026-04-07-01-25-09](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-25-09.png)

### Cột tiến trình Đơn hàng

Cột "Tiến trình Đơn hàng" trong bảng dùng thanh tiến trình điểm-đường trực quan để hiển thị trạng thái hiện tại:

```
Chờ xác nhận → Đã xác nhận → Đang xử lý → Đã giao → Đã hoàn thành
```

Các bước đã hoàn thành sẽ làm nổi bật, các bước chưa đến sẽ làm mờ.

### Hàng tổng hợp

Thông tin tổng hợp ở dưới bảng:

- **Giá trị Đơn hàng đã chọn / tất cả**
- **Phân bố trạng thái thanh toán** (dạng nhãn)
- **Phân bố trạng thái Đơn hàng** (dạng nhãn)

![03-products-orders-2026-04-07-01-25-51](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-25-51.png)

### Tạo Đơn hàng

**Chuyển từ Báo giá sang Đơn hàng (khuyến nghị)**: Trong chi tiết Cơ hội, Báo giá có trạng thái Approved sẽ hiển thị nút "New Order", nhấn vào hệ thống sẽ tự động đưa Khách hàng, chi tiết Sản phẩm, giá trị, tiền tệ, tỷ giá... vào.

![03-products-orders-2026-04-07-01-27-16](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-27-16.png)

**Tạo thủ công**: Tại trang danh sách Đơn hàng, nhấn "Tạo mới", cần điền Khách hàng, chi tiết Sản phẩm, giá trị Đơn hàng, điều khoản thanh toán.

### Chuyển trạng thái Đơn hàng

Nhấn vào Đơn hàng để vào popup chi tiết, phía trên có luồng trạng thái tương tác, nhấn vào node trạng thái tiếp theo để chuyển. Mỗi lần đổi trạng thái sẽ được hệ thống ghi lại.

![03-products-orders-2026-04-07-01-27-50](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-27-50.png)

### Theo dõi thanh toán

Trạng thái Đơn hàng và trạng thái thanh toán là hai đường ray độc lập:

- **Trạng thái Đơn hàng**: Xác nhận → Xử lý → Giao hàng → Hoàn thành (quy trình giao hàng)
- **Trạng thái thanh toán**: Chờ thanh toán → Thanh toán một phần → Đã thanh toán (quy trình thu hồi vốn)

Hiện tại chúng tôi tập trung vào quy trình front-end của CRM, không có ràng buộc điều kiện đối với trạng thái Đơn hàng, chỉ là mục ghi nhận, nếu cần có thể dùng quy tắc liên động, sự kiện bảng dữ liệu để kiểm soát.

---

Sau khi Đơn hàng hoàn thành, toàn bộ vòng lặp khép kín bán hàng đã đi xong. Tiếp theo, hãy tìm hiểu cách quản lý [Khách hàng, Người liên hệ và Email](./guide-customers-emails).

## Trang liên quan

- [Hướng dẫn CRM](./index.md)
- [Quản lý Cơ hội](./guide-opportunities) — Thao tác Báo giá từ góc nhìn Cơ hội
- [Khách hàng, Người liên hệ và Email](./guide-customers-emails)
- [Dashboard](./guide-overview) — Truy xuất dữ liệu Đơn hàng
