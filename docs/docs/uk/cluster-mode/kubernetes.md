
:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Розгортання в Kubernetes

Ця стаття має на меті допомогти користувачам швидко розгорнути NocoBase у кластерному режимі в середовищі Kubernetes. Вона передбачає, що читач знайомий із середовищем Kubernetes і вже виконав кроки, описані в розділі [Підготовка](./preparations.md).

:::info{title="Підказка"}
Щоб швидко перевірити процес розгортання в Kubernetes, операційне середовище в цій статті — це однонодовий кластер K3s (ОС: Ubuntu). Цей посібник також застосовний до стандартних кластерів Kubernetes. Якщо під час розгортання в стандартному кластері Kubernetes ви зіткнетеся з відмінностями від описаного тут, будь ласка, повідомте нам.
:::

## Кластерне середовище

Якщо у вас вже є кластерне середовище Kubernetes, можете пропустити цей крок.

Підготуйте сервер з встановленими Debian / Ubuntu та запустіть на ньому кластер K3s в однонодовому режимі. Щоб дізнатися більше про K3s, відвідайте [офіційний сайт K3s](https://docs.k3s.io/zh/).

Кроки:

1.  Підключіться до сервера через SSH.
2.  Використайте офіційний скрипт для встановлення головної ноди кластера K3s на сервері.

```bash
# Після встановлення типовий файл kubeconfig знаходиться за шляхом /etc/rancher/k3s/k3s.yaml
curl -sfL https://get.k3s.io | sh -
```

```bash
# Перевірте правильність конфігурації
kubectl get node
```

## Розгортання застосунку в кластері

Розгорніть застосунок NocoBase у кластерному режимі в кластері Kubernetes.

### Змінні середовища

Зазвичай, змінні середовища слід відокремлювати від файлу конфігурації розгортання застосунку. У цій статті ConfigMap використовується як приклад оркестрації; у реальному виробничому середовищі ви можете додати Secrets для подальшого відокремлення конфіденційної інформації.

Кроки:

1.  Створіть файл `nocobase-cm.yaml`.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nocobase-config
data:
  # Встановіть свій часовий пояс, наприклад, UTC, Europe/Kyiv
  TZ: Asia/Shanghai
  # Наведені нижче конфігурації бази даних та Redis використовують сервіси PostgreSQL та Redis у кластері з документації «Розгортання проміжного ПЗ в Kubernetes».
  # Якщо у вашому середовищі вже є існуючі сервіси бази даних та Redis, змініть відповідні конфігурації нижче.
  CACHE_DEFAULT_STORE: redis
  # Використовуйте існуючий або самостійно розгорнутий сервіс Redis.
  CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
  PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
  LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
  # Використовуйте існуючий або самостійно розгорнутий сервіс PostgreSQL.
  DB_DATABASE: nocobase
  DB_DIALECT: postgres
  DB_HOST: "postgres-0.postgres-service"
  DB_PASSWORD: nocobase123
  DB_PORT: "5432"
  DB_UNDERSCORED: "true"
  DB_USER: nocobase
  # ім'я користувача сервісної платформи
  NOCOBASE_PKG_USERNAME: "<your user>"
  # пароль сервісної платформи
  NOCOBASE_PKG_PASSWORD: "<your password>"

  # ... інші змінні середовища
```

2.  Виконайте команду `kubectl` для розгортання ConfigMap.

```bash
kubectl apply -f nocobase-cm.yaml
```

### Спільне сховище

Різні ноди застосунку NocoBase, розгорнутого в кластерному режимі, повинні монтувати один і той же каталог сховища (`storage`). Для цього необхідно створити постійний том (Persistent Volume, PV), який підтримує доступ для читання та запису з кількох нод (ReadWriteMany). Зазвичай, вам потрібно створити хмарний диск на платформі вашого хмарного провайдера та прив'язати його як PV, або ви можете монтувати спільний каталог сховища за допомогою інших методів, таких як NFS.

### Розгортання застосунку

Для початкового розгортання почніть з однієї ноди. Після завершення ви можете масштабувати до кількох нод.

1.  Створіть файл `nocobase-apps.yaml`.

```yaml
# Створіть PVC. Кілька Pod'ів, розгорнутих за допомогою Deployment нижче, монтуватимуть той самий каталог постійного сховища через цей PVC.
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
  storageClassName: "" # Явно встановлено порожнім, оскільки приклад використовує сервіс NFS головної ноди, уникаючи типового StorageClass.
---
# Сервіс застосунку, який надає послуги за межами кластера після прив'язки до Ingress.
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
# Deployment застосунку, який може розгортати кілька контейнерів застосунку.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nocobase
spec:
  replicas: 1 # Початкове розгортання лише з однією нодою.
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
          # Завантажуйте змінні середовища з раніше розгорнутого ConfigMap.
          envFrom:
            - configMapRef:
                name: nocobase-config
          volumeMounts:
            - name: nocobase-data
              mountPath: /app/nocobase/storage
          # Оголосіть запити та обмеження ресурсів для сервісу.
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          # Команда перевірки життєздатності (liveness probe). Кластер використовує її для визначення, чи потрібно перезапустити Pod.
          livenessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 60
          # Команда перевірки готовності (readiness probe). Кластер використовує її для визначення, чи слід направляти трафік Service до Pod.
          readinessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 30
      # Монтуйте постійне сховище через PVC.
      volumes:
        - name: nocobase-data
          persistentVolumeClaim:
            claimName: nocobase-pvc
```

2.  Виконайте команду `kubectl` для розгортання сервісу застосунку NocoBase.

```bash
kubectl apply -f nocobase-apps.yaml
```

3.  Перевірте статус сервісу застосунку NocoBase.

```bash
# Перевірте статус Pod'ів сервісу NocoBase.
kubectl get pods -l app=nocobase
```

Приклад виводу наведено нижче. `STATUS` зі значенням `Running` вказує на успішний запуск сервісу:

```text
NAME                        READY   STATUS    RESTARTS   AGE
nocobase-5558b774d7-w6swf   1/1     Running   0          7h6m
```

4.  Під час першого запуску вам потрібно вручну увімкнути наступні плагіни в адміністративному інтерфейсі:

    -   @nocobase/plugin-sync-adapter-redis
    -   @nocobase/plugin-lock-adapter-redis

    Після цього ви можете масштабувати. Наприклад, для масштабування до 4 нод:

```bash
kubectl scale deployment nocobase --replicas=4
```

## Зміни застосунку

Зміни застосунку стосуються наступних ситуацій:

-   Оновлення версії застосунку
-   Встановлення нових плагінів
-   Активація плагінів

NocoBase наразі не підтримує автоматичну синхронізацію змін між кількома екземплярами в кластері для вищезгаданих сценаріїв. Тому вам потрібно обробляти їх вручну, дотримуючись наведених нижче кроків. Ці кроки стосуються лише змін сервісу застосунку. Перед внесенням будь-яких змін, будь ласка, самостійно створіть резервні копії вашої бази даних та постійного сховища.

### Послідовне оновлення версії застосунку

1.  Виконайте команду `kubectl set image`, щоб змінити версію образу контейнера Deployment.

    ```bash
    kubectl set image deployment/nocobase nocobase=nocobase/nocobase:1.7
    ```

2.  Перевірте статус послідовного оновлення.

    ```bash
    # Перевірте загальний прогрес послідовного оновлення Deployment.
    kubectl rollout status deployment/nocobase

    # Перевірте статус кожного Pod'а.
    kubectl get pods -l app=nocobase
    ```

Якщо ви зіткнетеся з будь-якими проблемами під час або після оновлення версії застосунку та вам потрібно буде відкотити зміни, виконайте наступну команду, щоб відкотити версію образу контейнера:

```bash
kubectl rollout undo deployment/nocobase
```

### Плавний перезапуск застосунку

Після встановлення або активації нових плагінів вам потрібно оновити конфігурацію або стан застосунку. Ви можете використати наступну команду для плавного перезапуску кожного Pod'а.

1.  Виконайте команду `kubectl rollout restart`.

    ```bash
    kubectl rollout restart deployment/nocobase
    ```

2.  Перевірте статус послідовного перезапуску.

    ```bash
    # Перевірте загальний прогрес перезапуску Deployment.
    kubectl rollout status deployment/nocobase

    # Перевірте статус кожного Pod'а.
    kubectl get pods -l app=nocobase
    ```

## Шлюз застосунку

Щоб зробити застосунок, розгорнутий у кластері Kubernetes, доступним ззовні, вам потрібно прив'язати Ingress до сервісу застосунку. Кластерне середовище, використане в цій статті, — це K3s, який постачається з Traefik як типовим Ingress Controller.

### Traefik IngressRoute

Кроки:

1.  Створіть файл `nocobase-ingress.yaml`.

    ```yaml
    apiVersion: traefik.containo.us/v1alpha1
    kind: IngressRoute
    metadata:
      name: nocobase-ingress
    spec:
      entryPoints:
        - web
      routes:
        # Тут 'nocobase.local' слід замінити на реальне доменне ім'я, що вказує на IP-адресу кластера.
        # Якщо у вас немає домену для перевірки, ви можете змінити локальний файл hosts, додавши запис для nocobase.local, що вказує на IP-адресу кластера.
        # Потім ви зможете отримати доступ до застосунку NocoBase в кластері, відкривши http://nocobase.local у своєму браузері.
        - match: Host(`nocobase.local`)
          kind: Rule
          services:
            # Це Service, створений під час розгортання застосунку nocobase у розділі «Розгортання застосунку» вище.
            - name: nocobase
              port: 13000
    ```

2.  Виконайте команду `kubectl` для розгортання Ingress для застосунку NocoBase.

```bash
kubectl apply -f nocobase-ingress.yaml
```

### Ingress-Nginx

Більшість кластерів Kubernetes використовують Ingress-Nginx як Ingress Controller. Нижче наведено файл `nocobase-ingress.yaml` на основі Ingress-Nginx:

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
  name: nocobase-ingress
spec:
  rules:
    # Тут 'nocobase.local' слід замінити на реальне доменне ім'я, що вказує на IP-адресу кластера.
    # Якщо у вас немає домену для перевірки, ви можете змінити локальний файл hosts, додавши запис для nocobase.local, що вказує на IP-адресу кластера.
    # Потім ви зможете отримати доступ до застосунку NocoBase в кластері, відкривши http://nocobase.local у своєму браузері.
    - host: nocobase.local
      http:
        paths:
          - backend:
              serviceName: nocobase
              servicePort: 13000
```

## Використання Helm Charts

Ми розробили Helm Charts для застосунку NocoBase, що дозволяє розгортати сервіс застосунку NocoBase в Kubernetes за допомогою Helm CLI.

### Підготовка

Переконайтеся, що у вашому операційному середовищі встановлено такі клієнти, як `kubectl` та `helm`, і що `kubectl` може правильно підключатися до цільового кластера.

### Додавання репозиторію

Додайте репозиторій Helm Charts для NocoBase:

```bash
# Додайте репозиторій Helm Charts для NocoBase
helm repo add nocobase https://nocobase.github.io/helm-charts

# Оновіть індекс Helm.
helm repo update
```

### Розгортання за допомогою Helm

1.  Створіть файл `values.yaml`.

    ```yaml
    persistent:
      # Необхідний розмір для спільного сховища кластера NocoBase.
      size: 10Gi
      # Клас сховища, наданий Kubernetes хмарного сервісу.
      # Як і в розділі «Розгортання застосунку», це явно встановлено порожнім, оскільки використовується сервіс NFS головної ноди.
      storageClassName: ""

    configMap:
      data:
        # Встановіть свій часовий пояс, наприклад, UTC, Europe/Kyiv
        TZ: Asia/Shanghai
        # Наведені нижче конфігурації бази даних та Redis використовують сервіси PostgreSQL та Redis у кластері з документації «Розгортання проміжного ПЗ в Kubernetes».
        # Якщо у вашому середовищі вже є існуючі сервіси бази даних та Redis, змініть відповідні конфігурації нижче.
        CACHE_DEFAULT_STORE: redis
        # Використовуйте існуючий або самостійно розгорнутий сервіс Redis.
        CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
        PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
        LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
        # Використовуйте існуючий або самостійно розгорнутий сервіс PostgreSQL.
        DB_DATABASE: nocobase
        DB_DIALECT: postgres
        DB_HOST: "postgres-0.postgres-service"
        DB_PASSWORD: nocobase123
        DB_PORT: "5432"
        DB_UNDERSCORED: "true"
        DB_USER: nocobase
        # ім'я користувача сервісної платформи
        NOCOBASE_PKG_USERNAME: "<your user>"
        # пароль сервісної платформи
        NOCOBASE_PKG_PASSWORD: "<your password>"

        # ... інші змінні середовища
    ```

2.  Виконайте команду `helm install`, щоб розпочати встановлення.

    ```bash
    helm install nocobase nocobase/nocobase --values values.yaml
    ```