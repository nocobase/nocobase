
:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Triển khai Kubernetes

Bài viết này hướng dẫn người dùng triển khai NocoBase ở chế độ cụm (cluster mode) trong môi trường Kubernetes (K8S) một cách nhanh chóng. Chúng tôi giả định rằng bạn đã quen thuộc với môi trường K8S và đã hoàn thành các bước trong phần [Chuẩn bị](./preparations.md).

:::info{title="Mẹo"}
Để nhanh chóng xác minh quy trình triển khai K8S, môi trường vận hành trong bài viết này là một cụm K3S đơn nút (hệ điều hành: Ubuntu). Hướng dẫn này cũng áp dụng cho các cụm K8S tiêu chuẩn. Nếu bạn gặp phải bất kỳ điểm khác biệt nào khi triển khai trên cụm K8S tiêu chuẩn, vui lòng thông báo cho chúng tôi.
:::

## Môi trường cụm

Nếu bạn đã có môi trường cụm Kubernetes, bạn có thể bỏ qua bước này.

Chuẩn bị một máy chủ đã cài đặt Debian / Ubuntu và chạy cụm K3S ở chế độ đơn nút trên đó. Để tìm hiểu thêm về K3S, bạn có thể truy cập [trang web chính thức của K3S](https://docs.k3s.io/zh/).

Các bước như sau:

1. Đăng nhập vào máy chủ qua SSH.
2. Sử dụng script chính thức để cài đặt nút chính (master node) của cụm K3S trên máy chủ.

```bash
# Sau khi cài đặt, tệp kubeconfig mặc định là /etc/rancher/k3s/k3s.yaml
curl -sfL https://get.k3s.io | sh -
```

```bash
# Xác minh cấu hình đã chính xác chưa
kubectl get node
```

## Triển khai ứng dụng cụm

Triển khai ứng dụng NocoBase ở chế độ cụm trên một cụm Kubernetes.

### Biến môi trường

Thông thường, các biến môi trường nên được tách riêng khỏi tệp cấu hình triển khai ứng dụng. Bài viết này sử dụng ConfigMap làm ví dụ minh họa. Trong môi trường sản xuất thực tế, bạn có thể sử dụng Secrets để tách biệt thêm các thông tin nhạy cảm.

Các bước như sau:

1. Tạo tệp `nocobase-cm.yaml`.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nocobase-config
data:
  TZ: Asia/Shanghai # Múi giờ của bạn, ví dụ: UTC, Asia/Ho_Chi_Minh
  # Cấu hình cơ sở dữ liệu và Redis dưới đây sử dụng các dịch vụ PostgreSQL và Redis trong cụm từ tài liệu "Triển khai Middleware Kubernetes".
  # Nếu môi trường của bạn đã có sẵn các dịch vụ cơ sở dữ liệu và Redis khác, chỉ cần sửa đổi các cấu hình tương ứng bên dưới.
  CACHE_DEFAULT_STORE: redis
  # Sử dụng dịch vụ Redis đã có sẵn trong môi trường hoặc tự triển khai.
  CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
  PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
  LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
  # Sử dụng dịch vụ PostgreSQL đã có sẵn trong môi trường hoặc tự triển khai.
  DB_DATABASE: nocobase
  DB_DIALECT: postgres
  DB_HOST: "postgres-0.postgres-service"
  DB_PASSWORD: nocobase123
  DB_PORT: "5432"
  DB_UNDERSCORED: "true"
  DB_USER: nocobase
  # tên người dùng nền tảng dịch vụ
  NOCOBASE_PKG_USERNAME: "<your user>"
  # mật khẩu nền tảng dịch vụ
  NOCOBASE_PKG_PASSWORD: "<your password>"

  # ... các biến môi trường khác
```

2. Chạy lệnh `kubectl` để triển khai ConfigMap.

```bash
kubectl apply -f nocobase-cm.yaml
```

### Lưu trữ chia sẻ

Các nút khác nhau của ứng dụng NocoBase được triển khai ở chế độ cụm cần gắn cùng một thư mục lưu trữ (`storage`). Để làm được điều này, bạn cần tạo một Persistent Volume (PV) hỗ trợ đọc ghi từ nhiều nút (ReadWriteMany). Thông thường, bạn sẽ tạo một đĩa đám mây trên nền tảng của nhà cung cấp dịch vụ đám mây và liên kết nó làm PV, hoặc bạn có thể gắn thư mục lưu trữ chia sẻ bằng các phương pháp khác như NFS.

### Triển khai ứng dụng

Đối với lần triển khai ban đầu, hãy bắt đầu với một nút đơn. Sau khi hoàn tất, bạn có thể mở rộng (scale) để khởi động nhiều nút hơn.

1. Tạo tệp `nocobase-apps.yaml`.

```yaml
# Tạo một PVC. Nhiều Pod được triển khai bởi Deployment bên dưới sẽ gắn cùng một thư mục lưu trữ bền vững thông qua PVC này.
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: nocobase-pvc
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 10Gi
  storageClassName: "" # Ví dụ này sử dụng dịch vụ NFS của nút chính nên được chỉ định rõ ràng là trống, tránh sử dụng StorageClass mặc định.
---
# Service của ứng dụng, cung cấp dịch vụ ra bên ngoài cụm sau khi được liên kết với một Ingress.
apiVersion: v1
kind: Service
metadata:
  name: nocobase
spec:
  ports:
    - name: nocobase
      port: 13000
      targetPort: 13000
  selector:
    app: nocobase
  type: ClusterIP
# Deployment của ứng dụng, có thể triển khai nhiều container ứng dụng.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nocobase
spec:
  replicas: 1 # Triển khai ban đầu chỉ với một nút.
  selector:
    matchLabels:
      app: nocobase
  template:
    metadata:
      labels:
        app: nocobase
    spec:
      containers:
        - name: nocobase
          image: nocobase/nocobase:1.6
          ports:
            - containerPort: 13000
          # Tải các biến môi trường từ ConfigMap đã triển khai trước đó.
          envFrom:
            - configMapRef:
                name: nocobase-config
          volumeMounts:
            - name: nocobase-data
              mountPath: /app/nocobase/storage
          # Khai báo yêu cầu và giới hạn tài nguyên cho dịch vụ.
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          # Lệnh kiểm tra sự sống (liveness probe). Cụm sử dụng lệnh này để xác định xem Pod có cần được khởi động lại hay không.
          livenessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 60
          # Lệnh kiểm tra sẵn sàng (readiness probe). Cụm sử dụng lệnh này để xác định xem có nên chuyển lưu lượng truy cập Service đến Pod hay không.
          readinessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 30
      # Gắn lưu trữ bền vững thông qua PVC.
      volumes:
        - name: nocobase-data
          persistentVolumeClaim:
            claimName: nocobase-pvc
```

2. Chạy lệnh `kubectl` để triển khai dịch vụ ứng dụng NocoBase.

```bash
kubectl apply -f nocobase-apps.yaml
```

3. Xác minh trạng thái của dịch vụ ứng dụng NocoBase.

```bash
# Kiểm tra trạng thái Pod của dịch vụ NocoBase
kubectl get pods -l app=nocobase
```

Ví dụ đầu ra như sau. `STATUS` là `Running` cho biết dịch vụ đã khởi động thành công:

```text
NAME                        READY   STATUS    RESTARTS   AGE
nocobase-5558b774d7-w6swf   1/1     Running   0          7h6m
```

4. Khi ứng dụng khởi động lần đầu, bạn cần bật thủ công các **plugin** sau trong giao diện quản trị:

- @nocobase/plugin-sync-adapter-redis
- @nocobase/plugin-lock-adapter-redis

Sau đó, bạn có thể thực hiện mở rộng. Ví dụ, mở rộng lên 4 nút:

```bash
kubectl scale deployment nocobase --replicas=4
```

## Thay đổi ứng dụng

Thay đổi ứng dụng đề cập đến các trường hợp sau:

- Nâng cấp phiên bản ứng dụng
- Cài đặt **plugin** mới
- Kích hoạt **plugin**

NocoBase hiện chưa hỗ trợ tự động đồng bộ hóa các thay đổi trên nhiều phiên bản trong cụm cho các trường hợp trên. Do đó, bạn cần xử lý thủ công theo các bước dưới đây. Các bước này chỉ liên quan đến thay đổi dịch vụ ứng dụng. Trước khi thực hiện bất kỳ thay đổi nào, vui lòng tự sao lưu cơ sở dữ liệu và lưu trữ bền vững của bạn.

### Nâng cấp phiên bản ứng dụng theo kiểu cuốn chiếu

1. Chạy lệnh `kubectl set image` để thay đổi phiên bản ảnh container của Deployment.

    ```bash
    kubectl set image deployment/nocobase nocobase=nocobase/nocobase:1.7
    ```

2. Kiểm tra trạng thái cập nhật cuốn chiếu.

    ```bash
    # Kiểm tra tiến độ cập nhật cuốn chiếu tổng thể của Deployment
    kubectl rollout status deployment/nocobase

    # Kiểm tra trạng thái của từng Pod
    kubectl get pods -l app=nocobase
    ```

Nếu bạn gặp bất kỳ sự cố nào trong hoặc sau quá trình nâng cấp phiên bản ứng dụng và cần quay lại phiên bản trước, hãy thực hiện lệnh sau để quay lại phiên bản ảnh container:

```bash
kubectl rollout undo deployment/nocobase
```

### Khởi động lại ứng dụng một cách nhẹ nhàng

Sau khi cài đặt hoặc kích hoạt **plugin** mới, bạn cần làm mới cấu hình hoặc trạng thái ứng dụng. Bạn có thể sử dụng lệnh sau để khởi động lại từng Pod một cách nhẹ nhàng.

1. Chạy lệnh `kubectl rollout restart`.

    ```bash
    kubectl rollout restart deployment/nocobase
    ```

2. Kiểm tra trạng thái khởi động lại cuốn chiếu.

    ```bash
    # Kiểm tra tiến độ khởi động lại tổng thể của Deployment
    kubectl rollout status deployment/nocobase

    # Kiểm tra trạng thái của từng Pod
    kubectl get pods -l app=nocobase
    ```

## Cổng ứng dụng

Để một ứng dụng được triển khai trong cụm K8S có thể truy cập được từ bên ngoài, bạn cần liên kết một Ingress với Service của ứng dụng đó. Môi trường cụm được sử dụng trong bài viết này là K3S, và thành phần Ingress Controller mặc định của K3S là Traefik.

### Traefik IngressRoute

Các bước như sau:

1. Tạo tệp `nocobase-ingress.yaml`.

    ```yaml
    apiVersion: traefik.containo.us/v1alpha1
    kind: IngressRoute
    metadata:
      name: nocobase-ingress
    spec:
      entryPoints:
        - web
      routes:
        # Tại đây, 'nocobase.local' nên được thay thế bằng một tên miền thực tế trỏ đến IP của cụm.
        # Nếu không có tên miền để xác minh, bạn có thể sửa đổi tệp hosts cục bộ của mình để thêm bản ghi nocobase.local trỏ đến IP của cụm.
        # Sau đó, bạn có thể truy cập ứng dụng NocoBase trong cụm bằng cách mở http://nocobase.local trong trình duyệt của mình.
        - match: Host(`nocobase.local`)
          kind: Rule
          services:
            # Đây là Service được tạo khi triển khai ứng dụng nocobase trong phần "Triển khai ứng dụng" ở trên.
            - name: nocobase
              port: 13000
    ```

2. Chạy lệnh `kubectl` để triển khai Ingress cho ứng dụng NocoBase.

    ```bash
    kubectl apply -f nocobase-ingress.yaml
    ```

### Ingress-Nginx

Hầu hết các cụm K8S đều sử dụng Ingress-Nginx làm thành phần Ingress Controller. Dưới đây là tệp `nocobase-ingress.yaml` dựa trên Ingress-Nginx:

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
  name: nocobase-ingress
spec:
  rules:
    # Tại đây, 'nocobase.local' nên được thay thế bằng một tên miền thực tế trỏ đến IP của cụm.
    # Nếu không có tên miền để xác minh, bạn có thể sửa đổi tệp hosts cục bộ của mình để thêm bản ghi nocobase.local trỏ đến IP của cụm.
    # Sau đó, bạn có thể truy cập ứng dụng NocoBase trong cụm bằng cách mở http://nocobase.local trong trình duyệt của mình.
    - host: nocobase.local
      http:
        paths:
          - backend:
              serviceName: nocobase
              servicePort: 13000
```

## Sử dụng Helm Charts

Chúng tôi đã viết Helm Charts cho ứng dụng NocoBase, cho phép bạn triển khai dịch vụ ứng dụng NocoBase trong K8S bằng cách sử dụng Helm CLI.

### Chuẩn bị

Đảm bảo rằng các client như `kubectl` và `helm` đã được cài đặt trong môi trường vận hành của bạn và `kubectl` có thể kết nối chính xác đến cụm mục tiêu.

### Thêm kho lưu trữ

Thêm kho lưu trữ Helm Charts của NocoBase:

```bash
# Thêm kho lưu trữ Helm Charts của NocoBase
helm repo add nocobase https://nocobase.github.io/helm-charts

# Cập nhật chỉ mục Helm
helm repo update
```

### Triển khai bằng Helm

1.  Tạo tệp `values.yaml`.

    ```yaml
    persistent:
      # Kích thước cần thiết cho lưu trữ chia sẻ của cụm NocoBase
      size: 10Gi
      # Lớp lưu trữ được cung cấp bởi Kubernetes của dịch vụ đám mây
      # Tương tự như trong phần "Triển khai ứng dụng", giá trị này được đặt rõ ràng là trống vì nó sử dụng dịch vụ NFS của nút chính.
      storageClassName: ""

    configMap:
      data:
        TZ: Asia/Shanghai # Múi giờ của bạn, ví dụ: UTC, Asia/Ho_Chi_Minh
        # Cấu hình cơ sở dữ liệu và Redis dưới đây sử dụng các dịch vụ PostgreSQL và Redis trong cụm từ tài liệu "Triển khai Middleware Kubernetes".
        # Nếu môi trường của bạn đã có sẵn các dịch vụ cơ sở dữ liệu và Redis khác, chỉ cần sửa đổi các cấu hình tương ứng bên dưới.
        CACHE_DEFAULT_STORE: redis
        # Sử dụng dịch vụ Redis đã có sẵn trong môi trường hoặc tự triển khai.
        CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
        PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
        LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
        # Sử dụng dịch vụ PostgreSQL đã có sẵn trong môi trường hoặc tự triển khai.
        DB_DATABASE: nocobase
        DB_DIALECT: postgres
        DB_HOST: "postgres-0.postgres-service"
        DB_PASSWORD: nocobase123
        DB_PORT: "5432"
        DB_UNDERSCORED: "true"
        DB_USER: nocobase
        # tên người dùng nền tảng dịch vụ
        NOCOBASE_PKG_USERNAME: "<your user>"
        # mật khẩu nền tảng dịch vụ
        NOCOBASE_PKG_PASSWORD: "<your password>"

        # ... các biến môi trường khác
    ```

2.  Chạy lệnh `helm install` để bắt đầu cài đặt.

    ```bash
    helm install nocobase nocobase/nocobase --values values.yaml
    ```