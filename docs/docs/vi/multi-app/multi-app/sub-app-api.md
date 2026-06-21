---
pkg: '@nocobase/plugin-app-supervisor'
title: 'Gọi API ứng dụng con'
description: 'Cách gọi API ứng dụng con trong multi-app: truy cập qua entry app và chỉ định ứng dụng con đích bằng prefix path, request header hoặc query parameter.'
keywords: 'multi-app,API ứng dụng con,AppSupervisor,entry app,gọi API,NocoBase'
---

# Gọi API ứng dụng con

Trong multi-app, mỗi ứng dụng con có API độc lập. Khi gọi API ứng dụng con, entry app cần biết request phải được route đến ứng dụng con nào.

Ví dụ API của ứng dụng chính thường là:

```bash
GET /api/users:list
```

`/api` là prefix API mặc định và có thể tùy chỉnh bằng biến môi trường `API_BASE_PATH`.

Để gọi API cùng tên trong ứng dụng con, cần chỉ định tên ứng dụng con trong request.

## Dùng prefix path

Dùng prefix `/api/__app/<appName>/`:

```bash
GET /api/__app/a_xxx/users:list
```

Trong đó:

- `a_xxx` là tên ứng dụng con
- `users:list` là resource và action cần gọi
- `/api` là API base path của hệ thống hiện tại

Có thể thêm query parameter như bình thường:

```bash
GET /api/__app/a_xxx/users:list?page=1&pageSize=20
```

Cách này rõ ràng và phù hợp khi gọi API ứng dụng con thống nhất qua entry app trong triển khai đa môi trường.

## Dùng request header

Nếu bên gọi đã dùng địa chỉ cố định `/api/...`, có thể chỉ định ứng dụng con bằng header `X-App`:

```bash
curl \
  -H "X-App: a_xxx" \
  http://localhost:13003/api/users:list
```

Cách này phù hợp cho gọi từ backend hoặc công cụ request frontend đã đóng gói URL API.

## Dùng query parameter

Cũng có thể dùng query parameter `__appName`:

```bash
GET /api/users:list?__appName=a_xxx
```

Khi có thêm parameter khác:

```bash
GET /api/users:list?__appName=a_xxx&page=1&pageSize=20
```

Thông thường prefix path hoặc header rõ ràng hơn vì ứng dụng con đích được thể hiện cụ thể hơn.

## Địa chỉ API trong triển khai đa môi trường

Trong triển khai đa môi trường, thường có một entry app và nhiều runtime environment.

Ví dụ:

- Địa chỉ entry app: `http://localhost:13003`
- Địa chỉ runtime environment: `http://localhost:14000`

Nên gọi API ứng dụng con qua entry app:

```bash
GET http://localhost:13003/api/__app/a_xxx/users:list
```

Entry app sẽ route request đến ứng dụng con tương ứng theo cấu hình. Nếu bạn biết rõ runtime environment cần truy cập, cũng có thể dùng địa chỉ của environment đó.

```bash
GET http://localhost:14000/api/__app/a_xxx/users:list
```

## Domain riêng của ứng dụng con

Nếu ứng dụng con có domain truy cập riêng, cũng có thể gọi trực tiếp API của ứng dụng con qua domain đó:

```bash
GET https://app-example.example.com/api/users:list
```

Nếu muốn thống nhất đi qua entry app, tiếp tục dùng `/api/__app/<appName>/...`.

## Xác thực

Khi gọi API ứng dụng con, kiểm tra quyền vẫn dựa trên ứng dụng con đích.

Điều này có nghĩa:

- Cần trạng thái đăng nhập hoặc access token hợp lệ cho ứng dụng con
- Trạng thái đăng nhập của ứng dụng chính không tự động tương đương với quyền API trong ứng dụng con

Nếu request không mang thông tin xác thực hợp lệ, ứng dụng con sẽ trả lỗi chưa đăng nhập hoặc không có quyền theo cấu hình xác thực của chính nó.
