---
pkg: "@nocobase/preset-cluster"
title: "Triển khai Kubernetes"
description: "Triển khai NocoBase Cluster trong K8S/K3S: ConfigMap biến môi trường, Deployment, shared storage PVC, middleware Redis/PostgreSQL, load balancing và health check."
keywords: "Triển khai Kubernetes,K8S,K3S,ConfigMap,Deployment,PVC shared storage,Triển khai Cluster,NocoBase"
---

# Triển khai Kubernetes

Tài liệu này nhằm hướng dẫn người dùng triển khai nhanh NocoBase chế độ Cluster trong môi trường K8S, giả định độc giả đã quen với môi trường K8S và đã hoàn thành nội dung trong [Chuẩn bị](./preparations.md).

:::info{title="Mẹo"}
Để xác minh nhanh quy trình triển khai K8S, môi trường thao tác trong tài liệu này là cluster K3S single node (hệ điều hành Ubuntu). Hướng dẫn này cũng áp dụng cho cluster K8S chuẩn. Nếu khi triển khai trong cluster K8S chuẩn xảy ra tình huống khác với tài liệu này, vui lòng cho chúng tôi biết.
:::

## Môi trường cluster

Có thể bỏ qua bước này nếu đã có môi trường cluster K8S.

Chuẩn bị một máy chủ đã cài đặt Debian / Ubuntu, và chạy cluster K3S ở chế độ single node trên đó. Về K3S là gì, có thể truy cập [Trang chính K3S](https://docs.k3s.io/zh/).

Các bước như sau:

1. Đăng nhập SSH vào máy chủ.
2. Cài đặt master node của cluster K3S trên máy chủ bằng script chính thức.

```bash
# Sau khi cài đặt, file kubeconfig mặc định là /etc/rancher/k3s/k3s.yaml
curl -sfL https://get.k3s.io | sh -
```

```bash
# Xác minh cấu hình có chính xác không
kubectl get node
```

## Triển khai application cluster

Triển khai ứng dụng NocoBase trong cluster K8S ở chế độ Cluster.

### Biến môi trường

Thông thường nên tách biến môi trường ra khỏi file cấu hình triển khai ứng dụng. Tài liệu này lấy ConfigMap làm ví dụ orchestration. Trong production thực tế có thể thêm Secrets để tách thêm thông tin nhạy cảm.

Các bước như sau:

1. Tạo file `nocobase-cm.yaml`.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nocobase-config
data:
  TZ: Asia/Shanghai
  # Cấu hình database và Redis bên dưới sử dụng các dịch vụ PostgreSQL và Redis trong cluster theo tài liệu "Triển khai middleware K8S"
  # Nếu môi trường mục tiêu đã có sẵn dịch vụ database và Redis khác, chỉ cần sửa cấu hình tương ứng của database và Redis bên dưới
  CACHE_DEFAULT_STORE: redis
  # Sử dụng dịch vụ Redis có sẵn trong môi trường hoặc tự triển khai
  CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
  PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
  LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
  # Sử dụng dịch vụ PostgreSQL có sẵn trong môi trường hoặc tự triển khai
  DB_DATABASE: nocobase
  DB_DIALECT: postgres
  DB_HOST: "postgres-0.postgres-service"
  DB_PASSWORD: nocobase123
  DB_PORT: "5432"
  DB_UNDERSCORED: "true"
  DB_USER: nocobase
  # service platform username
  NOCOBASE_PKG_USERNAME: "<your user>"
  # service platform password
  NOCOBASE_PKG_PASSWORD: "<your password>"

  # ... biến môi trường khác
```

2. Chạy lệnh `kubectl` để triển khai ConfigMap.

```bash
kubectl apply -f nocobase-cm.yaml
```

### Shared storage

Các node khác nhau của ứng dụng NocoBase triển khai theo chế độ Cluster cần mount cùng một thư mục storage, để làm điều này cần tạo một Persistent Volume hỗ trợ đọc/ghi multi-node. Thông thường cần tạo cloud disk trên nền tảng cloud provider và bind làm PV, cũng có thể mount thư mục shared storage qua các cách khác như NFS.

### Triển khai ứng dụng

Lần triển khai đầu tiên cần bắt đầu từ một node, sau khi hoàn thành mới scale khởi động nhiều node.

1. Tạo file `nocobase-apps.yaml`.

```yaml
# Tạo một PVC, các Pod được triển khai bởi Deployment bên dưới đều mount cùng thư mục persistent storage thông qua PVC này
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
  storageClassName: "" # Ví dụ sử dụng dịch vụ NFS của master node nên chỉ định rõ ràng là rỗng, tránh sử dụng StorageClass mặc định
---
# Service của ứng dụng, cung cấp dịch vụ ra ngoài cluster sau khi bind Ingress
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
---
# Deployment của ứng dụng, có thể triển khai nhiều container ứng dụng
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nocobase
spec:
  replicas: 1 # Lần triển khai đầu chỉ một node
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
          # Biến môi trường được load từ ConfigMap đã triển khai trước đó
          envFrom:
            - configMapRef:
                name: nocobase-config
          volumeMounts:
            - name: nocobase-data
              mountPath: /app/nocobase/storage
          # Khai báo nhu cầu và giới hạn tài nguyên chạy dịch vụ
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          # Lệnh kiểm tra liveness, cluster dùng lệnh này để xác định có cần restart Pod không
          livenessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 60
          # Lệnh kiểm tra readiness, cluster dùng lệnh này để xác định có chuyển traffic Service vào Pod không
          readinessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 30
      # Mount persistent storage qua PVC
      volumes:
        - name: nocobase-data
          persistentVolumeClaim:
            claimName: nocobase-pvc
```

2. Chạy lệnh `kubectl` để triển khai dịch vụ ứng dụng NocoBase.

```bash
kubectl apply -f nocobase-apps.yaml
```

3. Xác minh trạng thái dịch vụ ứng dụng NocoBase.

```bash
# Xem trạng thái Pod của dịch vụ NocoBase
kubectl get pods -l app=nocobase
```

Output ví dụ như sau, khi `STATUS` là `Running` nghĩa là dịch vụ khởi động thành công:

```text
NAME                        READY   STATUS    RESTARTS   AGE
nocobase-5558b774d7-w6swf   1/1     Running   0          7h6m
```

4. Khi ứng dụng khởi động lần đầu, cần kích hoạt thủ công các plugin sau trong giao diện quản lý:

- @nocobase/plugin-sync-adapter-redis
- @nocobase/plugin-lock-adapter-redis

Sau đó mới scale up. Ví dụ scale lên 4 node:

```bash
kubectl scale deployment nocobase-deployment --replicas=4
```

## Thay đổi ứng dụng

Thay đổi ứng dụng là chỉ các tình huống sau:

- Nâng cấp phiên bản ứng dụng
- Cài đặt plugin mới
- Kích hoạt plugin

NocoBase tạm thời chưa triển khai tự động đồng bộ thay đổi cho multi-instance trong các kịch bản trên trong Cluster, nên cần xử lý thủ công theo các bước sau. Các bước dưới đây chỉ liên quan đến thay đổi dịch vụ ứng dụng, trước khi thay đổi vui lòng tự backup database và persistent storage.

### Rolling upgrade phiên bản ứng dụng

1. Chạy lệnh `kubectl set image` để chỉnh sửa phiên bản image container của Deployment.

    ```bash
    kubectl set image deployment/nocobase nocobase=nocobase/nocobase:1.7
    ```

2. Xem trạng thái rolling update.

    ```bash
    # Xem tiến độ rolling update tổng thể của Deployment
    kubectl rollout status deployment/nocobase

    # Xem trạng thái từng Pod
    kubectl get pods -l app=nocobase
    ```

Nếu phát hiện bất thường trong quá trình hoặc sau khi nâng cấp phiên bản ứng dụng, cần rollback phiên bản, thực hiện lệnh sau để rollback phiên bản image container:

```bash
kubectl rollout undo deployment/nocobase
```

### Restart smooth ứng dụng

Sau khi cài đặt plugin mới hoặc kích hoạt plugin cần làm mới cấu hình hoặc trạng thái ứng dụng, có thể dùng lệnh sau để restart smooth từng Pod.

1. Chạy lệnh `kubectl rollout restart`.

    ```bash
    kubectl rollout restart deployment/nocobase
    ```

2. Xem trạng thái rolling restart.

    ```bash
    # Xem tiến độ restart tổng thể của Deployment
    kubectl rollout status deployment/nocobase

    # Xem trạng thái từng Pod
    kubectl get pods -l app=nocobase
    ```

## Application gateway

Khi ứng dụng triển khai trong cluster K8S cần được truy cập từ bên ngoài, cần bind một Ingress cho Service ứng dụng. Môi trường cluster sử dụng trong tài liệu này là K3S, component Ingress Controller được cài đặt mặc định trong K3S là Traefik.

### Traefik IngressRoute

Các bước như sau:

1. Tạo file `nocobase-ingress.yaml`.

    ```yaml
    apiVersion: traefik.containo.us/v1alpha1
    kind: IngressRoute
    metadata:
      name: nocobase-ingress
    spec:
      entryPoints:
        - web
      routes:
        # Tại đây 'nocobase.local' nên thay bằng domain thật trỏ đến IP cluster
        # Khi không có domain để xác minh, sửa file host cục bộ, thêm bản ghi nocobase.local trỏ đến IP cluster
        # Mở http://nocobase.local trên trình duyệt là có thể truy cập ứng dụng NocoBase trong cluster
        - match: Host(`nocobase.local`)
          kind: Rule
          services:
            # Service này là Service được tạo khi triển khai ứng dụng nocobase trong mục "Triển khai ứng dụng" ở phần trước
            - name: nocobase
              port: 13000
    ```

2. Chạy lệnh `kubectl` để triển khai Ingress của ứng dụng NocoBase.

    ```bash
    kubectl apply -f nocobase-ingress.yaml
    ```

### Ingress-Nginx

Phần lớn các cluster K8S cài đặt component Ingress Controller là Ingress-Nginx, dưới đây là một file `nocobase-ingress.yaml` dựa trên Ingress-Nginx:

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
  name: nocobase-ingress
spec:
  rules:
    # Tại đây 'nocobase.local' nên thay bằng domain thật trỏ đến IP cluster
    # Khi không có domain để xác minh, sửa file host cục bộ, thêm bản ghi nocobase.local trỏ đến IP cluster
    # Mở http://nocobase.local trên trình duyệt là có thể truy cập ứng dụng Nocobase trong cluster
    - host: nocobase.local
      http:
        paths:
          - backend:
              serviceName: nocobase
              servicePort: 13000
```

## Sử dụng Helm Charts

Chúng tôi đã viết Helm Charts cho ứng dụng Nocobase, có thể sử dụng Helm CLI để triển khai dịch vụ ứng dụng NocoBase trong K8S.

### Chuẩn bị

Đảm bảo môi trường thao tác đã cài đặt các client như `kubectl`, `helm`, và xác nhận `kubectl` có thể kết nối chính xác đến cluster mục tiêu.

### Thêm repository

Thêm repository của NocoBase Helm Charts:

```bash
# Thêm repository Helm Charts của NocoBase
helm repo add nocobase https://nocobase.github.io/helm-charts

# Cập nhật chỉ mục Helm
helm repo update
```

### Triển khai Helm

1.  Tạo file `values.yaml`.

    ```yaml
    persistent:
      # Kích thước shared storage cần thiết cho NocoBase Cluster
      size: 10Gi
      # Storage class do dịch vụ K8S cloud cung cấp
      # Tại đây giống mục "Triển khai ứng dụng", sử dụng dịch vụ NFS của master node nên chỉ định rõ ràng là rỗng
      storageClassName: ""

    configMap:
      data:
        TZ: Asia/Shanghai
        # Cấu hình database và Redis bên dưới sử dụng các dịch vụ PostgreSQL và Redis trong cluster theo tài liệu "Triển khai middleware K8S"
        # Nếu môi trường mục tiêu đã có sẵn dịch vụ database và Redis khác, chỉ cần sửa cấu hình tương ứng của database và Redis bên dưới
        CACHE_DEFAULT_STORE: redis
        # Sử dụng dịch vụ Redis có sẵn trong môi trường hoặc tự triển khai
        CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
        PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
        LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
        # Sử dụng dịch vụ PostgreSQL có sẵn trong môi trường hoặc tự triển khai
        DB_DATABASE: nocobase
        DB_DIALECT: postgres
        DB_HOST: "postgres-0.postgres-service"
        DB_PASSWORD: nocobase123
        DB_PORT: "5432"
        DB_UNDERSCORED: "true"
        DB_USER: nocobase
        # service platform username
        NOCOBASE_PKG_USERNAME: "<your user>"
        # service platform password
        NOCOBASE_PKG_PASSWORD: "<your password>"

        # ... biến môi trường khác
    ```

2.  Chạy lệnh `helm install` để bắt đầu cài đặt.

    ```bash
    helm install nocobase nocobase/nocobase --values values.yaml
    ```
