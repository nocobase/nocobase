---
pkg: "@nocobase/preset-cluster"
title: "Chuẩn bị triển khai Cluster"
description: "Chuẩn bị trước khi triển khai Cluster: license plugin thương mại (PubSub, Queue, Lock, WorkerID adapter), database, middleware Redis/RabbitMQ, shared storage, cấu hình load balancer."
keywords: "Chuẩn bị Cluster,license plugin thương mại,middleware Redis,RabbitMQ,shared storage,load balancer,Nginx,NocoBase"
---

# Chuẩn bị

Trước khi triển khai ứng dụng cluster, cần hoàn thành các chuẩn bị sau.

## License plugin thương mại

Việc chạy ứng dụng NocoBase ở chế độ cluster cần dựa trên các plugin sau:

| Tính năng             | Plugin                                                                                |
| ---------------- | ----------------------------------------------------------------------------------- |
| Cache adapter       | Tích hợp sẵn                                                                                |
| Sync signal adapter   | `@nocobase/plugin-pubsub-adapter-redis`                                             |
| Message queue adapter   | `@nocobase/plugin-queue-adapter-redis` hoặc `@nocobase/plugin-queue-adapter-rabbitmq` |
| Distributed lock adapter   | `@nocobase/plugin-lock-adapter-redis`                                               |
| Worker ID allocator | `@nocobase/plugin-workerid-allocator-redis`                                         |

Đầu tiên hãy đảm bảo bạn đã có license cho các plugin trên (có thể mua license plugin tương ứng qua nền tảng dịch vụ plugin thương mại).

## Thành phần hệ thống

Ngoài instance ứng dụng, các thành phần hệ thống khác có thể được lựa chọn bởi đội ngũ vận hành dựa trên nhu cầu vận hành của các đội khác nhau.

### Database

Vì chế độ Cluster hiện tại chỉ áp dụng cho instance ứng dụng, database tạm thời chỉ hỗ trợ single-node. Nếu có kiến trúc database master-slave, cần tự thực hiện qua middleware và đảm bảo trong suốt với ứng dụng NocoBase.

### Middleware

Chế độ Cluster của NocoBase cần dựa vào một số middleware để thực hiện giao tiếp và phối hợp giữa các instance trong cluster, bao gồm:

- **Cache**: Sử dụng middleware distributed cache dựa trên Redis để nâng cao tốc độ truy cập dữ liệu.
- **Sync signal**: Sử dụng tính năng stream của Redis để thực hiện truyền sync signal giữa các instance trong cluster.
- **Message queue**: Sử dụng middleware message queue dựa trên Redis hoặc RabbitMQ để thực hiện xử lý message async.
- **Distributed lock**: Sử dụng distributed lock dựa trên Redis để đảm bảo an toàn khi truy cập tài nguyên chung trong cluster.

Khi tất cả middleware đều sử dụng Redis, có thể khởi động một dịch vụ Redis duy nhất trong mạng nội bộ cluster (hoặc Kubernetes). Cũng có thể kích hoạt một dịch vụ Redis riêng cho mỗi tính năng (cache, sync signal, message queue và distributed lock).

**Khuyến nghị phiên bản**

- Redis: >=8.0 hoặc sử dụng phiên bản redis-stack chứa tính năng Bloom Filter.
- RabbitMQ: >=4.0

### Shared Storage

NocoBase cần sử dụng thư mục storage để lưu các file liên quan đến hệ thống. Trong chế độ multi-node, nên gắn cloud disk (hoặc NFS) để hỗ trợ truy cập chung từ nhiều node. Nếu không, local storage sẽ không tự động đồng bộ và không thể sử dụng bình thường.

Khi triển khai bằng Kubernetes, vui lòng tham khảo chương [Triển khai Kubernetes: Shared Storage](./kubernetes#shared-storage).

### Load Balancer

Chế độ Cluster cần thực hiện phân phối request thông qua load balancer, cũng như health check và failover của các instance ứng dụng. Phần này được lựa chọn và cấu hình theo nhu cầu vận hành của đội ngũ.

Lấy ví dụ tự xây dựng Nginx, thêm nội dung sau vào file cấu hình:

```
upstream myapp {
    # ip_hash; # Có thể dùng để giữ session, sau khi bật, request từ cùng client luôn được gửi đến cùng backend server.
    server 172.31.0.1:13000; # Node 1 trong mạng nội bộ
    server 172.31.0.2:13000; # Node 2 trong mạng nội bộ
    server 172.31.0.3:13000; # Node 3 trong mạng nội bộ
}

server {
    listen 80;

    location / {
        # Sử dụng upstream đã định nghĩa để load balancing
        proxy_pass http://myapp;
        # ... các cấu hình khác
    }
}
```

Có nghĩa là phân phối request reverse proxy đến các node server khác nhau để xử lý.

Các middleware load balancer do các nhà cung cấp dịch vụ cloud khác cung cấp có thể tham khảo tài liệu cấu hình cụ thể của nhà cung cấp dịch vụ.

## Cấu hình biến môi trường

Tất cả các node trong cluster nên sử dụng cùng cấu hình biến môi trường. Ngoài [biến môi trường](../api/app/env) cơ bản của NocoBase, còn cần cấu hình các biến môi trường liên quan đến middleware sau.

### Chế độ multi-core

Khi ứng dụng chạy trên node multi-core, có thể bật chế độ multi-core của node:

```ini
# Bật chế độ multi-core PM2
# CLUSTER_MODE=max # Mặc định không bật, cần cấu hình thủ công
```

Khi triển khai pod ứng dụng trong Kubernetes, có thể bỏ qua cấu hình này, kiểm soát số lượng instance ứng dụng thông qua số bản sao của pod.

### Cache

```ini
# Cache adapter, ở chế độ Cluster cần điền là redis (mặc định không điền là memory)
CACHE_DEFAULT_STORE=redis

# Địa chỉ kết nối Redis cache adapter, cần điền chủ động
CACHE_REDIS_URL=
```

### Sync signal

```ini
# Địa chỉ kết nối Redis sync adapter, mặc định không điền là redis://localhost:6379/0
PUBSUB_ADAPTER_REDIS_URL=
```

### Distributed lock

```ini
# Lock adapter, ở chế độ Cluster cần điền là redis (mặc định không điền là local lock memory)
LOCK_ADAPTER_DEFAULT=redis

# Địa chỉ kết nối Redis lock adapter, mặc định không điền là redis://localhost:6379/0
LOCK_ADAPTER_REDIS_URL=
```

### Message queue

```ini
# Kích hoạt Redis làm message queue adapter, mặc định không điền là memory adapter
QUEUE_ADAPTER=redis
# Địa chỉ kết nối Redis message queue adapter, mặc định không điền là redis://localhost:6379/0
QUEUE_ADAPTER_REDIS_URL=
```

### Worker ID allocator

Vì một số system table trong NocoBase sử dụng global unique ID làm primary key, cần phải thông qua Worker ID allocator để đảm bảo mỗi instance ứng dụng trong cluster được phân bổ Worker ID duy nhất, từ đó tránh xung đột primary key. Phạm vi Worker ID hiện được thiết kế là 0-31, tức là cùng một ứng dụng tối đa hỗ trợ 32 node chạy đồng thời. Về thiết kế global unique ID, tham khảo [@nocobase/snowflake-id](https://github.com/nocobase/nocobase/tree/main/packages/core/snowflake-id)

```ini
# Địa chỉ kết nối Redis của Worker ID allocator, mặc định không điền là phân bổ ngẫu nhiên
REDIS_URL=
```

:::info{title=Mẹo}
Thông thường, các adapter liên quan có thể đều sử dụng cùng một instance Redis, nhưng tốt nhất nên phân biệt sử dụng các database khác nhau để tránh các vấn đề xung đột key có thể có, ví dụ:

```ini
CACHE_REDIS_URL=redis://localhost:6379/0
PUBSUB_ADAPTER_REDIS_URL=redis://localhost:6379/1
LOCK_ADAPTER_REDIS_URL=redis://localhost:6379/2
QUEUE_ADAPTER_REDIS_URL=redis://localhost:6379/3
REDIS_URL=redis://localhost:6379/4
```

Hiện tại các plugin sử dụng cấu hình biến môi trường Redis riêng. Trong tương lai sẽ xem xét sử dụng thống nhất `REDIS_URL` làm cấu hình fallback.

:::

Nếu sử dụng Kubernetes để quản lý cluster, có thể cấu hình các biến môi trường trên trong ConfigMap hoặc Secret. Để biết thêm nội dung liên quan, có thể tham khảo [Triển khai Kubernetes](./kubernetes).

Sau khi tất cả các chuẩn bị trên hoàn tất, có thể vào [Quy trình vận hành](./operations) để tiếp tục quản lý các instance ứng dụng.
