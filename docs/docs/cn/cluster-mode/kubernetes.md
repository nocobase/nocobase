# Kubernetes 部署

本文旨在指导用户快速在 K8S 环境中部署集群模式的 NocoBase，假设读者熟悉 K8S 环境，并已完成 [准备工作](./preparations.md) 中的内容。

:::info{title="提示"}
为了快速验证 K8S 部署流程，本文操作环境为单节点的 K3S 集群（操作系统为 Ubuntu）。在标准 K8S 集群中本指南同样适用，如果在标准 K8S 集群中部署出现与本文不同的情况，请告知我们。
:::

## 集群环境

已经具有 K8S 集群环境的可以跳过本步骤。

准备一台安装了 Debian / Ubuntu 的服务器，并在上面以单节点模式运行 K3S 集群。关于什么是 K3S，可以访问 [K3S 官网](https://docs.k3s.io/zh/)。

步骤如下：

1. SSH 登录服务器。
2. 在服务器上使用官方脚本安装 K3S 集群主节点。

```bash
# 安装后默认 kubeconfig 文件是 /etc/rancher/k3s/k3s.yaml
curl -sfL https://get.k3s.io | sh -
```

```bash
# 验证配置是否正确
kubectl get node
```

## 集群应用部署

以集群模式在 K8S 集群中部署 NocoBase 应用。

### 环境变量

通常应该将环境变量从应用部署的配置文件中拆分开，本文以 ConfigMap 为示例编排，实际生产可以加入 Secrets 进一步拆分敏感信息。

步骤如下：

1. 创建 `nocobase-cm.yaml` 文件。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nocobase-config
data:
  TZ: Asia/Shanghai
  # 下面数据库和 Redis 配置使用的是 “K8S 中间件部署” 文档在集群里的 PostgreSQL 服务和 Redis 服务
  # 如果目标环境已经存在其他现成的数据库和 Redis 服务，修改下面对应的数据库和 Redis 的相关配置即可
  CACHE_DEFAULT_STORE: redis
  # 使用环境已有或者自己部署的 Redis 服务
  CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
  PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
  LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
  # 使用环境已有或者自己部署的 PostgreSQL 服务
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

  # ... 其他环境变量
```

2. 运行 `kubectl` 命令部署 ConfigMap。

```bash
kubectl apply -f nocobase-cm.yaml
```

### 共享存储

集群模式部署的 NocoBase 应用的不同节点需要挂载相同的存储目录（storage），为此需要创建一个支持多节点读写的持久化卷（Persistent Volume）。一般情况下需要在云服务商平台上创建云盘并绑定为 PV，也可以通过 NFS 等其他方式挂载共享存储目录。

### 应用部署

首次部署应用要从一个节点开始，完成后再 scale 启动多个节点。

1. 创建 `nocobase-apps.yaml` 文件。

```yaml
# 创建一个 PVC，下面 Deployment 部署的多个 Pod 都通过这个 PVC 挂载相同的持久化存储目录
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
  storageClassName: "" # 示例使用主节点 NFS 服务所以显式指定为空，避免使用默认 StorageClass
---
# 应用的 Service，绑定 Ingress 后向集群外部提供服务
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
# 应用的 Deployment，可部署多个应用容器
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nocobase
spec:
  replicas: 1 # 首次部署仅一个节点
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
          # 环境变量从前面部署的 ConfigMap 加载
          envFrom:
            - configMapRef:
                name: nocobase-config
          volumeMounts:
            - name: nocobase-data
              mountPath: /app/nocobase/storage
          # 声明服务运行资源需求和限制
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          # 服务存活检测命令，集群通过该命令判断是否需要重启 Pod
          livenessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 60
          # 服务可用检测命令，集群通过该命令判断是否将 Service 流量导入 Pod
          readinessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 30
      # 通过 PVC 挂载持久化存储
      volumes:
        - name: nocobase-data
          persistentVolumeClaim:
            claimName: nocobase-pvc
```

2. 运行 `kubectl` 命令部署 NocoBase 应用服务。

```bash
kubectl apply -f nocobase-apps.yaml
```

3. 验证 NocoBase 应用服务状态。

```bash
# 查看 NocoBase 服务的 Pod 状态
kubectl get pods -l app=nocobase
```

示例输出如下，`STATUS` 为 `Running` 时表示服务启动成功：

```text
NAME                        READY   STATUS    RESTARTS   AGE
nocobase-5558b774d7-w6swf   1/1     Running   0          7h6m
```

4. 应用首次启动，需要在管理界面手动启用以下插件：

- @nocobase/plugin-sync-adapter-redis
- @nocobase/plugin-lock-adapter-redis

之后再进行扩容。例如扩容到 4 个节点：

```bash
kubectl scale deployment nocobase-deployment --replicas=4
```

## 应用变更

应用变更指以下几种情况：

- 应用版本升级
- 新安装插件
- 激活插件

NocoBase 暂未对以上场景中的集群多实例实现自动同步变更，所以需要手动按以下步骤处理。下面步骤只涉及应用服务变更，变更前请自行做好数据库备份、持久化存储备份。

### 应用版本滚动升级

1. 运行 `kubectl set image` 命令修改 Deployment 容器镜像版本。

    ```bash
    kubectl set image deployment/nocobase nocobase=nocobase/nocobase:1.7
    ```

2. 查看滚动更新状态。

    ```bash
    # 查看 Deployment 整体滚动更新进度
    kubectl rollout status deployment/nocobase

    # 查看各个 Pod 状态
    kubectl get pods -l app=nocobase
    ```

如果应用版本升级过程或升级后发现异常，需要回滚版本，执行下面命令回滚容器镜像版本：

```bash
kubectl rollout undo deployment/nocobase
```

### 应用平滑重启

新安装插件或激活插件后需要刷新应用配置或状态，可以使用下面命令平滑重启各个 Pod。

1. 运行 `kubectl rollout restart` 命令。

    ```bash
    kubectl rollout restart deployment/nocobase
    ```

2. 查看滚动重启状态。

    ```bash
    # 查看 Deployment 整体重启进度
    kubectl rollout status deployment/nocobase

    # 查看各个 Pod 状态
    kubectl get pods -l app=nocobase
    ```

## 应用网关

在 K8S 集群中部署的应用要被外部访问时，需要为应用 Service 绑定一个 Ingress。本文使用的集群环境是 K3S，K3S 默认安装的 Ingress Controller 组件是 Traefik。

### Traefik IngressRoute

步骤如下：

1. 创建 `nocobase-ingress.yaml` 文件。

    ```yaml
    apiVersion: traefik.containo.us/v1alpha1
    kind: IngressRoute
    metadata:
      name: nocobase-ingress
    spec:
      entryPoints:
        - web
      routes:
        # 这里 'nocobase.local' 应该替换为指向集群 IP 的真实域名
        # 没有域名可验证时，修改本地 host 文件，添加 nocobase.local 指向集群 IP 的记录
        # 浏览器打开 http://nocobase.local 即可访问集群里的 NocoBase 应用
        - match: Host(`nocobase.local`)
          kind: Rule
          services:
            # 这个 Service 是前面 “应用部署” 小节中部署 nocobase 应用时创建的 Service
            - name: nocobase
              port: 13000
    ```

2. 运行 `kubectl` 命令部署 NocoBase 应用的 Ingress。

    ```bash
    kubectl apply -f nocobase-ingress.yaml
    ```

### Ingress-Nginx

大部分 K8S 集群安装的 Ingress Controller 组件是 Ingress-Nginx，下面是一份基于 Ingress-Nginx 的 `nocobase-ingress.yaml` 文件：

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
  name: nocobase-ingress
spec:
  rules:
    # 这里 'nocobase.local' 应该替换为指向集群 IP 的真实域名
    # 没有域名可验证时，修改本地 host 文件，添加 nocobase.local 指向集群 IP 的记录
    # 浏览器打开 http://nocobase.local 即可访问集群里的 Nocobase 应用
    - host: nocobase.local
      http:
        paths:
          - backend:
              serviceName: nocobase
              servicePort: 13000
```

## 使用 Helm Charts

我们编写了 Nocobase 应用的 Helm Charts，可以使用 Helm CLI 在 K8S 中部署 NocoBase 应用服务。

### 准备工作

确保操作环境中已经安装了 `kubectl`、`helm` 等客户端，并确认 `kubectl` 能正确连接到目标集群。

### 添加仓库

添加 NocoBase Helm Charts 的仓库：

```bash
# 添加 NocoBase 的 Helm Charts 仓库
helm repo add nocobase https://nocobase.github.io/helm-charts

# 更新 Helm 索引
helm repo update
```

### Helm 部署

1.  创建 `values.yaml` 文件。

    ```yaml
    persistent:
      # NocoBase 集群共享存储需要的大小
      size: 10Gi
      # 云服务 K8S 提供的存储服务类
      # 这里和 “应用部署” 小节一样使用主节点 NFS 服务所以显式指定为空
      storageClassName: ""

    configMap:
      data:
        TZ: Asia/Shanghai
        # 下面数据库和 Redis 配置使用的是 “K8S 中间件部署” 文档在集群里的 PostgreSQL 服务和 Redis 服务
        # 如果目标环境已经存在其他现成的数据库和 Redis 服务，修改下面对应的数据库和 Redis 的相关配置即可
        CACHE_DEFAULT_STORE: redis
        # 使用环境已有或者自己部署的 Redis 服务
        CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
        PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
        LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
        # 使用环境已有或者自己部署的 PostgreSQL 服务
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

        # ... 其他环境变量
    ```

2.  运行 `helm install` 命令开始安装。

    ```bash
    helm install nocobase nocobase/nocobase --values values.yaml
    ```
