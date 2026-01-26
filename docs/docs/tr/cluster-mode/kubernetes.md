
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Kubernetes Dağıtımı

Bu makale, NocoBase'i Kubernetes (K8S) ortamında küme modunda hızlıca nasıl dağıtabileceğinizi size göstermeyi amaçlamaktadır. Okuyucunun K8S ortamına aşina olduğunu ve [Hazırlıklar](./preparations.md) bölümündeki adımları tamamladığını varsayıyoruz.

:::info{title="İpucu"}
Kubernetes dağıtım sürecini hızlıca doğrulamak amacıyla, bu makaledeki çalışma ortamı tek düğümlü bir K3s kümesidir (işletim sistemi: Ubuntu). Bu rehber, standart Kubernetes kümeleri için de geçerlidir. Eğer standart bir Kubernetes kümesinde dağıtım yaparken bu makaleden farklı durumlarla karşılaşırsanız, lütfen bize bildirin.
:::

## Küme Ortamı

Eğer zaten bir Kubernetes küme ortamınız varsa, bu adımı atlayabilirsiniz.

Debian / Ubuntu kurulu bir sunucu hazırlayın ve üzerinde tek düğümlü modda bir K3s kümesi çalıştırın. K3s hakkında daha fazla bilgi edinmek için [resmi K3s web sitesini](https://docs.k3s.io/) ziyaret edebilirsiniz.

Adımlar:

1. Sunucuya SSH ile bağlanın.
2. Sunucuda resmi betiği kullanarak K3s kümesi ana düğümünü kurun.

```bash
# Kurulumdan sonra varsayılan kubeconfig dosyası /etc/rancher/k3s/k3s.yaml konumundadır.
curl -sfL https://get.k3s.io | sh -
```

```bash
# Yapılandırmanın doğru olduğunu doğrulayın
kubectl get node
```

## Küme Uygulama Dağıtımı

NocoBase uygulamasını Kubernetes kümesinde küme modunda dağıtın.

### Ortam Değişkenleri

Ortam değişkenleri genellikle uygulama dağıtım yapılandırma dosyasından ayrılmalıdır. Bu makalede bir ConfigMap örneği kullanılmıştır. Gerçek bir üretim ortamında, hassas bilgileri daha da ayırmak için Secrets kullanabilirsiniz.

Adımlar:

1. `nocobase-cm.yaml` dosyasını oluşturun.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nocobase-config
data:
  # Saat diliminizi ayarlayın, örneğin: UTC, Europe/Istanbul
  TZ: UTC
  # Aşağıdaki veritabanı ve Redis yapılandırmaları, "Kubernetes Ara Katman Dağıtımı" belgesindeki küme içi PostgreSQL ve Redis hizmetlerini kullanır.
  # Eğer ortamınızda mevcut veritabanı ve Redis hizmetleri varsa, aşağıdaki ilgili yapılandırmaları değiştirebilirsiniz.
  CACHE_DEFAULT_STORE: redis
  # Ortamınızdaki mevcut veya kendi dağıttığınız Redis hizmetini kullanın.
  CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
  PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
  LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
  # Ortamınızdaki mevcut veya kendi dağıttığınız PostgreSQL hizmetini kullanın.
  DB_DATABASE: nocobase
  DB_DIALECT: postgres
  DB_HOST: "postgres-0.postgres-service"
  DB_PASSWORD: nocobase123
  DB_PORT: "5432"
  DB_UNDERSCORED: "true"
  DB_USER: nocobase
  # hizmet platformu kullanıcı adı
  NOCOBASE_PKG_USERNAME: "<your user>"
  # hizmet platformu parolası
  NOCOBASE_PKG_PASSWORD: "<your password>"

  # ... diğer ortam değişkenleri
```

2. ConfigMap'i dağıtmak için `kubectl` komutunu çalıştırın.

```bash
kubectl apply -f nocobase-cm.yaml
```

### Paylaşımlı Depolama

Küme modunda dağıtılan bir NocoBase uygulamasının farklı düğümleri, aynı depolama dizinini (`storage`) bağlamalıdır. Bunu sağlamak için, çoklu düğümden okuma-yazma erişimini (ReadWriteMany) destekleyen bir Kalıcı Birim (Persistent Volume - PV) oluşturmanız gerekir. Genellikle, bulut sağlayıcınızın platformunda bir bulut diski oluşturup bunu bir PV olarak bağlamanız veya NFS gibi başka yöntemlerle paylaşımlı bir depolama dizini bağlamanız gerekebilir.

### Uygulama Dağıtımı

İlk dağıtım için tek bir düğümle başlayın. Tamamlandıktan sonra, birden fazla düğüme ölçeklendirme yapabilirsiniz.

1. `nocobase-apps.yaml` dosyasını oluşturun.

```yaml
# Bir PVC oluşturun. Aşağıdaki Deployment tarafından dağıtılan birden fazla Pod, bu PVC aracılığıyla aynı kalıcı depolama dizinini bağlayacaktır.
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
  storageClassName: "" # Örnek, ana düğümün NFS hizmetini kullandığı için varsayılan StorageClass'ı kullanmaktan kaçınmak amacıyla açıkça boş olarak belirtilmiştir.
---
# Uygulamanın Service'i, bir Ingress'e bağlandıktan sonra küme dışına hizmet sağlar.
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
# Uygulamanın Deployment'ı, birden fazla uygulama kapsayıcısı dağıtabilir.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nocobase
spec:
  replicas: 1 # İlk dağıtım yalnızca tek bir düğümle yapılır.
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
          # Ortam değişkenlerini daha önce dağıtılan ConfigMap'ten yükleyin.
          envFrom:
            - configMapRef:
                name: nocobase-config
          volumeMounts:
            - name: nocobase-data
              mountPath: /app/nocobase/storage
          # Hizmetin çalışma zamanı kaynak taleplerini ve limitlerini bildirin.
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          # Canlılık kontrol komutu. Küme, Pod'un yeniden başlatılıp başlatılmayacağını bu komutla belirler.
          livenessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 60
          # Hazırlık kontrol komutu. Küme, Service trafiğinin Pod'a yönlendirilip yönlendirilmeyeceğini bu komutla belirler.
          readinessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 30
      # PVC aracılığıyla kalıcı depolamayı bağlayın.
      volumes:
        - name: nocobase-data
          persistentVolumeClaim:
            claimName: nocobase-pvc
```

2. NocoBase uygulama hizmetini dağıtmak için `kubectl` komutunu çalıştırın.

```bash
kubectl apply -f nocobase-apps.yaml
```

3. NocoBase uygulama hizmetinin durumunu doğrulayın.

```bash
# NocoBase hizmetinin Pod durumunu kontrol edin
kubectl get pods -l app=nocobase
```

Örnek çıktı aşağıdaki gibidir. `STATUS` değeri `Running` olduğunda hizmetin başarıyla başladığı anlamına gelir:

```text
NAME                        READY   STATUS    RESTARTS   AGE
nocobase-5558b774d7-w6swf   1/1     Running   0          7h6m
```

4. Uygulama ilk kez başlatıldığında, yönetici arayüzünde aşağıdaki eklentileri manuel olarak etkinleştirmeniz gerekir:

- @nocobase/plugin-sync-adapter-redis
- @nocobase/plugin-lock-adapter-redis

Bundan sonra ölçeklendirme yapabilirsiniz. Örneğin, 4 düğüme ölçeklendirmek için:

```bash
kubectl scale deployment nocobase --replicas=4
```

## Uygulama Değişiklikleri

Uygulama değişiklikleri aşağıdaki durumları ifade eder:

- Uygulama sürümünü yükseltme
- Yeni eklentiler kurma
- Eklentileri etkinleştirme

NocoBase, yukarıdaki senaryolarda kümedeki çoklu örnekler arasında değişikliklerin otomatik senkronizasyonunu henüz desteklememektedir. Bu nedenle, aşağıdaki adımları izleyerek bunları manuel olarak halletmeniz gerekir. Bu adımlar yalnızca uygulama hizmeti değişikliklerini kapsar. Herhangi bir değişiklik yapmadan önce lütfen veritabanı ve kalıcı depolama yedeklerinizi kendiniz alın.

### Uygulama Sürümü Rolling Yükseltmesi

1. Deployment'ın kapsayıcı imaj sürümünü değiştirmek için `kubectl set image` komutunu çalıştırın.

    ```bash
    kubectl set image deployment/nocobase nocobase=nocobase/nocobase:1.7
    ```

2. Rolling güncelleme durumunu kontrol edin.

    ```bash
    # Deployment'ın genel rolling güncelleme ilerlemesini kontrol edin
    kubectl rollout status deployment/nocobase

    # Her bir Pod'un durumunu kontrol edin
    kubectl get pods -l app=nocobase
    ```

Uygulama sürümü yükseltme işlemi sırasında veya sonrasında herhangi bir anormallik fark ederseniz ve sürümü geri almanız gerekirse, kapsayıcı imaj sürümünü geri almak için aşağıdaki komutu çalıştırın:

```bash
kubectl rollout undo deployment/nocobase
```

### Uygulamanın Sorunsuz Yeniden Başlatılması

Yeni eklentiler kurduktan veya eklentileri etkinleştirdikten sonra uygulama yapılandırmasını veya durumunu yenilemeniz gerekir. Her bir Pod'u sorunsuz bir şekilde yeniden başlatmak için aşağıdaki komutu kullanabilirsiniz.

1. `kubectl rollout restart` komutunu çalıştırın.

    ```bash
    kubectl rollout restart deployment/nocobase
    ```

2. Rolling yeniden başlatma durumunu kontrol edin.

    ```bash
    # Deployment'ın genel yeniden başlatma ilerlemesini kontrol edin
    kubectl rollout status deployment/nocobase

    # Her bir Pod'un durumunu kontrol edin
    kubectl get pods -l app=nocobase
    ```

## Uygulama Ağ Geçidi

Bir Kubernetes kümesinde dağıtılan bir uygulamanın dışarıdan erişilebilir olması için, uygulamanın Service'ine bir Ingress bağlamanız gerekir. Bu makalede kullanılan küme ortamı K3s'tir ve K3s varsayılan olarak Traefik Ingress Controller bileşeniyle birlikte gelir.

### Traefik IngressRoute

Adımlar:

1. `nocobase-ingress.yaml` dosyasını oluşturun.

    ```yaml
    apiVersion: traefik.containo.us/v1alpha1
    kind: IngressRoute
    metadata:
      name: nocobase-ingress
    spec:
      entryPoints:
        - web
      routes:
        # Burada 'nocobase.local' ifadesi, kümenin IP adresini işaret eden gerçek bir alan adıyla değiştirilmelidir.
        # Doğrulama için bir alan adınız yoksa, yerel hosts dosyanızı düzenleyerek nocobase.local için kümenin IP adresini işaret eden bir kayıt ekleyebilirsiniz.
        # Daha sonra tarayıcınızda http://nocobase.local adresini açarak kümedeki NocoBase uygulamasına erişebilirsiniz.
        - match: Host(`nocobase.local`)
          kind: Rule
          services:
            # Bu Service, yukarıdaki "Uygulama Dağıtımı" bölümünde nocobase uygulaması dağıtılırken oluşturulan Service'tir.
            - name: nocobase
              port: 13000
    ```

2. NocoBase uygulamasının Ingress'ini dağıtmak için `kubectl` komutunu çalıştırın.

    ```bash
    kubectl apply -f nocobase-ingress.yaml
    ```

### Ingress-Nginx

Çoğu Kubernetes kümesi, Ingress Controller bileşeni olarak Ingress-Nginx kullanır. Aşağıda, Ingress-Nginx tabanlı bir `nocobase-ingress.yaml` dosyası bulunmaktadır:

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
  name: nocobase-ingress
spec:
  rules:
    # Burada 'nocobase.local' ifadesi, kümenin IP adresini işaret eden gerçek bir alan adıyla değiştirilmelidir.
    # Doğrulama için bir alan adınız yoksa, yerel hosts dosyanızı düzenleyerek nocobase.local için kümenin IP adresini işaret eden bir kayıt ekleyebilirsiniz.
    # Daha sonra tarayıcınızda http://nocobase.local adresini açarak kümedeki NocoBase uygulamasına erişebilirsiniz.
    - host: nocobase.local
      http:
        paths:
          - backend:
              serviceName: nocobase
              servicePort: 13000
```

## Helm Chart'larını Kullanma

NocoBase uygulaması için Helm Chart'ları hazırladık. Bu sayede Helm CLI kullanarak NocoBase uygulama hizmetini Kubernetes'e dağıtabilirsiniz.

### Ön Koşullar

Çalışma ortamınızda `kubectl` ve `helm` gibi istemcilerin kurulu olduğundan ve `kubectl`'in hedef kümeye doğru şekilde bağlanabildiğinden emin olun.

### Depo Ekleme

NocoBase Helm Chart'ları deposunu ekleyin:

```bash
# NocoBase Helm Chart'ları deposunu ekleyin
helm repo add nocobase https://nocobase.github.io/helm-charts

# Helm indeksini güncelleyin
helm repo update
```

### Helm Dağıtımı

1. `values.yaml` dosyasını oluşturun.

    ```yaml
    persistent:
      # NocoBase kümesi paylaşımlı depolama için gereken boyut
      size: 10Gi
      # Bulut hizmetinin Kubernetes tarafından sağlanan depolama sınıfı
      # "Uygulama Dağıtımı" bölümünde olduğu gibi, ana düğümün NFS hizmetini kullandığı için bu, açıkça boş olarak ayarlanmıştır.
      storageClassName: ""

    configMap:
      data:
        # Saat diliminizi ayarlayın, örneğin: UTC, Europe/Istanbul
        TZ: UTC
        # Aşağıdaki veritabanı ve Redis yapılandırmaları, "Kubernetes Ara Katman Dağıtımı" belgesindeki küme içi PostgreSQL ve Redis hizmetlerini kullanır.
        # Eğer ortamınızda mevcut veritabanı ve Redis hizmetleri varsa, aşağıdaki ilgili yapılandırmaları değiştirebilirsiniz.
        CACHE_DEFAULT_STORE: redis
        # Ortamınızdaki mevcut veya kendi dağıttığınız Redis hizmetini kullanın.
        CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
        PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
        LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
        # Ortamınızdaki mevcut veya kendi dağıttığınız PostgreSQL hizmetini kullanın.
        DB_DATABASE: nocobase
        DB_DIALECT: postgres
        DB_HOST: "postgres-0.postgres-service"
        DB_PASSWORD: nocobase123
        DB_PORT: "5432"
        DB_UNDERSCORED: "true"
        DB_USER: nocobase
        # hizmet platformu kullanıcı adı
        NOCOBASE_PKG_USERNAME: "<your user>"
        # hizmet platformu parolası
        NOCOBASE_PKG_PASSWORD: "<your password>"

        # ... diğer ortam değişkenleri
    ```

2. Kurulumu başlatmak için `helm install` komutunu çalıştırın.

    ```bash
    helm install nocobase nocobase/nocobase --values values.yaml
    ```