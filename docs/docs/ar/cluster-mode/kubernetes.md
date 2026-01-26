# نشر NocoBase على Kubernetes

يهدف هذا المقال إلى إرشاد المستخدمين حول كيفية نشر NocoBase بسرعة في وضع التجمع (cluster mode) ضمن بيئة Kubernetes. نفترض أن القارئ على دراية ببيئة Kubernetes وقد أكمل الخطوات المذكورة في [التحضيرات](./preparations.md).

:::info{title="نصيحة"}
للتأكد بسرعة من عملية نشر NocoBase على Kubernetes، فإن بيئة التشغيل المستخدمة في هذا المقال هي تجمع K3s أحادي العقدة (نظام التشغيل: Ubuntu). هذا الدليل ينطبق أيضًا على تجمعات Kubernetes القياسية. إذا واجهت أي اختلافات عند النشر على تجمع Kubernetes قياسي، يرجى إبلاغنا.
:::

## بيئة التجمع

إذا كانت لديك بيئة تجمع Kubernetes جاهزة بالفعل، يمكنك تخطي هذه الخطوة.

جهّز خادمًا مثبتًا عليه Debian / Ubuntu، وقم بتشغيل تجمع K3s عليه في وضع العقدة الواحدة. لمعرفة المزيد عن K3s، يمكنك زيارة [الموقع الرسمي لـ K3s](https://docs.k3s.io/zh/).

الخطوات:

1.  سجل الدخول إلى الخادم عبر SSH.
2.  استخدم السكربت الرسمي لتثبيت العقدة الرئيسية لتجمع K3s على الخادم.

```bash
# بعد التثبيت، يكون ملف kubeconfig الافتراضي هو /etc/rancher/k3s/k3s.yaml
curl -sfL https://get.k3s.io | sh -
```

```bash
# تحقق من صحة التكوين
kubectl get node
```

## نشر تطبيق التجمع

انشر تطبيق NocoBase في وضع التجمع على تجمع Kubernetes.

### متغيرات البيئة

عادةً، يجب فصل متغيرات البيئة عن ملف تكوين نشر التطبيق. يستخدم هذا المقال ConfigMap كمثال للتنظيم، وفي بيئة الإنتاج الفعلية، يمكنك استخدام Secrets لفصل المعلومات الحساسة بشكل أكبر.

الخطوات:

1.  أنشئ ملف `nocobase-cm.yaml`.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nocobase-config
data:
  TZ: Asia/Shanghai # استخدم المنطقة الزمنية الخاصة بك، على سبيل المثال، UTC، Africa/Cairo
  # تستخدم إعدادات قاعدة البيانات و Redis أدناه خدمات PostgreSQL و Redis في التجمع من وثيقة "نشر وسيط Kubernetes".
  # إذا كانت بيئتك تحتوي بالفعل على خدمات قاعدة بيانات و Redis موجودة، فعدّل التكوينات المقابلة أدناه.
  CACHE_DEFAULT_STORE: redis
  # استخدم خدمة Redis موجودة أو قمت بنشرها بنفسك.
  CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
  PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
  LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
  # استخدم خدمة PostgreSQL موجودة أو قمت بنشرها بنفسك.
  DB_DATABASE: nocobase
  DB_DIALECT: postgres
  DB_HOST: "postgres-0.postgres-service"
  DB_PASSWORD: nocobase123
  DB_PORT: "5432"
  DB_UNDERSCORED: "true"
  DB_USER: nocobase
  # اسم مستخدم منصة الخدمة
  NOCOBASE_PKG_USERNAME: "<your user>"
  # كلمة مرور منصة الخدمة
  NOCOBASE_PKG_PASSWORD: "<your password>"

  # ... متغيرات بيئة أخرى
```

2.  نفّذ أمر `kubectl` لنشر ConfigMap.

```bash
kubectl apply -f nocobase-cm.yaml
```

### التخزين المشترك

تحتاج العقد المختلفة لتطبيق NocoBase المنشور في وضع التجمع إلى تحميل نفس دليل التخزين (`storage`). لتحقيق ذلك، يجب إنشاء وحدة تخزين دائمة (Persistent Volume) تدعم الوصول للقراءة والكتابة من عدة عقد (ReadWriteMany). عادةً، ستحتاج إلى إنشاء قرص سحابي على منصة مزود الخدمة السحابية وربطه كوحدة تخزين دائمة (PV)، أو يمكنك تحميل دليل تخزين مشترك باستخدام طرق أخرى مثل NFS.

### نشر التطبيق

عند النشر الأولي، ابدأ بعقدة واحدة. بعد اكتمالها، يمكنك التوسع لتشغيل عدة عقد.

1.  أنشئ ملف `nocobase-apps.yaml`.

```yaml
# أنشئ PVC (PersistentVolumeClaim). ستقوم Pods المتعددة التي ينشرها Deployment أدناه بتحميل نفس دليل التخزين الدائم عبر هذا الـ PVC.
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
  storageClassName: "" # تم تعيينه صراحةً كفارغ لأن المثال يستخدم خدمة NFS للعقدة الرئيسية، لتجنب استخدام StorageClass الافتراضي.
---
# خدمة التطبيق (Service)، التي توفر الخدمات خارج التجمع بعد ربطها بـ Ingress.
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
:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::


# نشر التطبيق (Deployment)، والذي يمكنه نشر عدة حاويات تطبيق.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nocobase
spec:
  replicas: 1 # النشر الأولي بعقدة واحدة فقط.
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
          # تحميل متغيرات البيئة من ConfigMap الذي تم نشره سابقًا.
          envFrom:
            - configMapRef:
                name: nocobase-config
          volumeMounts:
            - name: nocobase-data
              mountPath: /app/nocobase/storage
          # الإعلان عن طلبات وقيود موارد تشغيل الخدمة.
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          # أمر فحص الحيوية (liveness probe). يستخدم التجمع هذا لتحديد ما إذا كان يجب إعادة تشغيل Pod.
          livenessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 60
          # أمر فحص الجاهزية (readiness probe). يستخدم التجمع هذا لتحديد ما إذا كان يجب توجيه حركة مرور الخدمة إلى Pod.
          readinessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 30
      # تحميل التخزين الدائم عبر PVC.
      volumes:
        - name: nocobase-data
          persistentVolumeClaim:
            claimName: nocobase-pvc
```

2.  نفّذ أمر `kubectl` لنشر خدمة تطبيق NocoBase.

```bash
kubectl apply -f nocobase-apps.yaml
```

3.  تحقق من حالة خدمة تطبيق NocoBase.

```bash
# تحقق من حالة Pod لخدمة NocoBase
kubectl get pods -l app=nocobase
```

يظهر الإخراج النموذجي أدناه. تشير حالة `STATUS` التي تكون `Running` إلى أن الخدمة قد بدأت بنجاح:

```text
NAME                        READY   STATUS    RESTARTS   AGE
nocobase-5558b774d7-w6swf   1/1     Running   0          7h6m
```

4.  عند التشغيل الأول للتطبيق، ستحتاج إلى تمكين الإضافات (plugins) التالية يدويًا في واجهة الإدارة:

-   @nocobase/plugin-sync-adapter-redis
-   @nocobase/plugin-lock-adapter-redis

بعد ذلك، يمكنك إجراء التوسع. على سبيل المثال، للتوسع إلى 4 عقد:

```bash
kubectl scale deployment nocobase --replicas=4
```

## تغييرات التطبيق

تشير تغييرات التطبيق إلى الحالات التالية:

-   ترقية إصدار التطبيق
-   تثبيت إضافات (plugins) جديدة
-   تفعيل إضافات (plugins)

لا يدعم NocoBase حاليًا المزامنة التلقائية للتغييرات عبر مثيلات متعددة في التجمع للحالات المذكورة أعلاه. لذلك، ستحتاج إلى التعامل معها يدويًا باتباع الخطوات أدناه. تتضمن هذه الخطوات تغييرات خدمة التطبيق فقط. قبل إجراء أي تغييرات، يرجى التأكد من عمل نسخة احتياطية لقاعدة البيانات والتخزين الدائم.

### الترقية المتجددة لإصدار التطبيق

1.  نفّذ أمر `kubectl set image` لتغيير إصدار صورة حاوية Deployment.

    ```bash
    kubectl set image deployment/nocobase nocobase=nocobase/nocobase:1.7
    ```

2.  تحقق من حالة التحديث المتجدد.

    ```bash
    # تحقق من تقدم التحديث المتجدد الكلي لـ Deployment
    kubectl rollout status deployment/nocobase

    # تحقق من حالة كل Pod
    kubectl get pods -l app=nocobase
    ```

إذا واجهت أي مشاكل أثناء ترقية إصدار التطبيق أو بعدها وكنت بحاجة إلى التراجع، نفّذ الأمر التالي للتراجع عن إصدار صورة الحاوية:

```bash
kubectl rollout undo deployment/nocobase
```

### إعادة تشغيل التطبيق بسلاسة

بعد تثبيت إضافات (plugins) جديدة أو تفعيلها، تحتاج إلى تحديث تكوين التطبيق أو حالته. يمكنك استخدام الأمر التالي لإعادة تشغيل كل Pod بسلاسة.

1.  نفّذ أمر `kubectl rollout restart`.

    ```bash
    kubectl rollout restart deployment/nocobase
    ```

2.  تحقق من حالة إعادة التشغيل المتجددة.

    ```bash
    # تحقق من تقدم إعادة التشغيل الكلي لـ Deployment
    kubectl rollout status deployment/nocobase

    # تحقق من حالة كل Pod
    kubectl get pods -l app=nocobase
    ```

## بوابة التطبيق

لجعل تطبيق منشور في تجمع Kubernetes متاحًا للوصول الخارجي، تحتاج إلى ربط Ingress بخدمة التطبيق (Service). بيئة التجمع المستخدمة في هذا المقال هي K3s، والتي تأتي مع Traefik كمكون Ingress Controller الافتراضي.

### Traefik IngressRoute

الخطوات:

1.  أنشئ ملف `nocobase-ingress.yaml`.

    ```yaml
    apiVersion: traefik.containo.us/v1alpha1
    kind: IngressRoute
    metadata:
      name: nocobase-ingress
    spec:
      entryPoints:
        - web
      routes:
        # هنا، يجب استبدال 'nocobase.local' باسم نطاق حقيقي يشير إلى عنوان IP الخاص بالتجمع.
        # إذا لم يكن لديك نطاق للتحقق، يمكنك تعديل ملف hosts المحلي لإضافة سجل لـ nocobase.local يشير إلى عنوان IP الخاص بالتجمع.
        # يمكنك بعد ذلك الوصول إلى تطبيق NocoBase في التجمع بفتح http://nocobase.local في متصفحك.
        - match: Host(`nocobase.local`)
          kind: Rule
          services:
            # هذه هي الخدمة (Service) التي تم إنشاؤها عند نشر تطبيق nocobase في قسم "نشر التطبيق" أعلاه.
            - name: nocobase
              port: 13000
    ```

2.  نفّذ أمر `kubectl` لنشر Ingress لتطبيق NocoBase.

```bash
kubectl apply -f nocobase-ingress.yaml
```

### Ingress-Nginx

معظم تجمعات Kubernetes المثبتة تستخدم مكون Ingress-Nginx كـ Ingress Controller. فيما يلي ملف `nocobase-ingress.yaml` يعتمد على Ingress-Nginx:

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
  name: nocobase-ingress
spec:
  rules:
    # هنا، يجب استبدال 'nocobase.local' باسم نطاق حقيقي يشير إلى عنوان IP الخاص بالتجمع.
    # إذا لم يكن لديك نطاق للتحقق، يمكنك تعديل ملف hosts المحلي لإضافة سجل لـ nocobase.local يشير إلى عنوان IP الخاص بالتجمع.
    # يمكنك بعد ذلك الوصول إلى تطبيق NocoBase في التجمع بفتح http://nocobase.local في متصفحك.
    - host: nocobase.local
      http:
        paths:
          - backend:
              serviceName: nocobase
              servicePort: 13000
```

## استخدام مخططات Helm (Helm Charts)

لقد قمنا بإعداد مخططات Helm (Helm Charts) لتطبيق NocoBase، مما يتيح لك نشر خدمة تطبيق NocoBase في Kubernetes باستخدام واجهة سطر الأوامر (CLI) الخاصة بـ Helm.

### المتطلبات الأساسية

تأكد من تثبيت عملاء مثل `kubectl` و `helm` في بيئة التشغيل الخاصة بك، وتأكد من أن `kubectl` يمكنه الاتصال بالتجمع المستهدف بشكل صحيح.

### إضافة المستودع

أضف مستودع مخططات Helm (Helm Charts) لـ NocoBase:

```bash
# أضف مستودع مخططات Helm لـ NocoBase
helm repo add nocobase https://nocobase.github.io/helm-charts

# حدّث فهرس Helm
helm repo update
```

### نشر Helm

1.  أنشئ ملف `values.yaml`.

    ```yaml
    persistent:
      # الحجم المطلوب للتخزين المشترك لتجمع NocoBase
      size: 10Gi
      # فئة التخزين التي يوفرها Kubernetes في الخدمة السحابية
      # هنا، تم تعيينه صراحةً كفارغ كما في قسم "نشر التطبيق" لأنه يستخدم خدمة NFS للعقدة الرئيسية.
      storageClassName: ""

    configMap:
      data:
        TZ: Asia/Shanghai # استخدم المنطقة الزمنية الخاصة بك، على سبيل المثال، UTC، Africa/Cairo
        # تستخدم إعدادات قاعدة البيانات و Redis أدناه خدمات PostgreSQL و Redis في التجمع من وثيقة "نشر وسيط Kubernetes".
        # إذا كانت بيئتك تحتوي بالفعل على خدمات قاعدة بيانات و Redis موجودة، فعدّل التكوينات المقابلة أدناه.
        CACHE_DEFAULT_STORE: redis
        # استخدم خدمة Redis موجودة أو قمت بنشرها بنفسك.
        CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
        PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
        LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
        # استخدم خدمة PostgreSQL موجودة أو قمت بنشرها بنفسك.
        DB_DATABASE: nocobase
        DB_DIALECT: postgres
        DB_HOST: "postgres-0.postgres-service"
        DB_PASSWORD: nocobase123
        DB_PORT: "5432"
        DB_UNDERSCORED: "true"
        DB_USER: nocobase
        # اسم مستخدم منصة الخدمة
        NOCOBASE_PKG_USERNAME: "<your user>"
        # كلمة مرور منصة الخدمة
        NOCOBASE_PKG_PASSWORD: "<your password>"

        # ... متغيرات بيئة أخرى
    ```

2.  نفّذ أمر `helm install` لبدء التثبيت.

    ```bash
    helm install nocobase nocobase/nocobase --values values.yaml
    ```