---
title: "Chiều cao Block"
description: "Cấu hình Block: cài đặt chiều cao Block, hỗ trợ các chế độ hiển thị như chiều cao cố định, tự thích ứng, toàn màn hình."
keywords: "chiều cao Block,cấu hình Block,cấu hình chiều cao,Interface Builder,NocoBase"
---

# Chiều cao Block

## Giới thiệu

Chiều cao Block hỗ trợ ba chế độ: **Chiều cao mặc định**, **Chiều cao chỉ định**, **Chiều cao đầy đủ**. Hầu hết các Block đều hỗ trợ cài đặt chiều cao.
![20260211153947](https://static-docs.nocobase.com/20260211153947.png)

![20260211154020](https://static-docs.nocobase.com/20260211154020.png)

## Chế độ chiều cao

### Chiều cao mặc định

Các loại Block khác nhau có chiến lược chiều cao mặc định khác nhau. Ví dụ Block Table và Block Form sẽ tự thích ứng chiều cao theo nội dung,
bên trong Block sẽ không xuất hiện thanh cuộn.

### Chiều cao chỉ định

Có thể chỉ định thủ công tổng chiều cao của khung ngoài Block, bên trong Block sẽ tự động tính toán và phân bổ chiều cao có sẵn.

![20260211154043](https://static-docs.nocobase.com/20260211154043.gif)

### Chiều cao đầy đủ

Chế độ chiều cao đầy đủ tương tự với chiều cao chỉ định, chiều cao Block sẽ tính toán chiều cao tối đa toàn màn hình dựa trên **vùng hiển thị** của trình duyệt hiện tại.
Trang trình duyệt không xuất hiện thanh cuộn, thanh cuộn chỉ xuất hiện bên trong Block.

Cách xử lý cuộn bên trong của các Block khác nhau ở chế độ chiều cao đầy đủ có sự khác biệt nhẹ:

- **Table**: `tbody` cuộn bên trong;
- **Form / Chi tiết**: Cuộn trong Grid (nội dung ngoài khu vực Action cuộn);
- **Danh sách / Lưới thẻ**: Cuộn trong Grid (nội dung ngoài khu vực Action và thanh phân trang cuộn);
- **Bản đồ / Lịch**: Tự thích ứng chiều cao tổng thể, không có thanh cuộn;
- **Iframe / Markdown**: Giới hạn tổng chiều cao khung ngoài Block, thanh cuộn xuất hiện bên trong Block.

#### Table chiều cao đầy đủ

![20260211154204](https://static-docs.nocobase.com/20260211154204.gif)

#### Form chiều cao đầy đủ

![20260211154335](https://static-docs.nocobase.com/20260211154335.gif)
