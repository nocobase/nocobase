:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Nâng cấp cài đặt `create-nocobase-app`

:::warning Chuẩn bị trước khi nâng cấp

- Hãy đảm bảo sao lưu cơ sở dữ liệu trước.
- Dừng phiên bản NocoBase đang chạy.

:::

## 1. Dừng phiên bản NocoBase đang chạy

Nếu tiến trình không chạy ngầm, hãy dừng nó bằng `Ctrl + C`. Trong môi trường sản xuất, bạn có thể thực thi lệnh `pm2-stop` để dừng.

```bash
yarn nocobase pm2-stop
```

## 2. Thực thi lệnh nâng cấp

Bạn chỉ cần thực thi lệnh nâng cấp `yarn nocobase upgrade`.

```bash
# Chuyển đến thư mục tương ứng
cd my-nocobase-app
# Thực thi lệnh cập nhật
yarn nocobase upgrade
# Khởi động
yarn dev
```

### Nâng cấp lên phiên bản cụ thể

Sửa đổi tệp `package.json` trong thư mục gốc của dự án, sau đó thay đổi số phiên bản của `@nocobase/cli` và `@nocobase/devtools` (bạn chỉ có thể nâng cấp, không thể hạ cấp). Ví dụ:

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

Sau đó, thực thi lệnh nâng cấp

```bash
yarn install
yarn nocobase upgrade --skip-code-update
```