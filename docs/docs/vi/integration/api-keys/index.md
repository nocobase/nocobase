---
title: "Cấu hình API Key"
description: "API Key của NocoBase: thêm API Key cho người dùng hiện tại để truy cập theo phương thức lập trình, cần cấu hình biến môi trường APP_KEY, cách cấu hình cho Docker và bản cài từ source."
keywords: "API Key,APP_KEY,Xác thực API,Truy cập lập trình,Bearer token,NocoBase"
---

# API Key

## Giới thiệu

## Cài đặt

## Hướng dẫn sử dụng

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### Thêm API Key

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

**Lưu ý**

- API Key được thêm thuộc về người dùng hiện tại, vai trò là vai trò mà người dùng hiện tại sở hữu
- Đảm bảo bạn đã cấu hình biến môi trường `APP_KEY` và đảm bảo nó không bị rò rỉ. Nếu APP_KEY thay đổi, tất cả API Key đã thêm sẽ bị mất hiệu lực.

### Cách cấu hình APP_KEY

Phiên bản docker, chỉnh sửa tệp docker-compose.yml

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

Cài đặt từ source hoặc create-nocobase-app, chỉnh sửa trực tiếp APP_KEY trong tệp .env

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```
