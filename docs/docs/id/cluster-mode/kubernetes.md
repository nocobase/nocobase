
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Deployment Kubernetes

Artikel ini bertujuan untuk memandu pengguna dalam melakukan deployment NocoBase mode klaster dengan cepat di lingkungan Kubernetes (K8S). Diasumsikan pembaca sudah familiar dengan lingkungan K8S dan telah menyelesaikan langkah-langkah di [Persiapan](./preparations.md).

:::info{title="Tips"}
Untuk memverifikasi proses deployment K8S dengan cepat, lingkungan operasi dalam artikel ini adalah klaster K3S node tunggal (OS: Ubuntu). Panduan ini juga berlaku untuk klaster K8S standar. Jika Anda menemukan perbedaan saat melakukan deployment di klaster K8S standar, mohon informasikan kepada kami.
:::

## Lingkungan Klaster

Jika Anda sudah memiliki lingkungan klaster K8S, Anda bisa melewati langkah ini.

Siapkan sebuah server dengan Debian / Ubuntu terinstal dan jalankan klaster K3S dalam mode node tunggal di atasnya. Untuk mempelajari lebih lanjut tentang K3S, kunjungi [situs web resmi K3S](https://docs.k3s.io/zh/).

Langkah-langkahnya adalah sebagai berikut:

1. Lakukan SSH ke server.
2. Gunakan skrip resmi untuk menginstal node master klaster K3S di server.

```bash
# Setelah instalasi, file kubeconfig default adalah /etc/rancher/k3s/k3s.yaml
curl -sfL https://get.k3s.io | sh -
```

```bash
# Verifikasi apakah konfigurasi sudah benar
kubectl get node
```

## Deployment Aplikasi Klaster

Lakukan deployment aplikasi NocoBase dalam mode klaster di klaster K8S.

### Variabel Lingkungan

Biasanya, variabel lingkungan harus dipisahkan dari file konfigurasi deployment aplikasi. Artikel ini menggunakan ConfigMap sebagai contoh orkestrasi. Dalam lingkungan produksi, Anda dapat menggunakan Secrets untuk memisahkan informasi sensitif lebih lanjut.

Langkah-langkahnya adalah sebagai berikut:

1. Buat file `nocobase-cm.yaml`.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nocobase-config
data:
  TZ: Asia/Shanghai
  # Konfigurasi database dan Redis di bawah ini menggunakan layanan PostgreSQL dan Redis di klaster dari dokumen "Deployment Middleware K8S".
  # Jika lingkungan target sudah memiliki layanan database dan Redis yang ada, modifikasi konfigurasi database dan Redis yang sesuai di bawah ini.
  CACHE_DEFAULT_STORE: redis
  # Gunakan layanan Redis yang sudah ada atau yang Anda deploy sendiri.
  CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
  PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
  LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
  # Gunakan layanan PostgreSQL yang sudah ada atau yang Anda deploy sendiri.
  DB_DATABASE: nocobase
  DB_DIALECT: postgres
  DB_HOST: "postgres-0.postgres-service"
  DB_PASSWORD: nocobase123
  DB_PORT: "5432"
  DB_UNDERSCORED: "true"
  DB_USER: nocobase
  # username platform layanan
  NOCOBASE_PKG_USERNAME: "<your user>"
  # password platform layanan
  NOCOBASE_PKG_PASSWORD: "<your password>"

  # ... variabel lingkungan lainnya
```

2. Jalankan perintah `kubectl` untuk melakukan deployment ConfigMap.

```bash
kubectl apply -f nocobase-cm.yaml
```

### Penyimpanan Bersama

Node-node berbeda dari aplikasi NocoBase yang di-deploy dalam mode klaster perlu me-mount direktori penyimpanan (`storage`) yang sama. Untuk itu, Anda perlu membuat Persistent Volume (PV) yang mendukung akses baca-tulis dari banyak node (ReadWriteMany). Biasanya, Anda perlu membuat *cloud disk* di platform penyedia layanan *cloud* dan mengikatnya sebagai PV, atau Anda dapat me-mount direktori penyimpanan bersama menggunakan metode lain seperti NFS.

### Deployment Aplikasi

Untuk deployment awal, mulailah dengan satu node. Setelah selesai, Anda dapat melakukan *scale up* untuk menjalankan beberapa node.

1. Buat file `nocobase-apps.yaml`.

```yaml
# Buat PVC. Beberapa Pod yang di-deploy oleh Deployment di bawah ini akan me-mount direktori penyimpanan persisten yang sama melalui PVC ini.
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
  storageClassName: "" # Contoh ini menggunakan layanan NFS node master, sehingga secara eksplisit diatur kosong untuk menghindari penggunaan StorageClass default.
---
# Service aplikasi, yang menyediakan layanan di luar klaster setelah diikat ke Ingress.
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
# Deployment aplikasi, yang dapat men-deploy beberapa kontainer aplikasi.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nocobase
spec:
  replicas: 1 # Deployment awal hanya dengan satu node.
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
          # Muat variabel lingkungan dari ConfigMap yang telah di-deploy sebelumnya.
          envFrom:
            - configMapRef:
                name: nocobase-config
          volumeMounts:
            - name: nocobase-data
              mountPath: /app/nocobase/storage
          # Deklarasikan permintaan dan batasan sumber daya untuk layanan.
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          # Perintah *liveness probe*. Klaster menggunakan ini untuk menentukan apakah Pod perlu di-restart.
          livenessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 60
          # Perintah *readiness probe*. Klaster menggunakan ini untuk menentukan apakah akan mengarahkan lalu lintas Service ke Pod.
          readinessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 30
      # Mount penyimpanan persisten melalui PVC.
      volumes:
        - name: nocobase-data
          persistentVolumeClaim:
            claimName: nocobase-pvc
```

2. Jalankan perintah `kubectl` untuk melakukan deployment layanan aplikasi NocoBase.

```bash
kubectl apply -f nocobase-apps.yaml
```

3. Verifikasi status layanan aplikasi NocoBase.

```bash
# Periksa status Pod layanan NocoBase
kubectl get pods -l app=nocobase
```

Contoh output adalah sebagai berikut. `STATUS` `Running` menunjukkan bahwa layanan berhasil dimulai:

```text
NAME                        READY   STATUS    RESTARTS   AGE
nocobase-5558b774d7-w6swf   1/1     Running   0          7h6m
```

4. Pada startup pertama, Anda perlu mengaktifkan *plugin* berikut secara manual di antarmuka admin:

- @nocobase/plugin-sync-adapter-redis
- @nocobase/plugin-lock-adapter-redis

Setelah itu, Anda dapat melakukan *scale up*. Misalnya, untuk *scale up* ke 4 node:

```bash
kubectl scale deployment nocobase --replicas=4
```

## Perubahan Aplikasi

Perubahan aplikasi mengacu pada situasi berikut:

- Peningkatan versi aplikasi
- Instalasi *plugin* baru
- Aktivasi *plugin*

NocoBase belum mendukung sinkronisasi otomatis perubahan di seluruh beberapa instans dalam klaster untuk skenario di atas. Oleh karena itu, Anda perlu menanganinya secara manual dengan mengikuti langkah-langkah di bawah ini. Langkah-langkah ini hanya melibatkan perubahan pada layanan aplikasi. Sebelum melakukan perubahan apa pun, harap cadangkan database dan penyimpanan persisten Anda sendiri.

### Peningkatan Versi Aplikasi Bergulir (*Rolling Upgrade*)

1. Jalankan perintah `kubectl set image` untuk mengubah versi *image* kontainer Deployment.

    ```bash
    kubectl set image deployment/nocobase nocobase=nocobase/nocobase:1.7
    ```

2. Periksa status pembaruan bergulir (*rolling update*).

    ```bash
    # Periksa progres pembaruan bergulir Deployment secara keseluruhan
    kubectl rollout status deployment/nocobase

    # Periksa status setiap Pod
    kubectl get pods -l app=nocobase
    ```

Jika Anda menemukan masalah selama atau setelah peningkatan versi aplikasi dan perlu melakukan *rollback*, jalankan perintah berikut untuk mengembalikan versi *image* kontainer:

```bash
kubectl rollout undo deployment/nocobase
```

### Restart Aplikasi yang Lancar (*Graceful Restart*)

Setelah menginstal atau mengaktifkan *plugin* baru, Anda perlu menyegarkan konfigurasi atau status aplikasi. Anda dapat menggunakan perintah berikut untuk me-restart setiap Pod secara lancar.

1. Jalankan perintah `kubectl rollout restart`.

    ```bash
    kubectl rollout restart deployment/nocobase
    ```

2. Periksa status restart bergulir (*rolling restart*).

    ```bash
    # Periksa progres restart bergulir Deployment secara keseluruhan
    kubectl rollout status deployment/nocobase

    # Periksa status setiap Pod
    kubectl get pods -l app=nocobase
    ```

## Gateway Aplikasi

Agar aplikasi yang di-deploy di klaster K8S dapat diakses dari luar, Anda perlu mengikat Ingress ke Service aplikasi. Lingkungan klaster yang digunakan dalam artikel ini adalah K3S, dan komponen Ingress Controller yang terinstal secara default di K3S adalah Traefik.

### Traefik IngressRoute

Langkah-langkahnya adalah sebagai berikut:

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
        # Di sini, 'nocobase.local' harus diganti dengan nama domain nyata yang mengarah ke IP klaster.
        # Jika Anda tidak memiliki domain untuk verifikasi, Anda dapat memodifikasi file host lokal Anda untuk menambahkan catatan nocobase.local yang mengarah ke IP klaster.
        # Anda kemudian dapat mengakses aplikasi NocoBase di klaster dengan membuka http://nocobase.local di browser Anda.
        - match: Host(`nocobase.local`)
          kind: Rule
          services:
            # Ini adalah Service yang dibuat saat melakukan deployment aplikasi nocobase di bagian "Deployment Aplikasi" di atas.
            - name: nocobase
              port: 13000
    ```

2. Jalankan perintah `kubectl` untuk melakukan deployment Ingress untuk aplikasi NocoBase.

    ```bash
    kubectl apply -f nocobase-ingress.yaml
    ```

### Ingress-Nginx

Sebagian besar klaster K8S menggunakan Ingress-Nginx sebagai Ingress Controller. Di bawah ini adalah file `nocobase-ingress.yaml` berdasarkan Ingress-Nginx:

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
  name: nocobase-ingress
spec:
  rules:
    # Di sini, 'nocobase.local' harus diganti dengan nama domain nyata yang mengarah ke IP klaster.
    # Jika Anda tidak memiliki domain untuk verifikasi, Anda dapat memodifikasi file host lokal Anda untuk menambahkan catatan nocobase.local yang mengarah ke IP klaster.
    # Anda kemudian dapat mengakses aplikasi NocoBase di klaster dengan membuka http://nocobase.local di browser Anda.
    - host: nocobase.local
      http:
        paths:
          - backend:
              serviceName: nocobase
              servicePort: 13000
```

## Menggunakan Helm Charts

Kami telah membuat Helm Charts untuk aplikasi NocoBase, yang memungkinkan Anda untuk melakukan deployment layanan aplikasi NocoBase di K8S menggunakan Helm CLI.

### Persiapan

Pastikan klien seperti `kubectl` dan `helm` sudah terinstal di lingkungan operasi Anda dan bahwa `kubectl` dapat terhubung dengan benar ke klaster target.

### Menambahkan Repositori

Tambahkan repositori NocoBase Helm Charts:

```bash
# Tambahkan repositori Helm Charts NocoBase
helm repo add nocobase https://nocobase.github.io/helm-charts

# Perbarui indeks Helm
helm repo update
```

### Deployment Helm

1.  Buat file `values.yaml`.

    ```yaml
    persistent:
      # Ukuran yang diperlukan untuk penyimpanan bersama klaster NocoBase
      size: 10Gi
      # Kelas penyimpanan yang disediakan oleh layanan Kubernetes cloud
      # Sama seperti di bagian "Deployment Aplikasi", ini secara eksplisit diatur kosong karena menggunakan layanan NFS node master.
      storageClassName: ""

    configMap:
      data:
        TZ: Asia/Shanghai
        # Konfigurasi database dan Redis di bawah ini menggunakan layanan PostgreSQL dan Redis di klaster dari dokumen "Deployment Middleware K8S".
        # Jika lingkungan target sudah memiliki layanan database dan Redis yang ada, modifikasi konfigurasi database dan Redis yang sesuai di bawah ini.
        CACHE_DEFAULT_STORE: redis
        # Gunakan layanan Redis yang sudah ada atau yang Anda deploy sendiri.
        CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
        PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
        LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
        # Gunakan layanan PostgreSQL yang sudah ada atau yang Anda deploy sendiri.
        DB_DATABASE: nocobase
        DB_DIALECT: postgres
        DB_HOST: "postgres-0.postgres-service"
        DB_PASSWORD: nocobase123
        DB_PORT: "5432"
        DB_UNDERSCORED: "true"
        DB_USER: nocobase
        # username platform layanan
        NOCOBASE_PKG_USERNAME: "<your user>"
        # password platform layanan
        NOCOBASE_PKG_PASSWORD: "<your password>"

        # ... variabel lingkungan lainnya
    ```

2.  Jalankan perintah `helm install` untuk memulai instalasi.

    ```bash
    helm install nocobase nocobase/nocobase --values values.yaml
    ```