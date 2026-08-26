---
pkg: '@nocobase/plugin-app-supervisor'
title: "Chế độ Triển khai Hỗn hợp Đa Môi trường"
description: "Chế độ đa môi trường: Supervisor entry app + Worker, cấu hình cache Redis và giao tiếp lệnh, APP_MODE, ENVIRONMENT_NAME, triển khai Docker Compose, proxy truy cập ứng dụng."
keywords: "đa môi trường,chế độ remote,Supervisor,Worker,APP_MODE,Redis,Docker Compose,proxy ứng dụng,NocoBase"
---
# Chế độ Đa Môi trường

## Giới thiệu

Multi-app chế độ shared memory có lợi thế rõ ràng về triển khai và vận hành, nhưng khi số lượng ứng dụng và độ phức tạp nghiệp vụ tăng lên, một instance đơn có thể dần đối mặt với các vấn đề cạnh tranh tài nguyên, giảm tính ổn định. Đối với loại tình huống này, bạn có thể sử dụng phương án triển khai hỗn hợp đa môi trường để hỗ trợ các nhu cầu nghiệp vụ phức tạp hơn.

Trong chế độ này, hệ thống triển khai một entry application làm trung tâm quản lý và điều phối thống nhất, đồng thời triển khai nhiều instance NocoBase làm môi trường runtime ứng dụng độc lập, chịu trách nhiệm thực sự chứa các ứng dụng nghiệp vụ. Các môi trường được cô lập lẫn nhau, làm việc phối hợp, từ đó phân tán hiệu quả áp lực instance đơn, nâng cao đáng kể tính ổn định, khả năng mở rộng và khả năng cô lập lỗi của hệ thống.

Về mặt triển khai, các môi trường khác nhau vừa có thể chạy trong các process độc lập, vừa có thể được triển khai dưới dạng các Docker container khác nhau, hoặc tồn tại dưới dạng nhiều Kubernetes Deployment, có thể thích ứng linh hoạt với các môi trường hạ tầng có quy mô và kiến trúc khác nhau.

## Triển khai

Trong chế độ triển khai hỗn hợp đa môi trường:

- Entry application (Supervisor) chịu trách nhiệm quản lý thống nhất ứng dụng và thông tin môi trường
- Worker application (Worker) làm môi trường runtime nghiệp vụ thực tế
- Cấu hình ứng dụng và môi trường được cache qua Redis
- Đồng bộ lệnh và trạng thái giữa entry application và Worker application phụ thuộc vào giao tiếp Redis

Hiện tại chưa cung cấp tính năng tạo môi trường, các Worker application cần được triển khai thủ công và cấu hình thông tin môi trường tương ứng thì mới được entry application nhận diện.

### Phụ thuộc kiến trúc

Trước khi triển khai, vui lòng chuẩn bị các dịch vụ sau:

- Redis
  - Cache cấu hình ứng dụng và môi trường
  - Là kênh giao tiếp lệnh giữa entry application và Worker application

- Database
  - Dịch vụ database mà entry application và Worker application cần kết nối

### Entry Application (Supervisor)

Entry application làm trung tâm quản lý thống nhất, chịu trách nhiệm tạo, khởi động, dừng ứng dụng và điều phối môi trường, cũng như proxy truy cập ứng dụng.

Mô tả cấu hình biến môi trường entry application

```bash
# Chế độ ứng dụng
APP_MODE=supervisor
# Phương thức khám phá ứng dụng
APP_DISCOVERY_ADAPTER=remote
# Phương thức quản lý process ứng dụng
APP_PROCESS_ADAPTER=remote
# Redis cache cấu hình ứng dụng, môi trường
APP_SUPERVISOR_REDIS_URL=
# Phương thức giao tiếp lệnh ứng dụng
APP_COMMAND_ADPATER=redis
# Redis giao tiếp lệnh ứng dụng
APP_COMMAND_REDIS_URL=
```

### Worker Application (Worker)

Worker application làm môi trường runtime nghiệp vụ thực tế, chịu trách nhiệm chứa và chạy các instance ứng dụng NocoBase cụ thể.

Mô tả cấu hình biến môi trường Worker application

```bash
# Chế độ ứng dụng
APP_MODE=worker
# Phương thức khám phá ứng dụng
APP_DISCOVERY_ADAPTER=remote
# Phương thức quản lý process ứng dụng
APP_PROCESS_ADAPTER=local
# Redis cache cấu hình ứng dụng, môi trường
APP_SUPERVISOR_REDIS_URL=
# Phương thức giao tiếp lệnh ứng dụng
APP_COMMAND_ADPATER=redis
# Redis giao tiếp lệnh ứng dụng
APP_COMMAND_REDIS_URL=
# Định danh môi trường
ENVIRONMENT_NAME=
# URL truy cập môi trường
ENVIRONMENT_URL=
# URL truy cập proxy môi trường
ENVIRONMENT_PROXY_URL=
```

### Ví dụ Docker Compose

Ví dụ sau minh họa một phương án triển khai hỗn hợp đa môi trường lấy Docker container làm đơn vị chạy, triển khai một entry application và hai Worker application qua Docker Compose.

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

Các thao tác quản lý cơ bản của ứng dụng giống với chế độ shared memory, vui lòng tham khảo [Chế độ Shared Memory](./local.md). Phần này chủ yếu giới thiệu nội dung liên quan đến cấu hình đa môi trường.

### Danh sách môi trường

Sau khi triển khai xong, vào trang "AppSupervisor" của entry application, có thể xem danh sách các môi trường Worker đã đăng ký trong tab "Môi trường". Bao gồm các thông tin như định danh môi trường, phiên bản Worker application, URL truy cập và trạng thái. Worker application báo cáo heartbeat mỗi 2 phút để đảm bảo tính khả dụng của môi trường.

![](https://static-docs.nocobase.com/202512291830371.png)

### Tạo ứng dụng

Khi tạo ứng dụng, có thể chọn một đến nhiều môi trường runtime để chỉ định ứng dụng sẽ được triển khai vào các Worker application nào. Thông thường, khuyến nghị chỉ chọn một môi trường. Chỉ khi Worker application đã được [tách dịch vụ](/cluster-mode/services-splitting), cần triển khai cùng một ứng dụng vào nhiều môi trường runtime để chia tải hoặc cô lập khả năng, mới chọn nhiều môi trường.

![](https://static-docs.nocobase.com/202512291835086.png)

### Danh sách ứng dụng

Trang danh sách ứng dụng sẽ hiển thị môi trường runtime hiện tại và thông tin trạng thái của từng ứng dụng. Nếu ứng dụng được triển khai trong nhiều môi trường, sẽ hiển thị nhiều trạng thái runtime. Cùng một ứng dụng trong nhiều môi trường sẽ giữ trạng thái thống nhất trong điều kiện bình thường, cần điều khiển khởi động và dừng thống nhất.

![](https://static-docs.nocobase.com/202512291842216.png)

### Khởi động ứng dụng

Vì khi khởi động ứng dụng có thể ghi dữ liệu khởi tạo vào database, để tránh race condition trong môi trường đa môi trường, các ứng dụng được triển khai trong nhiều môi trường sẽ xếp hàng khi khởi động.

![](https://static-docs.nocobase.com/202512291841727.png)

### Proxy truy cập ứng dụng

Worker application có thể được truy cập qua proxy thông qua sub-path `/apps/:appName/admin` của entry application.

![](https://static-docs.nocobase.com/202601082154230.png)

Nếu ứng dụng được triển khai trong nhiều môi trường, cần chỉ định một môi trường đích cho proxy truy cập.

![](https://static-docs.nocobase.com/202601082155146.png)

Mặc định, địa chỉ proxy truy cập sử dụng địa chỉ truy cập của Worker application, biến môi trường tương ứng là `ENVIRONMENT_URL`, cần đảm bảo địa chỉ này có thể truy cập trong môi trường mạng nơi entry application chạy. Nếu cần sử dụng địa chỉ proxy truy cập khác, có thể ghi đè qua biến môi trường `ENVIRONMENT_PROXY_URL`.
