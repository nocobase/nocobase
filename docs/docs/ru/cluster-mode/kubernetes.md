
:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::


# Развертывание в Kubernetes

Эта статья призвана помочь вам быстро развернуть NocoBase в кластерном режиме в среде Kubernetes. Предполагается, что вы знакомы со средой Kubernetes и выполнили все шаги из раздела [Подготовка](./preparations.md).

:::info{title="Подсказка"}
Для быстрой проверки процесса развертывания в Kubernetes в этой статье используется одноузловой кластер K3s (ОС: Ubuntu). Это руководство также применимо к стандартным кластерам Kubernetes. Если при развертывании в стандартном кластере Kubernetes вы столкнетесь с отличиями от описанного здесь, пожалуйста, сообщите нам.
:::

## Кластерная среда

Если у вас уже есть кластер Kubernetes, вы можете пропустить этот шаг.

Подготовьте сервер с установленной Debian / Ubuntu и запустите на нем кластер K3s в одноузловом режиме. Чтобы узнать больше о K3s, посетите [официальный сайт K3s](https://docs.k3s.io/zh/).

Шаги:

1. Подключитесь к серверу по SSH.
2. Используйте официальный скрипт для установки главного узла кластера K3s на сервере.

```bash
# После установки файл kubeconfig по умолчанию находится по адресу /etc/rancher/k3s/k3s.yaml
curl -sfL https://get.k3s.io | sh -
```

```bash
# Убедитесь, что конфигурация верна
kubectl get node
```

## Развертывание кластерного приложения

Развертывание приложения NocoBase в кластерном режиме в кластере Kubernetes.

### Переменные окружения

Обычно переменные окружения следует отделять от конфигурационного файла развертывания приложения. В этой статье в качестве примера используется ConfigMap. В производственной среде вы можете использовать Secrets для дополнительного разделения конфиденциальной информации.

Шаги:

1. Создайте файл `nocobase-cm.yaml`.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nocobase-config
data:
  TZ: Asia/Shanghai # Установите ваш часовой пояс, например, Europe/Moscow, UTC
  # Конфигурации базы данных и Redis ниже используют службы PostgreSQL и Redis в кластере, описанные в документе "Развертывание промежуточного ПО в K8S".
  # Если в вашей среде уже есть существующие службы базы данных и Redis, измените соответствующие конфигурации ниже.
  CACHE_DEFAULT_STORE: redis
  # Используйте существующую или самостоятельно развернутую службу Redis.
  CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
  PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
  LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
  # Используйте существующую или самостоятельно развернутую службу PostgreSQL.
  DB_DATABASE: nocobase
  DB_DIALECT: postgres
  DB_HOST: "postgres-0.postgres-service"
  DB_PASSWORD: nocobase123
  DB_PORT: "5432"
  DB_UNDERSCORED: "true"
  DB_USER: nocobase
  # Имя пользователя платформы сервиса
  NOCOBASE_PKG_USERNAME: "<your user>"
  # Пароль платформы сервиса
  NOCOBASE_PKG_PASSWORD: "<your password>"

  # ... другие переменные окружения
```

2. Выполните команду `kubectl` для развертывания ConfigMap.

```bash
kubectl apply -f nocobase-cm.yaml
```

### Общее хранилище

Различным узлам приложения NocoBase, развернутого в кластерном режиме, необходимо монтировать один и тот же каталог хранения (`storage`). Для этого вам потребуется создать постоянный том (Persistent Volume, PV), который поддерживает чтение и запись с нескольких узлов (ReadWriteMany). Обычно облачный диск создается на платформе облачного провайдера и привязывается как PV, или же общий каталог хранения может быть смонтирован другими способами, например, через NFS.

### Развертывание приложения

При первом развертывании приложения начните с одного узла. После его завершения вы сможете масштабировать до нескольких узлов.

1. Создайте файл `nocobase-apps.yaml`.

```yaml
# Создаем PVC. Несколько подов, развернутых с помощью Deployment ниже, будут монтировать один и тот же каталог постоянного хранения через этот PVC.
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
  storageClassName: "" # В примере используется служба NFS главного узла, поэтому явно указано пустое значение, чтобы избежать использования StorageClass по умолчанию.
---
# Service приложения, который будет предоставлять доступ к сервису извне кластера после привязки к Ingress.
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
# Deployment приложения, который может развертывать несколько контейнеров приложения.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nocobase
spec:
  replicas: 1 # При первом развертывании используется только один узел.
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
          # Переменные окружения загружаются из ранее развернутого ConfigMap.
          envFrom:
            - configMapRef:
                name: nocobase-config
          volumeMounts:
            - name: nocobase-data
              mountPath: /app/nocobase/storage
          # Объявляем запросы и лимиты ресурсов для работы сервиса.
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          # Команда проверки активности (liveness probe). Кластер использует ее для определения необходимости перезапуска пода.
          livenessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 60
          # Команда проверки готовности (readiness probe). Кластер использует ее для определения, следует ли направлять трафик Service на под.
          readinessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 30
      # Монтируем постоянное хранилище через PVC.
      volumes:
        - name: nocobase-data
          persistentVolumeClaim:
            claimName: nocobase-pvc
```

2. Выполните команду `kubectl` для развертывания службы приложения NocoBase.

```bash
kubectl apply -f nocobase-apps.yaml
```

3. Проверьте статус службы приложения NocoBase.

```bash
# Проверьте статус подов службы NocoBase
kubectl get pods -l app=nocobase
```

Пример вывода показан ниже. `STATUS` со значением `Running` означает, что служба успешно запущена:

```text
NAME                        READY   STATUS    RESTARTS   AGE
nocobase-5558b774d7-w6swf   1/1     Running   0          7h6m
```

4. При первом запуске приложения вам потребуется вручную включить следующие плагины:

- @nocobase/plugin-sync-adapter-redis
- @nocobase/plugin-lock-adapter-redis

После этого вы можете масштабировать кластер. Например, для масштабирования до 4 узлов:

```bash
kubectl scale deployment nocobase --replicas=4
```

## Изменения приложения

Изменения приложения относятся к следующим ситуациям:

- Обновление версии приложения
- Установка новых плагинов
- Активация плагинов

NocoBase пока не поддерживает автоматическую синхронизацию изменений между несколькими экземплярами в кластере для вышеуказанных сценариев. Поэтому вам необходимо выполнять их вручную, следуя приведенным ниже шагам. Эти шаги касаются только изменений службы приложения. Перед внесением каких-либо изменений, пожалуйста, самостоятельно сделайте резервные копии вашей базы данных и постоянного хранилища.

### Скользящее обновление версии приложения

1. Выполните команду `kubectl set image`, чтобы изменить версию образа контейнера Deployment.

```bash
kubectl set image deployment/nocobase nocobase=nocobase/nocobase:1.7
```

2. Проверьте статус скользящего обновления.

```bash
# Проверьте общий прогресс скользящего обновления Deployment
kubectl rollout status deployment/nocobase

# Проверьте статус каждого пода
kubectl get pods -l app=nocobase
```

Если в процессе или после обновления версии приложения вы обнаружите аномалии и потребуется откатить версию, выполните следующую команду для отката версии образа контейнера:

```bash
kubectl rollout undo deployment/nocobase
```

### Плавный перезапуск приложения

После установки или активации новых плагинов необходимо обновить конфигурацию или состояние приложения. Вы можете использовать следующую команду для плавного перезапуска каждого пода.

1. Выполните команду `kubectl rollout restart`.

```bash
kubectl rollout restart deployment/nocobase
```

2. Проверьте статус скользящего перезапуска.

```bash
# Проверьте общий прогресс перезапуска Deployment
kubectl rollout status deployment/nocobase

# Проверьте статус каждого пода
kubectl get pods -l app=nocobase
```

## Шлюз приложения

Чтобы сделать приложение, развернутое в кластере Kubernetes, доступным извне, вам необходимо привязать Ingress к Service приложения. Кластерная среда, используемая в этой статье, — K3s, в которой Traefik установлен по умолчанию в качестве компонента Ingress Controller.

### Traefik IngressRoute

Шаги:

1. Создайте файл `nocobase-ingress.yaml`.

```yaml
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: nocobase-ingress
spec:
  entryPoints:
    - web
  routes:
    # Здесь 'nocobase.local' следует заменить на реальное доменное имя, указывающее на IP-адрес кластера.
    # Если у вас нет домена для проверки, вы можете изменить локальный файл hosts, добавив запись для nocobase.local, указывающую на IP-адрес кластера.
    # Затем вы сможете получить доступ к приложению NocoBase в кластере, открыв http://nocobase.local в браузере.
    - match: Host(`nocobase.local`)
      kind: Rule
      services:
        # Это Service, созданный при развертывании приложения nocobase в разделе "Развертывание приложения" выше.
        - name: nocobase
          port: 13000
```

2. Выполните команду `kubectl` для развертывания Ingress для приложения NocoBase.

```bash
kubectl apply -f nocobase-ingress.yaml
```

### Ingress-Nginx

Большинство кластеров Kubernetes используют Ingress-Nginx в качестве Ingress Controller. Ниже представлен файл `nocobase-ingress.yaml` на основе Ingress-Nginx:

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
  name: nocobase-ingress
spec:
  rules:
    # Здесь 'nocobase.local' следует заменить на реальное доменное имя, указывающее на IP-адрес кластера.
    # Если у вас нет домена для проверки, вы можете изменить локальный файл hosts, добавив запись для nocobase.local, указывающую на IP-адрес кластера.
    # Затем вы сможете получить доступ к приложению NocoBase в кластере, открыв http://nocobase.local в браузере.
    - host: nocobase.local
      http:
        paths:
          - backend:
              serviceName: nocobase
              servicePort: 13000
```

## Использование Helm Charts

Мы разработали Helm Charts для приложения NocoBase, что позволяет развертывать службу приложения NocoBase в Kubernetes с помощью Helm CLI.

### Подготовка

Убедитесь, что в вашей операционной среде установлены клиенты, такие как `kubectl` и `helm`, и что `kubectl` может корректно подключаться к целевому кластеру.

### Добавление репозитория

Добавьте репозиторий Helm Charts для NocoBase:

```bash
# Добавьте репозиторий Helm Charts для NocoBase
helm repo add nocobase https://nocobase.github.io/helm-charts

# Обновите индекс Helm
helm repo update
```

### Развертывание с помощью Helm

1. Создайте файл `values.yaml`.

```yaml
persistent:
  # Требуемый размер для общего хранилища кластера NocoBase
  size: 10Gi
  # Класс хранилища, предоставляемый Kubernetes облачного сервиса
  # Здесь, как и в разделе "Развертывание приложения", явно указано пустое значение, поскольку используется служба NFS главного узла.
  storageClassName: ""

configMap:
  data:
    TZ: Asia/Shanghai # Установите ваш часовой пояс, например, Europe/Moscow, UTC
    # Конфигурации базы данных и Redis ниже используют службы PostgreSQL и Redis в кластере, описанные в документе "Развертывание промежуточного ПО в K8S".
    # Если в вашей среде уже есть существующие службы базы данных и Redis, измените соответствующие конфигурации ниже.
    CACHE_DEFAULT_STORE: redis
    # Используйте существующую или самостоятельно развернутую службу Redis.
    CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
    PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
    LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
    # Используйте существующую или самостоятельно развернутую службу PostgreSQL.
    DB_DATABASE: nocobase
    DB_DIALECT: postgres
    DB_HOST: "postgres-0.postgres-service"
    DB_PASSWORD: nocobase123
    DB_PORT: "5432"
    DB_UNDERSCORED: "true"
    DB_USER: nocobase
    # Имя пользователя платформы сервиса
    NOCOBASE_PKG_USERNAME: "<your user>"
    # Пароль платформы сервиса
    NOCOBASE_PKG_PASSWORD: "<your password>"

    # ... другие переменные окружения
```

2. Выполните команду `helm install`, чтобы начать установку.

```bash
helm install nocobase nocobase/nocobase --values values.yaml
```