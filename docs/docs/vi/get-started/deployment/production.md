:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Triển khai trong môi trường sản xuất

Khi triển khai NocoBase trong môi trường sản xuất, việc cài đặt các phần phụ thuộc có thể phức tạp do sự khác biệt trong cách xây dựng giữa các hệ thống và môi trường. Để có trải nghiệm đầy đủ tính năng, chúng tôi khuyến nghị sử dụng **Docker** để triển khai. Nếu môi trường hệ thống của bạn không thể sử dụng Docker, bạn cũng có thể triển khai bằng **create-nocobase-app**.

:::warning

Không khuyến nghị triển khai trực tiếp từ mã nguồn trong môi trường sản xuất. Mã nguồn có nhiều phần phụ thuộc, dung lượng lớn và việc biên dịch toàn bộ đòi hỏi CPU và bộ nhớ cao. Nếu thực sự cần triển khai từ mã nguồn, bạn nên xây dựng một Docker image tùy chỉnh trước khi triển khai.

:::

## Quy trình triển khai

Để triển khai trong môi trường sản xuất, bạn có thể tham khảo các bước cài đặt và nâng cấp hiện có.

### Cài đặt mới

- [Cài đặt Docker](../installation/docker.mdx)
- [Cài đặt create-nocobase-app](../installation/create-nocobase-app.mdx)

### Nâng cấp ứng dụng

- [Nâng cấp cài đặt Docker](../installation/docker.mdx)
- [Nâng cấp cài đặt create-nocobase-app](../installation/create-nocobase-app.mdx)

### Cài đặt và nâng cấp plugin của bên thứ ba

- [Cài đặt và nâng cấp plugin](../install-upgrade-plugins.mdx)

## Proxy tài nguyên tĩnh

Trong môi trường sản xuất, bạn nên để máy chủ proxy quản lý các tài nguyên tĩnh, ví dụ:

- [nginx](./static-resource-proxy/nginx.md) 
- [caddy](./static-resource-proxy/caddy.md)
- [cdn](./static-resource-proxy/cdn.md)

## Các lệnh vận hành phổ biến

Tùy thuộc vào phương thức cài đặt, bạn có thể sử dụng các lệnh sau để quản lý tiến trình NocoBase:

- [docker compose](./common-commands/docker-compose.md)
- [pm2](./common-commands/pm2.md)