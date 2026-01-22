
:::tip
เอกสารนี้แปลโดย AI หากมีข้อมูลที่ไม่ถูกต้อง โปรดดู[เวอร์ชันภาษาอังกฤษ](/en)
:::


# การติดตั้ง NocoBase บน Kubernetes

บทความนี้มีวัตถุประสงค์เพื่อแนะนำผู้ใช้งานในการติดตั้ง NocoBase ในโหมดคลัสเตอร์บนสภาพแวดล้อม K8S ได้อย่างรวดเร็ว โดยสมมติว่าผู้อ่านมีความคุ้นเคยกับสภาพแวดล้อม K8S อยู่แล้ว และได้ดำเนินการตามขั้นตอนใน [การเตรียมความพร้อม](./preparations.md) เรียบร้อยแล้วครับ/ค่ะ

:::info{title="เคล็ดลับ"}
เพื่อการทดสอบขั้นตอนการติดตั้งบน K8S อย่างรวดเร็ว สภาพแวดล้อมการทำงานในบทความนี้คือคลัสเตอร์ K3S แบบโหนดเดี่ยว (ระบบปฏิบัติการ Ubuntu) ครับ/ค่ะ คู่มือนี้สามารถใช้ได้กับคลัสเตอร์ K8S มาตรฐานเช่นกันนะครับ/คะ หากพบความแตกต่างจากการติดตั้งบนคลัสเตอร์ K8S มาตรฐาน โปรดแจ้งให้เราทราบด้วยนะครับ/คะ
:::

## สภาพแวดล้อมคลัสเตอร์

หากคุณมีสภาพแวดล้อมคลัสเตอร์ K8S อยู่แล้ว สามารถข้ามขั้นตอนนี้ไปได้เลยครับ/ค่ะ

เตรียมเซิร์ฟเวอร์ที่ติดตั้ง Debian / Ubuntu และรันคลัสเตอร์ K3S ในโหมดโหนดเดี่ยวบนเซิร์ฟเวอร์นั้นครับ/ค่ะ สำหรับข้อมูลเพิ่มเติมเกี่ยวกับ K3S สามารถเยี่ยมชม [เว็บไซต์ K3S อย่างเป็นทางการ](https://docs.k3s.io/) ได้เลยครับ/ค่ะ

ขั้นตอนมีดังนี้ครับ/ค่ะ:

1.  เข้าสู่ระบบเซิร์ฟเวอร์ด้วย SSH ครับ/ค่ะ
2.  ติดตั้งมาสเตอร์โหนดของคลัสเตอร์ K3S บนเซิร์ฟเวอร์โดยใช้สคริปต์อย่างเป็นทางการครับ/ค่ะ

```bash
# หลังจากติดตั้ง ไฟล์ kubeconfig เริ่มต้นจะอยู่ที่ /etc/rancher/k3s/k3s.yaml
curl -sfL https://get.k3s.io | sh -
```

```bash
# ตรวจสอบว่าการตั้งค่าถูกต้องหรือไม่
kubectl get node
```

## การติดตั้งแอปพลิเคชันบนคลัสเตอร์

ติดตั้งแอปพลิเคชัน NocoBase ในโหมดคลัสเตอร์บนคลัสเตอร์ K8S ครับ/ค่ะ

### ตัวแปรสภาพแวดล้อม

โดยปกติแล้ว ควรแยกตัวแปรสภาพแวดล้อมออกจากไฟล์การตั้งค่าการติดตั้งแอปพลิเคชันครับ/ค่ะ ในบทความนี้ เราจะใช้ ConfigMap เป็นตัวอย่างในการจัดการ แต่สำหรับการใช้งานจริงใน Production คุณสามารถใช้ Secrets เพื่อแยกข้อมูลที่ละเอียดอ่อนออกไปได้อีกครับ/ค่ะ

ขั้นตอนมีดังนี้ครับ/ค่ะ:

1.  สร้างไฟล์ `nocobase-cm.yaml` ครับ/ค่ะ

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nocobase-config
data:
  TZ: Asia/Shanghai
  # การตั้งค่าฐานข้อมูลและ Redis ด้านล่างนี้จะใช้บริการ PostgreSQL และ Redis ที่อยู่ในคลัสเตอร์ตามเอกสาร "การติดตั้ง Middleware บน K8S" ครับ/ค่ะ
  # หากสภาพแวดล้อมปลายทางของคุณมีบริการฐานข้อมูลและ Redis อื่น ๆ ที่มีอยู่แล้ว สามารถแก้ไขการตั้งค่าที่เกี่ยวข้องด้านล่างนี้ได้เลยครับ/ค่ะ
  CACHE_DEFAULT_STORE: redis
  # ใช้บริการ Redis ที่มีอยู่แล้วในสภาพแวดล้อม หรือที่คุณติดตั้งเองครับ/ค่ะ
  CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
  PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
  LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
  # ใช้บริการ PostgreSQL ที่มีอยู่แล้วในสภาพแวดล้อม หรือที่คุณติดตั้งเองครับ/ค่ะ
  DB_DATABASE: nocobase
  DB_DIALECT: postgres
  DB_HOST: "postgres-0.postgres-service"
  DB_PASSWORD: nocobase123
  DB_PORT: "5432"
  DB_UNDERSCORED: "true"
  DB_USER: nocobase
  # ชื่อผู้ใช้แพลตฟอร์มบริการ
  NOCOBASE_PKG_USERNAME: "<your user>"
  # รหัสผ่านแพลตฟอร์มบริการ
  NOCOBASE_PKG_PASSWORD: "<your password>"

  # ... ตัวแปรสภาพแวดล้อมอื่น ๆ
```

2.  รันคำสั่ง `kubectl` เพื่อติดตั้ง ConfigMap ครับ/ค่ะ

```bash
kubectl apply -f nocobase-cm.yaml
```

### พื้นที่จัดเก็บข้อมูลแบบแชร์

โหนดต่าง ๆ ของแอปพลิเคชัน NocoBase ที่ติดตั้งในโหมดคลัสเตอร์จำเป็นต้องเมานต์ไดเรกทอรีจัดเก็บข้อมูล (`storage`) เดียวกันครับ/ค่ะ ดังนั้นจึงต้องสร้าง Persistent Volume (PV) ที่รองรับการอ่านและเขียนจากหลายโหนดครับ/ค่ะ โดยทั่วไปแล้ว คุณจะต้องสร้าง Cloud Disk บนแพลตฟอร์มของผู้ให้บริการคลาวด์และผูกเป็น PV ครับ/ค่ะ หรือจะเมานต์ไดเรกทอรีจัดเก็บข้อมูลแบบแชร์ด้วยวิธีอื่น ๆ เช่น NFS ก็ได้ครับ/ค่ะ

### การติดตั้งแอปพลิเคชัน

สำหรับการติดตั้งแอปพลิเคชันครั้งแรก ให้เริ่มต้นจากโหนดเดียว เมื่อเสร็จสิ้นแล้วจึงค่อย Scale เพิ่มจำนวนโหนดขึ้นครับ/ค่ะ

1.  สร้างไฟล์ `nocobase-apps.yaml` ครับ/ค่ะ

```yaml
# สร้าง PVC (Persistent Volume Claim) ซึ่ง Pod หลายตัวที่ Deployment นี้ติดตั้งจะเมานต์ไดเรกทอรีจัดเก็บข้อมูลแบบถาวรเดียวกันผ่าน PVC นี้ครับ/ค่ะ
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
  storageClassName: "" # ตัวอย่างนี้ใช้บริการ NFS ของมาสเตอร์โหนด จึงระบุเป็นค่าว่างอย่างชัดเจนเพื่อหลีกเลี่ยงการใช้ StorageClass เริ่มต้นครับ/ค่ะ
---
# Service ของแอปพลิเคชัน ซึ่งจะให้บริการภายนอกคลัสเตอร์หลังจากผูกกับ Ingress ครับ/ค่ะ
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
# Deployment ของแอปพลิเคชัน ซึ่งสามารถติดตั้งคอนเทนเนอร์แอปพลิเคชันได้หลายตัวครับ/ค่ะ
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nocobase
spec:
  replicas: 1 # สำหรับการติดตั้งครั้งแรกใช้เพียงโหนดเดียวครับ/ค่ะ
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
          # โหลดตัวแปรสภาพแวดล้อมจาก ConfigMap ที่ติดตั้งไว้ก่อนหน้านี้ครับ/ค่ะ
          envFrom:
            - configMapRef:
                name: nocobase-config
          volumeMounts:
            - name: nocobase-data
              mountPath: /app/nocobase/storage
          # ประกาศความต้องการและข้อจำกัดของทรัพยากรสำหรับการรันบริการครับ/ค่ะ
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          # คำสั่งตรวจสอบความพร้อมใช้งาน (Liveness probe) คลัสเตอร์ใช้คำสั่งนี้เพื่อพิจารณาว่าจำเป็นต้องรีสตาร์ท Pod หรือไม่ครับ/ค่ะ
          livenessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 60
          # คำสั่งตรวจสอบความพร้อม (Readiness probe) คลัสเตอร์ใช้คำสั่งนี้เพื่อพิจารณาว่าจะนำทราฟฟิกของ Service ไปยัง Pod หรือไม่ครับ/ค่ะ
          readinessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 30
      # เมานต์พื้นที่จัดเก็บข้อมูลแบบถาวรผ่าน PVC ครับ/ค่ะ
      volumes:
        - name: nocobase-data
          persistentVolumeClaim:
            claimName: nocobase-pvc
```

2.  รันคำสั่ง `kubectl` เพื่อติดตั้งบริการแอปพลิเคชัน NocoBase ครับ/ค่ะ

```bash
kubectl apply -f nocobase-apps.yaml
```

3.  ตรวจสอบสถานะของบริการแอปพลิเคชัน NocoBase ครับ/ค่ะ

```bash
# ตรวจสอบสถานะ Pod ของบริการ NocoBase
kubectl get pods -l app=nocobase
```

ตัวอย่างผลลัพธ์มีดังนี้ครับ/ค่ะ เมื่อ `STATUS` เป็น `Running` แสดงว่าบริการเริ่มต้นทำงานสำเร็จ:

```text
NAME                        READY   STATUS    RESTARTS   AGE
nocobase-5558b774d7-w6swf   1/1     Running   0          7h6m
```

4.  ในการเริ่มต้นแอปพลิเคชันครั้งแรก คุณจะต้องเปิดใช้งาน **ปลั๊กอิน** ต่อไปนี้ด้วยตนเองในหน้าจอผู้ดูแลระบบครับ/ค่ะ:

-   @nocobase/plugin-sync-adapter-redis
-   @nocobase/plugin-lock-adapter-redis

หลังจากนั้นจึงค่อยทำการขยายขนาด (Scale Up) ครับ/ค่ะ ตัวอย่างเช่น การขยายเป็น 4 โหนด:

```bash
kubectl scale deployment nocobase --replicas=4
```

## การเปลี่ยนแปลงแอปพลิเคชัน

การเปลี่ยนแปลงแอปพลิเคชันหมายถึงสถานการณ์ต่อไปนี้ครับ/ค่ะ:

-   การอัปเกรดเวอร์ชันแอปพลิเคชัน
-   การติดตั้ง **ปลั๊กอิน** ใหม่
-   การเปิดใช้งาน **ปลั๊กอิน**

NocoBase ยังไม่รองรับการซิงโครไนซ์การเปลี่ยนแปลงโดยอัตโนมัติสำหรับหลายอินสแตนซ์ในคลัสเตอร์สำหรับสถานการณ์ข้างต้นครับ/ค่ะ ดังนั้น คุณจึงต้องดำเนินการด้วยตนเองตามขั้นตอนต่อไปนี้ครับ/ค่ะ ขั้นตอนด้านล่างนี้เกี่ยวข้องกับการเปลี่ยนแปลงบริการแอปพลิเคชันเท่านั้น ก่อนทำการเปลี่ยนแปลง โปรดสำรองข้อมูลฐานข้อมูลและพื้นที่จัดเก็บข้อมูลแบบถาวรด้วยตนเองนะครับ/คะ

### การอัปเกรดเวอร์ชันแอปพลิเคชันแบบ Rolling Upgrade

1.  รันคำสั่ง `kubectl set image` เพื่อแก้ไขเวอร์ชันอิมเมจคอนเทนเนอร์ของ Deployment ครับ/ค่ะ

    ```bash
    kubectl set image deployment/nocobase nocobase=nocobase/nocobase:1.7
    ```

2.  ตรวจสอบสถานะการอัปเดตแบบ Rolling Update ครับ/ค่ะ

    ```bash
    # ตรวจสอบความคืบหน้าการอัปเดตแบบ Rolling Update โดยรวมของ Deployment
    kubectl rollout status deployment/nocobase

    # ตรวจสอบสถานะของแต่ละ Pod
    kubectl get pods -l app=nocobase
    ```

หากพบความผิดปกติระหว่างหรือหลังจากการอัปเกรดเวอร์ชันแอปพลิเคชัน และต้องการย้อนกลับเวอร์ชัน ให้รันคำสั่งด้านล่างนี้เพื่อย้อนกลับเวอร์ชันอิมเมจคอนเทนเนอร์ครับ/ค่ะ:

```bash
kubectl rollout undo deployment/nocobase
```

### การรีสตาร์ทแอปพลิเคชันอย่างนุ่มนวล

หลังจากติดตั้งหรือเปิดใช้งาน **ปลั๊กอิน** ใหม่ คุณจะต้องรีเฟรชการตั้งค่าหรือสถานะของแอปพลิเคชันครับ/ค่ะ คุณสามารถใช้คำสั่งด้านล่างนี้เพื่อรีสตาร์ท Pod แต่ละตัวอย่างนุ่มนวลได้เลยครับ/ค่ะ

1.  รันคำสั่ง `kubectl rollout restart` ครับ/ค่ะ

    ```bash
    kubectl rollout restart deployment/nocobase
    ```

2.  ตรวจสอบสถานะการรีสตาร์ทแบบ Rolling Restart ครับ/ค่ะ

    ```bash
    # ตรวจสอบความคืบหน้าการรีสตาร์ทโดยรวมของ Deployment
    kubectl rollout status deployment/nocobase

    # ตรวจสอบสถานะของแต่ละ Pod
    kubectl get pods -l app=nocobase
    ```

## เกตเวย์แอปพลิเคชัน

เมื่อแอปพลิเคชันที่ติดตั้งในคลัสเตอร์ K8S ต้องการให้เข้าถึงได้จากภายนอก คุณจะต้องผูก Ingress เข้ากับ Service ของแอปพลิเคชันครับ/ค่ะ สภาพแวดล้อมคลัสเตอร์ที่ใช้ในบทความนี้คือ K3S ซึ่งคอมโพเนนต์ Ingress Controller ที่ K3S ติดตั้งมาโดยค่าเริ่มต้นคือ Traefik ครับ/ค่ะ

### Traefik IngressRoute

ขั้นตอนมีดังนี้ครับ/ค่ะ:

1.  สร้างไฟล์ `nocobase-ingress.yaml` ครับ/ค่ะ

    ```yaml
    apiVersion: traefik.containo.us/v1alpha1
    kind: IngressRoute
    metadata:
      name: nocobase-ingress
    spec:
      entryPoints:
        - web
      routes:
        # ตรงนี้ 'nocobase.local' ควรถูกแทนที่ด้วยชื่อโดเมนจริงที่ชี้ไปยัง IP ของคลัสเตอร์ครับ/ค่ะ
        # หากไม่มีโดเมนสำหรับตรวจสอบ คุณสามารถแก้ไขไฟล์ hosts ในเครื่องของคุณเพื่อเพิ่มระเบียนที่ชี้ 'nocobase.local' ไปยัง IP ของคลัสเตอร์ได้ครับ/ค่ะ
        # จากนั้นเปิด http://nocobase.local ในเบราว์เซอร์ของคุณเพื่อเข้าถึงแอปพลิเคชัน NocoBase ในคลัสเตอร์ได้เลยครับ/ค่ะ
        - match: Host(`nocobase.local`)
          kind: Rule
          services:
            # Service นี้คือ Service ที่สร้างขึ้นเมื่อติดตั้งแอปพลิเคชัน NocoBase ในส่วน "การติดตั้งแอปพลิเคชัน" ก่อนหน้านี้ครับ/ค่ะ
            - name: nocobase
              port: 13000
    ```

2.  รันคำสั่ง `kubectl` เพื่อติดตั้ง Ingress สำหรับแอปพลิเคชัน NocoBase ครับ/ค่ะ

    ```bash
    kubectl apply -f nocobase-ingress.yaml
    ```

### Ingress-Nginx

คลัสเตอร์ K8S ส่วนใหญ่จะติดตั้งคอมโพเนนต์ Ingress Controller ที่เป็น Ingress-Nginx ครับ/ค่ะ ด้านล่างนี้คือไฟล์ `nocobase-ingress.yaml` ที่อิงตาม Ingress-Nginx ครับ/ค่ะ:

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
  name: nocobase-ingress
spec:
  rules:
    # ตรงนี้ 'nocobase.local' ควรถูกแทนที่ด้วยชื่อโดเมนจริงที่ชี้ไปยัง IP ของคลัสเตอร์ครับ/ค่ะ
    # หากไม่มีโดเมนสำหรับตรวจสอบ คุณสามารถแก้ไขไฟล์ hosts ในเครื่องของคุณเพื่อเพิ่มระเบียนที่ชี้ 'nocobase.local' ไปยัง IP ของคลัสเตอร์ได้ครับ/ค่ะ
    # จากนั้นเปิด http://nocobase.local ในเบราว์เซอร์ของคุณเพื่อเข้าถึงแอปพลิเคชัน NocoBase ในคลัสเตอร์ได้เลยครับ/ค่ะ
    - host: nocobase.local
      http:
        paths:
          - backend:
              serviceName: nocobase
              servicePort: 13000
```

## การใช้งาน Helm Charts

เราได้จัดทำ Helm Charts สำหรับแอปพลิเคชัน NocoBase ไว้ให้แล้วครับ/ค่ะ คุณสามารถใช้ Helm CLI เพื่อติดตั้งบริการแอปพลิเคชัน NocoBase ใน K8S ได้เลยครับ/ค่ะ

### การเตรียมความพร้อม

โปรดตรวจสอบให้แน่ใจว่าได้ติดตั้งไคลเอนต์ต่าง ๆ เช่น `kubectl`, `helm` ในสภาพแวดล้อมการทำงานของคุณแล้ว และ `kubectl` สามารถเชื่อมต่อกับคลัสเตอร์เป้าหมายได้อย่างถูกต้องครับ/ค่ะ

### การเพิ่ม Repository

เพิ่ม Repository ของ NocoBase Helm Charts ครับ/ค่ะ:

```bash
# เพิ่ม Repository ของ NocoBase Helm Charts
helm repo add nocobase https://nocobase.github.io/helm-charts

# อัปเดต Helm Index
helm repo update
```

### การติดตั้งด้วย Helm

1.  สร้างไฟล์ `values.yaml` ครับ/ค่ะ

    ```yaml
    persistent:
      # ขนาดที่จำเป็นสำหรับพื้นที่จัดเก็บข้อมูลแบบแชร์ของคลัสเตอร์ NocoBase
      size: 10Gi
      # Storage Class ที่ให้บริการโดย K8S ของผู้ให้บริการคลาวด์
      # ตรงนี้ระบุเป็นค่าว่างอย่างชัดเจนเช่นเดียวกับในส่วน "การติดตั้งแอปพลิเคชัน" เนื่องจากใช้บริการ NFS ของมาสเตอร์โหนดครับ/ค่ะ
      storageClassName: ""

    configMap:
      data:
        TZ: Asia/Shanghai
        # การตั้งค่าฐานข้อมูลและ Redis ด้านล่างนี้จะใช้บริการ PostgreSQL และ Redis ที่อยู่ในคลัสเตอร์ตามเอกสาร "การติดตั้ง Middleware บน K8S" ครับ/ค่ะ
        # หากสภาพแวดล้อมปลายทางของคุณมีบริการฐานข้อมูลและ Redis อื่น ๆ ที่มีอยู่แล้ว สามารถแก้ไขการตั้งค่าที่เกี่ยวข้องด้านล่างนี้ได้เลยครับ/ค่ะ
        CACHE_DEFAULT_STORE: redis
        # ใช้บริการ Redis ที่มีอยู่แล้วในสภาพแวดล้อม หรือที่คุณติดตั้งเองครับ/ค่ะ
        CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
        PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
        LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
        # ใช้บริการ PostgreSQL ที่มีอยู่แล้วในสภาพแวดล้อม หรือที่คุณติดตั้งเองครับ/ค่ะ
        DB_DATABASE: nocobase
        DB_DIALECT: postgres
        DB_HOST: "postgres-0.postgres-service"
        DB_PASSWORD: nocobase123
        DB_PORT: "5432"
        DB_UNDERSCORED: "true"
        DB_USER: nocobase
        # ชื่อผู้ใช้แพลตฟอร์มบริการ
        NOCOBASE_PKG_USERNAME: "<your user>"
        # รหัสผ่านแพลตฟอร์มบริการ
        NOCOBASE_PKG_PASSWORD: "<your password>"

        # ... ตัวแปรสภาพแวดล้อมอื่น ๆ
    ```

2.  รันคำสั่ง `helm install` เพื่อเริ่มการติดตั้งครับ/ค่ะ

    ```bash
    helm install nocobase nocobase/nocobase --values values.yaml
    ```