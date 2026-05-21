---
pkg: "@nocobase/preset-cluster"
title: "Deployment Kubernetes"
description: "Deploy cluster NocoBase di K8S/K3S: environment variable ConfigMap, Deployment, PVC shared storage, middleware Redis/PostgreSQL, load balancing dan health check."
keywords: "deployment Kubernetes,K8S,K3S,ConfigMap,Deployment,PVC shared storage,deployment cluster,NocoBase"
---

# Deployment Kubernetes

Dokumen ini bertujuan untuk memandu pengguna agar dapat dengan cepat men-deploy NocoBase dalam cluster mode di environment K8S, mengasumsikan pembaca sudah familiar dengan environment K8S, dan telah menyelesaikan konten di [Persiapan](./preparations.md).

:::info{title="Tips"}
Untuk verifikasi cepat alur deployment K8S, environment operasi dokumen ini adalah cluster K3S single-node (operating system Ubuntu). Panduan ini juga berlaku di cluster K8S standar. Jika terjadi situasi berbeda dari dokumen ini saat deployment di cluster K8S standar, mohon beri tahu kami.
:::

## Environment Cluster

Yang sudah memiliki environment cluster K8S dapat melewati langkah ini.

Siapkan satu server yang menginstal Debian / Ubuntu, dan jalankan cluster K3S dalam mode single-node di atasnya. Tentang apa itu K3S, Anda dapat mengakses [website resmi K3S](https://docs.k3s.io/).

Langkah-langkah:

1. SSH login ke server.
2. Instal master node cluster K3S menggunakan script resmi di server.

```bash
# Setelah instalasi, file kubeconfig default adalah /etc/rancher/k3s/k3s.yaml
curl -sfL https://get.k3s.io | sh -
```

```bash
# Verifikasi konfigurasi sudah benar
kubectl get node
```

## Deployment Aplikasi Cluster

Men-deploy aplikasi NocoBase dalam cluster mode di cluster K8S.

### Environment Variable

Biasanya environment variable harus dipisahkan dari file konfigurasi deployment aplikasi. Dokumen ini menggunakan ConfigMap sebagai contoh orchestration. Production aktual dapat menambahkan Secrets untuk lebih memisahkan informasi sensitif.

Langkah-langkah:

1. Buat file `nocobase-cm.yaml`.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nocobase-config
data:
  TZ: Asia/Shanghai
  # Konfigurasi database dan Redis berikut menggunakan service PostgreSQL dan Redis dari dokumen "Deployment Middleware K8S" di cluster
  # Jika environment target sudah memiliki database dan service Redis lainnya, ubah konfigurasi terkait database dan Redis berikut sesuai
  CACHE_DEFAULT_STORE: redis
  # Gunakan service Redis yang sudah ada di environment atau yang Anda deploy sendiri
  CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
  PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
  LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
  # Gunakan service PostgreSQL yang sudah ada di environment atau yang Anda deploy sendiri
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

  # ... environment variable lainnya
```

2. Jalankan command `kubectl` untuk men-deploy ConfigMap.

```bash
kubectl apply -f nocobase-cm.yaml
```

### Shared Storage

Node yang berbeda dari aplikasi NocoBase yang di-deploy dalam cluster mode perlu melakukan mounting direktori storage yang sama. Untuk itu, perlu membuat Persistent Volume yang mendukung baca/tulis multi-node. Biasanya perlu membuat cloud disk di platform cloud service provider dan binding sebagai PV. Anda juga dapat melakukan mounting direktori shared storage melalui cara lain seperti NFS.

### Deployment Aplikasi

Deployment aplikasi pertama kali harus dimulai dari satu node. Setelah selesai, baru scale-up untuk menjalankan multiple node.

1. Buat file `nocobase-apps.yaml`.

```yaml
# Buat PVC, multiple Pod yang di-deploy oleh Deployment berikut akan melakukan mounting direktori persistent storage yang sama melalui PVC ini
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
  storageClassName: "" # Contoh menggunakan service NFS master node sehingga ditentukan secara eksplisit kosong, untuk menghindari penggunaan default StorageClass
---
# Service aplikasi, setelah binding Ingress menyediakan service ke luar cluster
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
# Deployment aplikasi, dapat men-deploy multiple container aplikasi
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nocobase
spec:
  replicas: 1 # Deployment pertama hanya satu node
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
          # Environment variable dimuat dari ConfigMap yang di-deploy sebelumnya
          envFrom:
            - configMapRef:
                name: nocobase-config
          volumeMounts:
            - name: nocobase-data
              mountPath: /app/nocobase/storage
          # Deklarasi requirement dan limit resource untuk menjalankan service
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          # Command liveness check service, cluster menentukan apakah perlu restart Pod melalui command ini
          livenessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 60
          # Command readiness check service, cluster menentukan apakah Service traffic dialihkan ke Pod melalui command ini
          readinessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 30
      # Mounting persistent storage melalui PVC
      volumes:
        - name: nocobase-data
          persistentVolumeClaim:
            claimName: nocobase-pvc
```

2. Jalankan command `kubectl` untuk men-deploy service aplikasi NocoBase.

```bash
kubectl apply -f nocobase-apps.yaml
```

3. Verifikasi status service aplikasi NocoBase.

```bash
# Lihat status Pod service NocoBase
kubectl get pods -l app=nocobase
```

Contoh output sebagai berikut. Saat `STATUS` adalah `Running` artinya service berhasil dijalankan:

```text
NAME                        READY   STATUS    RESTARTS   AGE
nocobase-5558b774d7-w6swf   1/1     Running   0          7h6m
```

4. Saat aplikasi pertama kali dijalankan, perlu mengaktifkan plugin berikut secara manual dari interface admin:

- @nocobase/plugin-sync-adapter-redis
- @nocobase/plugin-lock-adapter-redis

Kemudian baru lakukan scaling. Misalnya scaling ke 4 node:

```bash
kubectl scale deployment nocobase-deployment --replicas=4
```

## Perubahan Aplikasi

Perubahan aplikasi mengacu pada beberapa situasi berikut:

- Upgrade versi aplikasi
- Instalasi plugin baru
- Aktivasi plugin

NocoBase belum mengimplementasikan auto-sync change untuk multi-instance cluster pada skenario di atas, sehingga perlu ditangani secara manual mengikuti langkah-langkah berikut. Langkah-langkah berikut hanya melibatkan perubahan service aplikasi. Sebelum melakukan perubahan, harap lakukan backup database dan persistent storage sendiri.

### Rolling Upgrade Versi Aplikasi

1. Jalankan command `kubectl set image` untuk mengubah versi container image Deployment.

    ```bash
    kubectl set image deployment/nocobase nocobase=nocobase/nocobase:1.7
    ```

2. Lihat status rolling update.

    ```bash
    # Lihat progress rolling update Deployment secara keseluruhan
    kubectl rollout status deployment/nocobase

    # Lihat status setiap Pod
    kubectl get pods -l app=nocobase
    ```

Jika selama atau setelah upgrade versi aplikasi ditemukan anomali, perlu rollback versi, jalankan command berikut untuk rollback versi container image:

```bash
kubectl rollout undo deployment/nocobase
```

### Smooth Restart Aplikasi

Setelah instal plugin baru atau aktivasi plugin, perlu refresh konfigurasi atau status aplikasi. Anda dapat menggunakan command berikut untuk smooth restart setiap Pod.

1. Jalankan command `kubectl rollout restart`.

    ```bash
    kubectl rollout restart deployment/nocobase
    ```

2. Lihat status rolling restart.

    ```bash
    # Lihat progress restart Deployment secara keseluruhan
    kubectl rollout status deployment/nocobase

    # Lihat status setiap Pod
    kubectl get pods -l app=nocobase
    ```

## Application Gateway

Saat aplikasi yang di-deploy di cluster K8S perlu diakses dari luar, perlu binding Ingress untuk Service aplikasi. Environment cluster yang digunakan dokumen ini adalah K3S, komponen Ingress Controller default yang diinstal K3S adalah Traefik.

### Traefik IngressRoute

Langkah-langkah:

1. Buat file `nocobase-ingress.yaml`.

    ```yaml
    apiVersion: traefik.containo.us/v1alpha1
    kind: IngressRoute
    metadata:
      name: nocobase-ingress
    spec:
      entryPoints:
        - web
      routes:
        # 'nocobase.local' di sini harus diganti dengan domain real yang mengarah ke IP cluster
        # Jika tidak ada domain untuk verifikasi, modifikasi file host lokal, tambahkan record nocobase.local mengarah ke IP cluster
        # Browser membuka http://nocobase.local untuk mengakses aplikasi NocoBase di cluster
        - match: Host(`nocobase.local`)
          kind: Rule
          services:
            # Service ini adalah Service yang dibuat saat deployment aplikasi nocobase di section "Deployment Aplikasi" sebelumnya
            - name: nocobase
              port: 13000
    ```

2. Jalankan command `kubectl` untuk men-deploy Ingress aplikasi NocoBase.

    ```bash
    kubectl apply -f nocobase-ingress.yaml
    ```

### Ingress-Nginx

Sebagian besar cluster K8S menginstal komponen Ingress Controller adalah Ingress-Nginx, berikut adalah file `nocobase-ingress.yaml` berbasis Ingress-Nginx:

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
  name: nocobase-ingress
spec:
  rules:
    # 'nocobase.local' di sini harus diganti dengan domain real yang mengarah ke IP cluster
    # Jika tidak ada domain untuk verifikasi, modifikasi file host lokal, tambahkan record nocobase.local mengarah ke IP cluster
    # Browser membuka http://nocobase.local untuk mengakses aplikasi Nocobase di cluster
    - host: nocobase.local
      http:
        paths:
          - backend:
              serviceName: nocobase
              servicePort: 13000
```

## Menggunakan Helm Charts

Kami telah menulis Helm Charts aplikasi NocoBase, Anda dapat menggunakan Helm CLI untuk men-deploy service aplikasi NocoBase di K8S.

### Persiapan

Pastikan client seperti `kubectl`, `helm` sudah terinstal di environment operasi, dan konfirmasi `kubectl` dapat terhubung dengan benar ke cluster target.

### Tambah Repository

Tambahkan repository Helm Charts NocoBase:

```bash
# Tambah repository Helm Charts NocoBase
helm repo add nocobase https://nocobase.github.io/helm-charts

# Update Helm index
helm repo update
```

### Deployment Helm

1.  Buat file `values.yaml`.

    ```yaml
    persistent:
      # Ukuran shared storage yang dibutuhkan cluster NocoBase
      size: 10Gi
      # Service class storage yang disediakan cloud service K8S
      # Di sini sama seperti section "Deployment Aplikasi" menggunakan service NFS master node sehingga ditentukan secara eksplisit kosong
      storageClassName: ""

    configMap:
      data:
        TZ: Asia/Shanghai
        # Konfigurasi database dan Redis berikut menggunakan service PostgreSQL dan Redis dari dokumen "Deployment Middleware K8S" di cluster
        # Jika environment target sudah memiliki database dan service Redis lainnya, ubah konfigurasi terkait database dan Redis berikut sesuai
        CACHE_DEFAULT_STORE: redis
        # Gunakan service Redis yang sudah ada di environment atau yang Anda deploy sendiri
        CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
        PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
        LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
        # Gunakan service PostgreSQL yang sudah ada di environment atau yang Anda deploy sendiri
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

        # ... environment variable lainnya
    ```

2.  Jalankan command `helm install` untuk memulai instalasi.

    ```bash
    helm install nocobase nocobase/nocobase --values values.yaml
    ```
