---
title: "Triển khai môi trường sản xuất NocoBase"
description: "Quy trình triển khai sản xuất NocoBase: khuyến nghị Docker hoặc create-nocobase-app, proxy tài nguyên tĩnh (Nginx/Caddy/CDN), lệnh vận hành docker compose/pm2."
keywords: "Triển khai môi trường sản xuất, triển khai sản xuất, triển khai Docker, proxy tài nguyên tĩnh, Nginx, Caddy, lệnh vận hành, NocoBase"
---

# Triển khai môi trường sản xuất

Khi triển khai NocoBase ở môi trường sản xuất, do cách build khác nhau giữa các hệ thống và môi trường, việc cài đặt phụ thuộc có thể khá phức tạp. Để có được trải nghiệm tính năng đầy đủ, chúng tôi khuyến nghị sử dụng **Docker** để triển khai. Nếu môi trường hệ thống không thể dùng Docker, cũng có thể dùng **create-nocobase-app** để triển khai.

:::warning

Không khuyến nghị triển khai trực tiếp từ mã nguồn ở môi trường sản xuất. Mã nguồn có nhiều phụ thuộc, dung lượng lớn và việc biên dịch toàn bộ yêu cầu cao về CPU và bộ nhớ. Nếu thật sự cần triển khai từ mã nguồn, khuyến nghị build image Docker tùy chỉnh trước, sau đó mới triển khai.

:::

## Quy trình triển khai

Triển khai môi trường sản xuất có thể tham khảo các bước cài đặt và nâng cấp đã có.

### Cài đặt mới hoàn toàn

- [Cài đặt Docker](../installation/docker.mdx)
- [Cài đặt create-nocobase-app](../installation/create-nocobase-app.mdx)

### Nâng cấp ứng dụng

- [Nâng cấp bản cài đặt Docker](../installation/docker.mdx)
- [Nâng cấp bản cài đặt create-nocobase-app](../installation/create-nocobase-app.mdx)

### Cài đặt và nâng cấp Plugin bên thứ ba

- [Cài đặt và nâng cấp Plugin](../install-upgrade-plugins.mdx)

## Proxy tài nguyên tĩnh

Trong môi trường sản xuất, khuyến nghị giao tài nguyên tĩnh cho server proxy quản lý, ví dụ:

- [nginx](./static-resource-proxy/nginx.md) 
- [caddy](./static-resource-proxy/caddy.md)
- [cdn](./static-resource-proxy/cdn.md)

## Lệnh vận hành thường dùng

Theo các phương thức cài đặt khác nhau, có thể dùng các lệnh sau để quản lý tiến trình NocoBase:

- [docker compose](./common-commands/docker-compose.md)
- [pm2](./common-commands/pm2.md)
