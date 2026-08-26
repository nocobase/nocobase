---
title: "Hướng dẫn nâng cấp create-nocobase-app"
description: "Nâng cấp NocoBase cài đặt create-nocobase-app: yarn nocobase upgrade, nâng cấp lên version chỉ định, backup và lưu ý."
keywords: "create-nocobase-app, nâng cấp, yarn nocobase upgrade, nâng cấp version, NocoBase"
---

# Nâng cấp bản cài đặt create-nocobase-app

:::warning Chuẩn bị trước khi nâng cấp

- Bắt buộc phải backup database trước
- Dừng NocoBase đang chạy

:::

## 1. Dừng NocoBase đang chạy

Nếu là tiến trình không chạy nền, dừng bằng `Ctrl + C`. Môi trường sản xuất thực thi lệnh `pm2-stop` để dừng.

```bash
yarn nocobase pm2-stop
```

## 2. Thực thi lệnh nâng cấp

Chỉ cần thực thi trực tiếp lệnh nâng cấp `yarn nocobase upgrade`

```bash
# Chuyển vào thư mục tương ứng
cd my-nocobase-app
# Thực thi lệnh cập nhật
yarn nocobase upgrade
# Khởi động
yarn dev
```

### Nâng cấp lên version chỉ định

Sửa tệp `package.json` ở thư mục gốc dự án, sửa version của `@nocobase/cli` và `@nocobase/devtools` (chỉ có thể nâng cấp, không hạ cấp). Ví dụ:

```diff
{
  "dependencies": {
-   "@nocobase/cli": "1.5.11"
+   "@nocobase/cli": "1.6.0-beta.8"
  },
  "devDependencies": {
-   "@nocobase/devtools": "1.5.11"
+   "@nocobase/devtools": "1.6.0-beta.8"
  }
}
```

Sau đó thực thi lệnh nâng cấp

```bash
yarn install
yarn nocobase upgrade --skip-code-update
```
