---
pkg: '@nocobase/plugin-api-keys'
---
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::

# Khóa API

## Giới thiệu

## Hướng dẫn sử dụng

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### Thêm Khóa API

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

**Lưu ý**

- Khóa API được thêm sẽ thuộc về người dùng hiện tại và kế thừa vai trò của người dùng đó.
- Vui lòng đảm bảo rằng biến môi trường `APP_KEY` đã được cấu hình và được giữ bí mật. Nếu `APP_KEY` thay đổi, tất cả các khóa API đã thêm sẽ không còn hiệu lực.

### Cách cấu hình APP_KEY

Đối với phiên bản Docker, hãy chỉnh sửa tệp `docker-compose.yml`:

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

Đối với cài đặt từ mã nguồn hoặc `create-nocobase-app`, bạn có thể trực tiếp chỉnh sửa `APP_KEY` trong tệp `.env`:

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```