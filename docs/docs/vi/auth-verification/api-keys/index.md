---
pkg: '@nocobase/plugin-api-keys'
title: "API Key"
description: "API Key NocoBase: thêm API Key cho người dùng hiện tại để xác thực khi gọi API, cần cấu hình biến môi trường APP_KEY."
keywords: "API Key,APP_KEY,xác thực API,xác thực gọi API,NocoBase"
---

# API Key

## Giới thiệu

## Hướng dẫn sử dụng

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### Thêm API Key

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

**Lưu ý**

- API Key được thêm là của người dùng hiện tại, vai trò là vai trò của người dùng hiện tại
- Hãy đảm bảo bạn đã cấu hình biến môi trường `APP_KEY` và giữ bí mật. Nếu APP_KEY bị thay đổi, tất cả API Key đã thêm sẽ mất hiệu lực.

### Cách cấu hình APP_KEY

Bản docker, sửa file docker-compose.yml

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

Cài đặt từ source code hoặc create-nocobase-app, chỉ cần sửa APP_KEY trong file .env

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```
