---
pkg: "@nocobase/preset-cluster"
title: "Развёртывание в Kubernetes"
description: "Развёртывание кластера NocoBase на K8s или K3s: ConfigMap, Deployment, общий PVC, middleware Redis или PostgreSQL, балансировка нагрузки и проверки работоспособности."
keywords: "Kubernetes,K8s,K3s,ConfigMap,Deployment,PVC,развёртывание кластера,NocoBase"
---


# Развёртывание в Kubernetes

Эта статья помогает быстро развернуть NocoBase в режиме кластера в среде Kubernetes. Предполагается, что читатель знаком с Kubernetes и уже выполнил шаги из [Подготовки](./preparations.md).

:::info{title="Tip"}
Для быстрой проверки процесса развёртывания в этой статье используется одноузловой кластер K3s (OS: Ubuntu). Руководство также применимо к стандартным кластерам Kubernetes. Если при развёртывании в стандартном Kubernetes появятся расхождения, сообщите нам.
:::

## Окружение кластера

Если у вас уже есть среда Kubernetes-кластера, этот шаг можно пропустить.

Подготовьте сервер с Debian/Ubuntu и запустите на нём кластер K3s в одноузловом режиме. Подробнее: [официальный сайт K3s](https://docs.k3s.io/).

Шаги:

1. Подключитесь к серверу по SSH.
2. Используйте официальный скрипт для установки master-узла K3s.

```bash
# После установки kubeconfig по умолчанию находится в /etc/rancher/k3s/k3s.yaml
curl -sfL https://get.k3s.io | sh -
```

```bash
# Проверить корректность конфигурации
kubectl get node
```

## Развёртывание приложения в кластере

Разверните приложение NocoBase в режиме кластера на Kubernetes-кластере.

### Переменные окружения

Обычно переменные окружения отделяют от файла конфигурации развёртывания приложения. В этой статье используется ConfigMap. В  производственной среде можно дополнительно выносить чувствительные данные в Secrets.

Шаги:

1. Создайте файл `nocobase-cm.yaml`.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nocobase-config
data:
  TZ: UTC # Укажите часовой пояс, например UTC, America/New_York
  # Конфигурации базы и Redis ниже используют PostgreSQL и Redis из кластера из документа "Kubernetes Middleware Deployment".
  # Если в вашей среде уже есть свои базы и Redis, измените соответствующие настройки ниже.
  CACHE_DEFAULT_STORE: redis
  # Используйте существующий или самостоятельно развернутый Redis.
  CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
  PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
  LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
  # Используйте существующий или самостоятельно развернутый PostgreSQL.
  DB_DATABASE: nocobase
  DB_DIALECT: postgres
  DB_HOST: "postgres-0.postgres-service"
  DB_PASSWORD: nocobase123
  DB_PORT: "5432"
  DB_UNDERSCORED: "true"
  DB_USER: nocobase
  # username сервисной платформы
  NOCOBASE_PKG_USERNAME: "<your user>"
  # пароль сервисной платформы
  NOCOBASE_PKG_PASSWORD: "<your password>"

  # ... другие переменные окружения
```

2. Разверните ConfigMap командой `kubectl`.

```bash
kubectl apply -f nocobase-cm.yaml
```

### Общее хранилище

Узлы кластера NocoBase в режиме кластера должны монтировать одну и ту же директорию хранения (`storage`). Для этого нужно создать Persistent Volume (PV) с доступом ReadWriteMany. Обычно создают облачный диск у провайдера и привязывают его как PV, либо используют NFS или другой способ общего хранения.

### Развёртывание приложения

Для первого развёртывания начинайте с одного узла. После завершения можно масштабировать до нескольких узлов.

1. Создайте файл `nocobase-apps.yaml`.

```yaml
# Создаём PVC. Несколько Pod ниже будут монтировать одну и ту же директорию постоянного хранилища через этот PVC.
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
  storageClassName: "" # Явно пусто: в примере используется NFS master-узла, чтобы избежать default StorageClass.
---
# Service приложения, который после привязки к Ingress предоставляет сервис наружу из кластера.
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
# Deployment приложения, позволяющий развернуть несколько контейнеров приложения.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nocobase
spec:
  replicas: 1 # Изначально развёртываем только один узел.
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
          # Загружаем переменные окружения из ранее развернутого ConfigMap.
          envFrom:
            - configMapRef:
                name: nocobase-config
          volumeMounts:
            - name: nocobase-data
              mountPath: /app/nocobase/storage
          # Requests и limits ресурсов сервиса.
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          # Команда liveness probe: кластер решает, нужно ли перезапускать Pod.
          livenessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 60
          # Команда readiness probe: кластер решает, направлять ли трафик Service в Pod.
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

2. Запустите развёртывание сервиса приложения NocoBase.

```bash
kubectl apply -f nocobase-apps.yaml
```

3. Проверьте статус сервиса приложения NocoBase.

```bash
# Проверить статус Pod сервиса NocoBase
kubectl get pods -l app=nocobase
```

Пример вывода: `STATUS` = `Running` означает успешный запуск.

```text
NAME                        READY   STATUS    RESTARTS   AGE
nocobase-5558b774d7-w6swf   1/1     Running   0          7h6m
```

4. При первом запуске в менеджере плагинов вручную включите плагины:

- @nocobase/plugin-sync-adapter-redis
- @nocobase/plugin-lock-adapter-redis

После этого можно масштабировать, например до 4 узлов:

```bash
kubectl scale deployment nocobase --replicas=4
```

## Изменения приложения

Под изменениями приложения понимаются:

- обновление версии приложения;
- установка новых плагинов;
- активация плагинов.

Сейчас NocoBase не поддерживает автоматическую синхронизацию этих изменений между несколькими экземплярами в кластере. Поэтому их нужно выполнять вручную по шагам ниже. Эти шаги затрагивают только сервис приложения. Перед изменениями самостоятельно сделайте резервные копии базы данных и персистентного хранилища.

### Поэтапное обновление версии приложения

1. Выполните `kubectl set image`, чтобы сменить версию образа контейнера в Deployment.

```bash
kubectl set image deployment/nocobase nocobase=nocobase/nocobase:1.7
```

2. Проверьте статус rolling update.

```bash
# Проверить общий прогресс rolling update Deployment
kubectl rollout status deployment/nocobase

# Проверить статус каждого Pod
kubectl get pods -l app=nocobase
```

Если в процессе или после обновления версии возникли проблемы и нужен откат, выполните:

```bash
kubectl rollout undo deployment/nocobase
```

### Плавный перезапуск приложения

После установки или активации новых плагинов нужно обновить конфигурацию/состояние приложения. Используйте следующую команду для корректного перезапуска каждого Pod.

1. Выполните `kubectl rollout restart`.

```bash
kubectl rollout restart deployment/nocobase
```

2. Проверьте статус rolling restart.

```bash
# Проверить общий прогресс перезапуска Deployment
kubectl rollout status deployment/nocobase

# Проверить статус каждого Pod
kubectl get pods -l app=nocobase
```

## Шлюз приложения

Чтобы приложение в Kubernetes-кластере было доступно извне, нужно привязать Ingress к Service приложения. В окружении этой статьи используется K3s, где Traefik идёт как Ingress Controller по умолчанию.

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
    # 'nocobase.local' замените на реальный домен, указывающий на IP кластера.
    # Если домена нет, можно добавить в локальный hosts запись для nocobase.local на IP кластера.
    # После этого приложение NocoBase в кластере можно открыть по http://nocobase.local.
    - match: Host(`nocobase.local`)
      kind: Rule
      services:
        # Service, созданный в разделе "Application Deployment".
        - name: nocobase
          port: 13000
```

2. Разверните Ingress приложения NocoBase:

```bash
kubectl apply -f nocobase-ingress.yaml
```

### Ingress-Nginx

В большинстве Kubernetes-кластеров используется Ingress-Nginx как Ingress Controller. Ниже пример `nocobase-ingress.yaml` для Ingress-Nginx:

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
  name: nocobase-ingress
spec:
  rules:
    # 'nocobase.local' замените на реальный домен, указывающий на IP кластера.
    # Если домена нет, можно добавить в локальный hosts запись для nocobase.local на IP кластера.
    # После этого приложение NocoBase в кластере можно открыть по http://nocobase.local.
    - host: nocobase.local
      http:
        paths:
          - backend:
              serviceName: nocobase
              servicePort: 13000
```

## Использование Helm Charts

Для приложения NocoBase подготовлены Helm Charts, что позволяет разворачивать сервис приложения в Kubernetes через Helm CLI.

### Предварительные требования

Убедитесь, что в операционной среде установлены `kubectl` и `helm`, а `kubectl` корректно подключается к целевому кластеру.

### Добавление репозитория

Добавьте репозиторий NocoBase Helm Charts:

```bash
# Добавить репозиторий NocoBase Helm Charts
helm repo add nocobase https://nocobase.github.io/helm-charts

# Обновить индекс Helm
helm repo update
```

### Развёртывание через Helm

1. Создайте файл `values.yaml`.

```yaml
persistent:
  # Необходимый размер общего storage для кластера NocoBase
  size: 10Gi
  # storage class, предоставленный Kubernetes у облачного провайдера
  # Как и в "Application Deployment", здесь явно пусто, так как используется NFS master-узла.
  storageClassName: ""

configMap:
  data:
    TZ: UTC # Укажите часовой пояс, например UTC, America/New_York
    # Конфигурации базы и Redis ниже используют PostgreSQL и Redis из кластера из документа "Kubernetes Middleware Deployment".
    # Если в вашей среде уже есть свои базы и Redis, измените соответствующие настройки ниже.
    CACHE_DEFAULT_STORE: redis
    # Используйте существующий или самостоятельно развернутый Redis.
    CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
    PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
    LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
    # Используйте существующий или самостоятельно развернутый PostgreSQL.
    DB_DATABASE: nocobase
    DB_DIALECT: postgres
    DB_HOST: "postgres-0.postgres-service"
    DB_PASSWORD: nocobase123
    DB_PORT: "5432"
    DB_UNDERSCORED: "true"
    DB_USER: nocobase
    # username сервисной платформы
    NOCOBASE_PKG_USERNAME: "<your user>"
    # пароль сервисной платформы
    NOCOBASE_PKG_PASSWORD: "<your password>"

    # ... другие переменные окружения
```

2. Выполните `helm install` для запуска установки.

```bash
helm install nocobase nocobase/nocobase --values values.yaml
```