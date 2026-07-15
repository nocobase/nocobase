---
title: "Triển khai môi trường sản xuất NocoBase"
description: "Quy trình triển khai sản xuất NocoBase: khuyến nghị Docker hoặc create-nocobase-app, proxy tài nguyên tĩnh (Nginx/Caddy/CDN), lệnh vận hành docker compose/pm2."
keywords: "Triển khai môi trường sản xuất, triển khai sản xuất, triển khai Docker, proxy tài nguyên tĩnh, Nginx, Caddy, lệnh vận hành, NocoBase"
---

# Triển khai môi trường sản xuất

Khi triển khai NocoBase ở môi trường sản xuất, do cách build khác nhau giữa các hệ thống và môi trường, việc cài đặt phụ thuộc có thể khá phức tạp. Để có được trải nghiệm tính năng đầy đủ, chúng tôi khuyến nghị sử dụng **Docker** để triển khai. Nếu môi trường hệ thống không thể dùng Docker, cũng có thể dùng **create-nocobase-app** để triển khai.

:::warning Lưu ý

Không khuyến nghị triển khai trực tiếp từ mã nguồn ở môi trường sản xuất. Mã nguồn có nhiều phụ thuộc, dung lượng lớn và việc biên dịch toàn bộ yêu cầu cao về CPU và bộ nhớ. Nếu thật sự cần triển khai từ mã nguồn, khuyến nghị build image Docker tùy chỉnh trước, sau đó mới triển khai.

:::

:::warning Lưu ý

Nếu triển khai nhiều dịch vụ NocoBase độc lập, hãy dùng `hostname` khác nhau cho từng dịch vụ, chẳng hạn các subdomain riêng. Không chỉ phân biệt dịch vụ bằng port như `https://example.com:13000` và `https://example.com:14000`.

NocoBase dùng cookie để duy trì trạng thái đăng nhập và [quyền truy cập file](../../file-manager/stable-url.md). Trình duyệt không cô lập cookie theo port, vì vậy các dịch vụ ở những port khác nhau dưới cùng một `hostname` có thể dùng chung cookie trùng tên. Điều này có thể ghi đè trạng thái đăng nhập hoặc gây lỗi xác thực khi xem trước và tải file.

Các sub-app trong cùng một deployment NocoBase không thuộc phạm vi hạn chế này. Cookie đăng nhập được phân biệt theo tên ứng dụng, nên main app và các sub-app khác tên có thể dùng chung một `hostname`.

Tuy nhiên, các dịch vụ độc lập vẫn phải được cô lập. Nếu một dịch vụ NocoBase khác chạy trên port khác dưới cùng `hostname` và chứa main app hoặc sub-app trùng tên, cookie vẫn có thể xung đột.

Hãy dùng các địa chỉ như `app1.example.com` và `app2.example.com`, sau đó định tuyến chúng đến các dịch vụ NocoBase khác nhau qua Nginx hoặc Caddy.

:::

## Frontend tách rời / Truy cập API cross-origin

Nên giữ trang và API cùng origin: dùng reverse proxy dưới cùng một domain để chuyển tiếp `${APP_PUBLIC_PATH}api/` và `${APP_PUBLIC_PATH}files/` đến dịch vụ NocoBase, đồng thời để trống `API_BASE_URL`.

Nếu trang buộc phải truy cập API theo cơ chế cross-origin (`API_BASE_URL` trỏ sang origin khác), hãy thêm origin của trang vào `CORS_ORIGIN_WHITELIST`. Nếu không, trình duyệt sẽ bỏ qua `Set-Cookie` trong phản hồi API, cookie đăng nhập sẽ không được lưu, và việc xem trước hay tải xuống qua stable file URL sẽ thất bại ở bước xác thực.

Đồng thời lưu ý rằng cookie được lưu theo `hostname`: nếu trang và API dùng hai domain hoàn toàn khác nhau, các request tới `/files/` từ domain của trang sẽ không mang theo cookie đăng nhập được lưu dưới domain của API. Với kiểu triển khai này, nên chuyển sang reverse proxy cùng origin. Xem [Biến môi trường](../installation/env.md#api_base_url).

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
