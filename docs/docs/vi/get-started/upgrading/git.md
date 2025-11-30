# Nâng cấp cài đặt từ mã nguồn Git

:::warning Chuẩn bị trước khi nâng cấp

- Hãy đảm bảo sao lưu cơ sở dữ liệu của bạn trước.
- Dừng NocoBase đang chạy (`Ctrl + C`).

:::

## 1. Chuyển đến thư mục dự án NocoBase

```bash
cd my-nocobase-app
```

## 2. Kéo mã nguồn mới nhất

```bash
git pull
```

## 3. Xóa bộ nhớ đệm và các phụ thuộc cũ (tùy chọn)

Nếu quá trình nâng cấp thông thường thất bại, bạn có thể thử xóa bộ nhớ đệm và các phụ thuộc, sau đó tải lại.

```bash
# Xóa bộ nhớ đệm của NocoBase
yarn nocobase clean
# Xóa các phụ thuộc
yarn rimraf -rf node_modules # tương đương với rm -rf node_modules
```

## 4. Cập nhật các phụ thuộc

📢 Do các yếu tố như môi trường mạng và cấu hình hệ thống, bước này có thể mất hơn mười phút.

```bash
yarn install
```

## 5. Chạy lệnh nâng cấp

```bash
yarn nocobase upgrade
```

## 6. Khởi động NocoBase

```bash
yarn dev
```

:::tip Mẹo cho môi trường sản xuất

Không khuyến nghị triển khai NocoBase được cài đặt từ mã nguồn trực tiếp trong môi trường sản xuất (Đối với môi trường sản xuất, vui lòng tham khảo [Triển khai sản xuất](../deployment/production.md)).

:::

## 7. Nâng cấp các plugin bên thứ ba

Tham khảo [Cài đặt và nâng cấp plugin](../install-upgrade-plugins.mdx)