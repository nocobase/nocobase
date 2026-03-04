:::tip{title="Thông báo dịch bằng AI"}
Tài liệu này được dịch bằng AI. Để biết thông tin chính xác, vui lòng tham khảo [phiên bản tiếng Anh](/multi-app/multi-app/remote).
:::

pkg: '@nocobase/plugin-app-supervisor'
---

# Chế độ đa môi trường

## Giới thiệu

Chế độ đa ứng dụng chia sẻ bộ nhớ có ưu điểm rõ rệt trong triển khai và vận hành, nhưng khi số lượng ứng dụng và độ phức tạp của nghiệp vụ tăng lên, một phiên bản duy nhất có thể dần đối mặt với các vấn đề như tranh chấp tài nguyên và giảm độ ổn định. Đối với những kịch bản này, người dùng có thể áp dụng phương án triển khai hỗn hợp đa môi trường để hỗ trợ các nhu cầu nghiệp vụ phức tạp hơn.

Trong chế độ này, hệ thống triển khai một ứng dụng đầu vào làm trung tâm quản lý và điều phối thống nhất, đồng thời triển khai nhiều phiên bản NocoBase làm môi trường chạy ứng dụng độc lập, chịu trách nhiệm thực tế cho các ứng dụng nghiệp vụ. Các môi trường được cách ly với nhau và làm việc cùng nhau, từ đó phân tán áp lực lên một phiên bản duy nhất một cách hiệu quả, nâng cao đáng kể độ ổn định, khả năng mở rộng và khả năng cách ly lỗi của hệ thống.

Về mặt triển khai, các môi trường khác nhau có thể chạy trong các tiến trình độc lập, hoặc được triển khai dưới dạng các container Docker khác nhau, hoặc dưới dạng nhiều Kubernetes Deployment, có khả năng thích ứng linh hoạt với các môi trường hạ tầng có quy mô và kiến trúc khác nhau.

## Triển khai

Trong chế độ triển khai hỗn hợp đa môi trường:

- Ứng dụng đầu vào (Supervisor) chịu trách nhiệm quản lý thống nhất thông tin ứng dụng và môi trường.
- Ứng dụng công việc (Worker) đóng vai trò là môi trường chạy nghiệp vụ thực tế.
- Cấu hình ứng dụng và môi trường được lưu trữ qua bộ nhớ đệm Redis.
- Việc đồng bộ hóa lệnh và trạng thái giữa ứng dụng đầu vào và ứng dụng công việc phụ thuộc vào giao tiếp Redis.

Hiện tại chưa cung cấp chức năng tạo môi trường, mỗi ứng dụng công việc cần được triển khai thủ công và cấu hình thông tin môi trường tương ứng trước khi có thể được ứng dụng đầu vào nhận diện.

### Phụ thuộc kiến trúc

Trước khi triển khai, vui lòng chuẩn bị các dịch vụ sau:

- Redis
  - Lưu trữ cấu hình ứng dụng và môi trường.
  - Làm kênh giao tiếp lệnh giữa ứng dụng đầu vào và ứng dụng công việc.

- Cơ sở dữ liệu
  - Dịch vụ cơ sở dữ liệu mà ứng dụng đầu vào và ứng dụng công việc cần kết nối.

### Ứng dụng đầu vào (Supervisor)

Ứng dụng đầu vào đóng vai trò là trung tâm quản lý thống nhất, chịu trách nhiệm tạo, khởi động, dừng ứng dụng và điều phối môi trường, cũng như làm proxy truy cập ứng dụng.

Giải thích cấu hình biến môi trường của ứng dụng đầu vào:

```bash
# Chế độ ứng dụng
APP_MODE=supervisor
# Phương thức khám phá ứng dụng
APP_DISCOVERY_ADAPTER=remote
# Phương thức quản lý tiến trình ứng dụng
APP_PROCESS_ADAPTER=remote
# Redis lưu trữ cấu hình ứng dụng và môi trường
APP_SUPERVISOR_REDIS_URL=
# Phương thức giao tiếp lệnh ứng dụng
APP_COMMAND_ADPATER=redis
# Redis giao tiếp lệnh ứng dụng
APP_COMMAND_REDIS_URL=
```

### Ứng dụng công việc (Worker)

Ứng dụng công việc đóng vai trò là môi trường chạy nghiệp vụ thực tế, chịu trách nhiệm lưu trữ và chạy các phiên bản ứng dụng NocoBase cụ thể.

Giải thích cấu hình biến môi trường của ứng dụng công việc:

```bash
# Chế độ ứng dụng
APP_MODE=worker
# Phương thức khám phá ứng dụng
APP_DISCOVERY_ADAPTER=remote
# Phương thức quản lý tiến trình ứng dụng
APP_PROCESS_ADAPTER=local
# Redis lưu trữ cấu hình ứng dụng và môi trường
APP_SUPERVISOR_REDIS_URL=
# Phương thức giao tiếp lệnh ứng dụng
APP_COMMAND_ADPATER=redis
# Redis giao tiếp lệnh ứng dụng
APP_COMMAND_REDIS_URL=
# Mã định danh môi trường
ENVIRONMENT_NAME=
# URL truy cập môi trường
ENVIRONMENT_URL=
# URL truy cập proxy môi trường
ENVIRONMENT_PROXY_URL=
```

### Ví dụ Docker Compose

Ví dụ dưới đây trình bày một phương án triển khai hỗn hợp đa môi trường với các container Docker là đơn vị chạy, thông qua Docker Compose để triển khai đồng thời một ứng dụng đầu vào và hai ứng dụng công việc.

```yaml
networks:
  nocobase:
    driver: bridge

services:
  redis:
    networks:
      - nocobase
    image: redis/redis-stack-server:latest
  supervisor:
    container_name: nocobase-supervisor
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_supervisor
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=supervisor
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=remote
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-supervisor:/app/nocobase/storage
    ports:
      - '14000:80'
  worker_a:
    container_name: nocobase-worker-a
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_worker_a
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=worker
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=local
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT_NAME=env_a
      - ENVIRONMENT_URL=http://localhost:15000
      - ENVIRONMENT_PROXY_URL=http://worker_a
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-worker-a:/app/nocobase/storage
    ports:
      - '15000:80'
  worker_b:
    container_name: nocobase-worker-b
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_worker_b
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=worker
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=local
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT_NAME=env_b
      - ENVIRONMENT_URL=http://localhost:16000
      - ENVIRONMENT_PROXY_URL=http://worker_b
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-worker-b:/app/nocobase/storage
    ports:
      - '16000:80'
```

## Hướng dẫn sử dụng

Các thao tác quản lý ứng dụng cơ bản không khác gì so với chế độ chia sẻ bộ nhớ, vui lòng tham khảo [Chế độ chia sẻ bộ nhớ](./local.md). Phần này chủ yếu giới thiệu các nội dung liên quan đến cấu hình đa môi trường.

### Danh sách môi trường

Sau khi triển khai hoàn tất, truy cập trang "Trình quản lý ứng dụng" của ứng dụng đầu vào, bạn có thể xem danh sách các môi trường công việc đã đăng ký trong tab "Môi trường". Thông tin bao gồm mã định danh môi trường, phiên bản ứng dụng công việc, URL truy cập và trạng thái. Ứng dụng công việc gửi nhịp tim (heartbeat) mỗi 2 phút một lần để đảm bảo tính khả dụng của môi trường.

![](https://static-docs.nocobase.com/202512291830371.png)

### Tạo ứng dụng

Khi tạo ứng dụng, bạn có thể chọn một hoặc nhiều môi trường chạy để chỉ định ứng dụng đó sẽ được triển khai trên những ứng dụng công việc nào. Thông thường, chúng tôi khuyên bạn chỉ nên chọn một môi trường. Chỉ khi ứng dụng công việc thực hiện [chia tách dịch vụ](/cluster-mode/services-splitting) và cần triển khai cùng một ứng dụng lên nhiều môi trường chạy để chia sẻ tải hoặc cách ly năng lượng, bạn mới chọn nhiều môi trường.

![](https://static-docs.nocobase.com/202512291835086.png)

### Danh sách ứng dụng

Trang danh sách ứng dụng sẽ hiển thị môi trường chạy hiện tại và thông tin trạng thái của từng ứng dụng. Nếu ứng dụng được triển khai trong nhiều môi trường, nhiều trạng thái chạy sẽ được hiển thị. Trong điều kiện bình thường, cùng một ứng dụng trong nhiều môi trường sẽ duy trì trạng thái thống nhất và cần được kiểm soát khởi động và dừng một cách đồng bộ.

![](https://static-docs.nocobase.com/202512291842216.png)

### Khởi động ứng dụng

Vì khi khởi động ứng dụng có thể ghi dữ liệu khởi tạo vào cơ sở dữ liệu, để tránh tình trạng tranh chấp (race condition) trong môi trường đa môi trường, các ứng dụng được triển khai trong nhiều môi trường sẽ được xếp hàng để thực hiện khởi động.

![](https://static-docs.nocobase.com/202512291841727.png)

### Proxy truy cập ứng dụng

Ứng dụng công việc có thể được truy cập qua proxy thông qua đường dẫn con `/apps/:appName/admin` của ứng dụng đầu vào.

![](https://static-docs.nocobase.com/202601082154230.png)

Nếu ứng dụng được triển khai trong nhiều môi trường, cần chỉ định một môi trường mục tiêu để truy cập proxy.

![](https://static-docs.nocobase.com/202601082155146.png)

Theo mặc định, địa chỉ truy cập proxy sử dụng địa chỉ truy cập của ứng dụng công việc, tương ứng với biến môi trường `ENVIRONMENT_URL`, cần đảm bảo địa chỉ này có thể truy cập được trong môi trường mạng của ứng dụng đầu vào. Nếu cần sử dụng địa chỉ truy cập proxy khác, có thể ghi đè thông qua biến môi trường `ENVIRONMENT_PROXY_URL`.