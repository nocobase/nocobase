:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Chuẩn bị

Trước khi triển khai ứng dụng theo cụm, bạn cần hoàn tất các bước chuẩn bị sau.

## Giấy phép plugin thương mại

Để chạy ứng dụng NocoBase ở chế độ cụm, cần có sự hỗ trợ từ các plugin sau:

| Chức năng                   | Plugin                                                                              |
| --------------------------- | ----------------------------------------------------------------------------------- |
| Bộ điều hợp bộ nhớ đệm      | Tích hợp sẵn                                                                        |
| Bộ điều hợp tín hiệu đồng bộ | `@nocobase/plugin-pubsub-adapter-redis`                                             |
| Bộ điều hợp hàng đợi tin nhắn | `@nocobase/plugin-queue-adapter-redis` hoặc `@nocobase/plugin-queue-adapter-rabbitmq` |
| Bộ điều hợp khóa phân tán   | `@nocobase/plugin-lock-adapter-redis`                                               |
| Bộ cấp phát Worker ID       | `@nocobase/plugin-workerid-allocator-redis`                                         |

Trước tiên, hãy đảm bảo bạn đã có giấy phép cho các plugin trên (bạn có thể mua giấy phép plugin tương ứng thông qua nền tảng dịch vụ plugin thương mại).

## Các thành phần hệ thống

Ngoài các phiên bản ứng dụng, các thành phần hệ thống khác có thể được nhân viên vận hành lựa chọn tùy theo nhu cầu của từng nhóm.

### Cơ sở dữ liệu

Vì chế độ cụm hiện tại chỉ tập trung vào các phiên bản ứng dụng, cơ sở dữ liệu tạm thời chỉ hỗ trợ một nút đơn. Nếu bạn có kiến trúc cơ sở dữ liệu như master-slave, bạn cần tự triển khai thông qua middleware và đảm bảo nó minh bạch đối với ứng dụng NocoBase.

### Middleware

Chế độ cụm của NocoBase cần dựa vào một số middleware để đạt được giao tiếp và điều phối giữa các cụm, bao gồm:

- **Bộ nhớ đệm** (Cache): Sử dụng middleware bộ nhớ đệm phân tán dựa trên Redis để tăng tốc độ truy cập dữ liệu.
- **Tín hiệu đồng bộ** (Sync signal): Sử dụng tính năng stream của Redis để truyền tín hiệu đồng bộ giữa các cụm.
- **Hàng đợi tin nhắn** (Message queue): Sử dụng middleware hàng đợi tin nhắn dựa trên Redis hoặc RabbitMQ để xử lý tin nhắn không đồng bộ.
- **Khóa phân tán** (Distributed lock): Sử dụng khóa phân tán dựa trên Redis để đảm bảo an toàn truy cập tài nguyên dùng chung trong cụm.

Khi tất cả các thành phần middleware đều sử dụng Redis, bạn có thể khởi động một dịch vụ Redis duy nhất trong mạng nội bộ của cụm (hoặc Kubernetes). Ngoài ra, bạn cũng có thể kích hoạt một dịch vụ Redis riêng cho từng chức năng (bộ nhớ đệm, tín hiệu đồng bộ, hàng đợi tin nhắn và khóa phân tán).

**Đề xuất phiên bản**

- Redis: >=8.0 hoặc phiên bản redis-stack có tính năng Bloom Filter.
- RabbitMQ: >=4.0

### Lưu trữ chia sẻ

NocoBase cần sử dụng thư mục `storage` để lưu trữ các tệp liên quan đến hệ thống. Ở chế độ đa nút, bạn nên gắn kết ổ đĩa đám mây (hoặc NFS) để hỗ trợ truy cập chia sẻ giữa nhiều nút. Nếu không, bộ nhớ cục bộ sẽ không tự động đồng bộ hóa và không thể hoạt động bình thường.

Khi triển khai bằng Kubernetes, vui lòng tham khảo phần [Triển khai Kubernetes: Lưu trữ chia sẻ](./kubernetes#shared-storage).

### Cân bằng tải

Chế độ cụm yêu cầu một bộ cân bằng tải để phân phối các yêu cầu, cũng như kiểm tra tình trạng và chuyển đổi dự phòng cho các phiên bản ứng dụng. Phần này nên được lựa chọn và cấu hình theo nhu cầu vận hành của nhóm.

Lấy Nginx tự cài đặt làm ví dụ, hãy thêm nội dung sau vào tệp cấu hình:

```
upstream myapp {
    # ip_hash; # Có thể dùng để duy trì phiên, khi bật, các yêu cầu từ cùng một máy khách luôn được gửi đến cùng một máy chủ backend.
    server 172.31.0.1:13000; # Nút nội bộ 1
    server 172.31.0.2:13000; # Nút nội bộ 2
    server 172.31.0.3:13000; # Nút nội bộ 3
}

server {
    listen 80;

    location / {
        # Sử dụng upstream đã định nghĩa để cân bằng tải
        proxy_pass http://myapp;
        # ... các cấu hình khác
    }
}
```

Điều này có nghĩa là các yêu cầu được proxy ngược và phân phối đến các nút máy chủ khác nhau để xử lý.

Đối với middleware cân bằng tải do các nhà cung cấp dịch vụ đám mây khác cung cấp, vui lòng tham khảo tài liệu cấu hình của nhà cung cấp cụ thể.

## Cấu hình biến môi trường

Tất cả các nút trong cụm nên sử dụng cùng một cấu hình biến môi trường. Ngoài các [biến môi trường](/api/cli/env) cơ bản của NocoBase, bạn cũng cần cấu hình các biến môi trường liên quan đến middleware sau.

### Chế độ đa lõi

Khi ứng dụng chạy trên nút đa lõi, bạn có thể bật chế độ đa lõi của nút:

```ini
# Bật chế độ đa lõi PM2
# CLUSTER_MODE=max # Mặc định không bật, cần cấu hình thủ công
```

Nếu bạn triển khai các pod ứng dụng trong Kubernetes, bạn có thể bỏ qua cấu hình này và kiểm soát số lượng phiên bản ứng dụng thông qua số lượng bản sao của pod.

### Bộ nhớ đệm

```ini
# Bộ điều hợp bộ nhớ đệm, ở chế độ cụm cần điền là redis (mặc định nếu không điền là bộ nhớ trong)
CACHE_DEFAULT_STORE=redis

# URL kết nối bộ điều hợp bộ nhớ đệm Redis, cần điền vào
CACHE_REDIS_URL=
```

### Tín hiệu đồng bộ

```ini
# URL kết nối bộ điều hợp đồng bộ Redis, mặc định nếu không điền là redis://localhost:6379/0
PUBSUB_ADAPTER_REDIS_URL=
```

### Khóa phân tán

```ini
# Bộ điều hợp khóa, ở chế độ cụm cần điền là redis (mặc định nếu không điền là khóa cục bộ trong bộ nhớ)
LOCK_ADAPTER_DEFAULT=redis

# URL kết nối bộ điều hợp khóa Redis, mặc định nếu không điền là redis://localhost:6379/0
LOCK_ADAPTER_REDIS_URL=
```

### Hàng đợi tin nhắn

```ini
# Bật Redis làm bộ điều hợp hàng đợi tin nhắn, mặc định nếu không điền là bộ điều hợp trong bộ nhớ
QUEUE_ADAPTER=redis
# URL kết nối bộ điều hợp hàng đợi tin nhắn Redis, mặc định nếu không điền là redis://localhost:6379/0
QUEUE_ADAPTER_REDIS_URL=
```

### Bộ cấp phát Worker ID

Vì một số bộ sưu tập hệ thống trong NocoBase sử dụng ID duy nhất toàn cầu làm khóa chính, nên cần có Bộ cấp phát Worker ID để đảm bảo mỗi phiên bản ứng dụng trong cụm được gán một Worker ID duy nhất, từ đó tránh các vấn đề xung đột khóa chính. Phạm vi Worker ID hiện tại được thiết kế là 0-31, nghĩa là cùng một ứng dụng có thể hỗ trợ tối đa 32 nút chạy đồng thời. Để biết chi tiết về thiết kế ID duy nhất toàn cầu, hãy tham khảo [@nocobase/snowflake-id](https://github.com/nocobase/nocobase/tree/main/packages/core/snowflake-id).

```ini
# URL kết nối Redis cho Bộ cấp phát Worker ID. Nếu bỏ qua, một Worker ID ngẫu nhiên sẽ được gán.
REDIS_URL=
```

:::info{title=Mẹo}
Thông thường, các bộ điều hợp liên quan đều có thể sử dụng cùng một phiên bản Redis, nhưng tốt nhất nên phân biệt và sử dụng các cơ sở dữ liệu khác nhau để tránh các vấn đề xung đột khóa có thể xảy ra, ví dụ:

```ini
CACHE_REDIS_URL=redis://localhost:6379/0
PUBSUB_ADAPTER_REDIS_URL=redis://localhost:6379/1
LOCK_ADAPTER_REDIS_URL=redis://localhost:6379/2
QUEUE_ADAPTER_REDIS_URL=redis://localhost:6379/3
REDIS_URL=redis://localhost:6379/4
```

Hiện tại, mỗi plugin sử dụng các biến môi trường Redis riêng. Trong tương lai, chúng tôi có thể xem xét việc sử dụng thống nhất `REDIS_URL` làm cấu hình dự phòng.

:::

Nếu bạn sử dụng Kubernetes để quản lý cụm, bạn có thể cấu hình các biến môi trường trên trong ConfigMap hoặc Secret. Để biết thêm nội dung liên quan, bạn có thể tham khảo [Triển khai Kubernetes](./kubernetes).

Sau khi hoàn tất tất cả các bước chuẩn bị trên, bạn có thể chuyển sang [Quy trình vận hành](./operations) để tiếp tục quản lý các phiên bản ứng dụng.