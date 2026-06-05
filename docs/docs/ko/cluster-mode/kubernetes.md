
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::


# Kubernetes 배포

이 문서는 K8S 환경에서 NocoBase를 클러스터 모드로 빠르게 배포하는 방법을 안내합니다. 독자가 K8S 환경에 익숙하고 [준비 작업](./preparations.md)을 완료했다고 가정합니다.

:::info{title="팁"}
K8S 배포 프로세스를 빠르게 확인하기 위해, 이 문서에서는 단일 노드 K3S 클러스터(운영체제: Ubuntu) 환경을 사용합니다. 이 가이드는 표준 K8S 클러스터에서도 동일하게 적용됩니다. 표준 K8S 클러스터에 배포 시 이 문서와 다른 상황이 발생하면 저희에게 알려주세요.
:::

## 클러스터 환경

이미 Kubernetes 클러스터 환경이 구축되어 있다면 이 단계를 건너뛸 수 있습니다.

Debian / Ubuntu가 설치된 서버를 준비하고, 해당 서버에 K3S 클러스터를 단일 노드 모드로 실행합니다. K3S에 대해 더 알아보려면 [K3S 공식 웹사이트](https://docs.k3s.io/zh/)를 방문하세요.

단계는 다음과 같습니다:

1.  서버에 SSH로 로그인합니다.
2.  서버에서 공식 스크립트를 사용하여 K3S 클러스터 마스터 노드를 설치합니다.

```bash
# 설치 후 기본 kubeconfig 파일은 /etc/rancher/k3s/k3s.yaml 입니다.
curl -sfL https://get.k3s.io | sh -
```

```bash
# 설정이 올바른지 확인합니다.
kubectl get node
```

## 클러스터 애플리케이션 배포

Kubernetes 클러스터에 NocoBase 애플리케이션을 클러스터 모드로 배포합니다.

### 환경 변수

일반적으로 환경 변수는 애플리케이션 배포 구성 파일에서 분리해야 합니다. 이 문서에서는 ConfigMap을 예시로 구성하며, 실제 프로덕션 환경에서는 Secrets를 추가하여 민감한 정보를 더욱 분리할 수 있습니다.

단계는 다음과 같습니다:

1.  `nocobase-cm.yaml` 파일을 생성합니다.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nocobase-config
data:
  TZ: Asia/Shanghai
  # 아래 데이터베이스 및 Redis 설정은 "K8S 미들웨어 배포" 문서에 있는 클러스터 내 PostgreSQL 서비스와 Redis 서비스를 사용합니다.
  # 대상 환경에 이미 다른 데이터베이스 및 Redis 서비스가 있다면, 아래 해당 데이터베이스 및 Redis 관련 설정을 수정하면 됩니다.
  CACHE_DEFAULT_STORE: redis
  # 환경에 이미 있거나 직접 배포한 Redis 서비스를 사용합니다.
  CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
  PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
  LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
  # 환경에 이미 있거나 직접 배포한 PostgreSQL 서비스를 사용합니다.
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

  # ... 기타 환경 변수
```

2.  `kubectl` 명령을 실행하여 ConfigMap을 배포합니다.

```bash
kubectl apply -f nocobase-cm.yaml
```

### 공유 스토리지

클러스터 모드로 배포된 NocoBase 애플리케이션의 여러 노드는 동일한 스토리지 디렉터리(storage)를 마운트해야 합니다. 이를 위해 여러 노드에서 읽기/쓰기를 지원하는 영구 볼륨(Persistent Volume)을 생성해야 합니다. 일반적으로 클라우드 서비스 제공업체 플랫폼에서 클라우드 디스크를 생성하고 PV로 바인딩해야 하며, NFS와 같은 다른 방법으로 공유 스토리지 디렉터리를 마운트할 수도 있습니다.

### 애플리케이션 배포

애플리케이션을 처음 배포할 때는 단일 노드부터 시작하고, 완료된 후 여러 노드로 스케일 업(scale up)할 수 있습니다.

1.  `nocobase-apps.yaml` 파일을 생성합니다.

```yaml
# PVC를 생성합니다. 아래 Deployment에 의해 배포되는 여러 Pod는 이 PVC를 통해 동일한 영구 스토리지 디렉터리를 마운트합니다.
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
  storageClassName: "" # 예시에서는 마스터 노드의 NFS 서비스를 사용하므로 기본 StorageClass를 사용하지 않도록 명시적으로 비워둡니다.
---
# 애플리케이션 서비스는 Ingress에 바인딩된 후 클러스터 외부로 서비스를 제공합니다.
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
# 애플리케이션 Deployment는 여러 애플리케이션 컨테이너를 배포할 수 있습니다.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nocobase
spec:
  replicas: 1 # 첫 배포 시에는 단일 노드만 사용합니다.
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
          # 환경 변수는 이전에 배포된 ConfigMap에서 로드됩니다.
          envFrom:
            - configMapRef:
                name: nocobase-config
          volumeMounts:
            - name: nocobase-data
              mountPath: /app/nocobase/storage
          # 서비스 실행에 필요한 리소스 요청 및 제한을 선언합니다.
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          # 서비스 활성 프로브(liveness probe) 명령입니다. 클러스터는 이 명령을 통해 Pod를 재시작해야 하는지 판단합니다.
          livenessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 60
          # 서비스 준비 프로브(readiness probe) 명령입니다. 클러스터는 이 명령을 통해 Service 트래픽을 Pod로 전달할지 판단합니다.
          readinessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 30
      # PVC를 통해 영구 스토리지를 마운트합니다.
      volumes:
        - name: nocobase-data
          persistentVolumeClaim:
            claimName: nocobase-pvc
```

2.  `kubectl` 명령을 실행하여 NocoBase 애플리케이션 서비스를 배포합니다.

```bash
kubectl apply -f nocobase-apps.yaml
```

3.  NocoBase 애플리케이션 서비스 상태를 확인합니다.

```bash
# NocoBase 서비스의 Pod 상태를 확인합니다.
kubectl get pods -l app=nocobase
```

예시 출력은 다음과 같습니다. `STATUS`가 `Running`일 때 서비스가 성공적으로 시작되었음을 나타냅니다:

```text
NAME                        READY   STATUS    RESTARTS   AGE
nocobase-5558b774d7-w6swf   1/1     Running   0          7h6m
```

4.  애플리케이션을 처음 시작할 때는 관리 인터페이스에서 다음 플러그인들을 수동으로 활성화해야 합니다:

-   @nocobase/plugin-sync-adapter-redis
-   @nocobase/plugin-lock-adapter-redis

그 후에 스케일 업을 진행합니다. 예를 들어, 4개 노드로 스케일 업하려면:

```bash
kubectl scale deployment nocobase --replicas=4
```

## 애플리케이션 변경

애플리케이션 변경은 다음 상황들을 의미합니다:

-   애플리케이션 버전 업그레이드
-   새 플러그인 설치
-   플러그인 활성화

NocoBase는 위 시나리오에서 클러스터의 여러 인스턴스 간 변경 사항 자동 동기화를 아직 지원하지 않습니다. 따라서 다음 단계를 따라 수동으로 처리해야 합니다. 아래 단계는 애플리케이션 서비스 변경에만 해당됩니다. 변경 전에 데이터베이스 백업 및 영구 스토리지 백업을 직접 수행해 주세요.

### 애플리케이션 버전 롤링 업그레이드

1.  `kubectl set image` 명령을 실행하여 Deployment 컨테이너 이미지 버전을 수정합니다.

    ```bash
    kubectl set image deployment/nocobase nocobase=nocobase/nocobase:1.7
    ```

2.  롤링 업데이트 상태를 확인합니다.

    ```bash
    # Deployment의 전체 롤링 업데이트 진행 상황을 확인합니다.
    kubectl rollout status deployment/nocobase

    # 각 Pod의 상태를 확인합니다.
    kubectl get pods -l app=nocobase
    ```

애플리케이션 버전 업그레이드 중 또는 업그레이드 후 이상이 발견되어 버전을 롤백해야 하는 경우, 아래 명령을 실행하여 컨테이너 이미지 버전을 롤백합니다:

```bash
kubectl rollout undo deployment/nocobase
```

### 애플리케이션 무중단 재시작

새 플러그인을 설치하거나 플러그인을 활성화한 후에는 애플리케이션 구성 또는 상태를 새로 고쳐야 합니다. 아래 명령을 사용하여 각 Pod를 무중단 재시작할 수 있습니다.

1.  `kubectl rollout restart` 명령을 실행합니다.

    ```bash
    kubectl rollout restart deployment/nocobase
    ```

2.  롤링 재시작 상태를 확인합니다.

    ```bash
    # Deployment의 전체 재시작 진행 상황을 확인합니다.
    kubectl rollout status deployment/nocobase

    # 각 Pod의 상태를 확인합니다.
    kubectl get pods -l app=nocobase
    ```

## 애플리케이션 게이트웨이

K8S 클러스터에 배포된 애플리케이션이 외부에서 접근 가능하도록 하려면, 애플리케이션 Service에 Ingress를 바인딩해야 합니다. 이 문서에서 사용된 클러스터 환경은 K3S이며, K3S에 기본으로 설치된 Ingress Controller 컴포넌트는 Traefik입니다.

### Traefik IngressRoute

단계는 다음과 같습니다:

1.  `nocobase-ingress.yaml` 파일을 생성합니다.

    ```yaml
    apiVersion: traefik.containo.us/v1alpha1
    kind: IngressRoute
    metadata:
      name: nocobase-ingress
    spec:
      entryPoints:
        - web
      routes:
        # 여기서 'nocobase.local'은 클러스터 IP를 가리키는 실제 도메인 이름으로 대체되어야 합니다.
        # 확인할 도메인이 없는 경우, 로컬 hosts 파일을 수정하여 nocobase.local이 클러스터 IP를 가리키도록 레코드를 추가하세요.
        # 브라우저에서 http://nocobase.local을 열면 클러스터 내 NocoBase 애플리케이션에 접근할 수 있습니다.
        - match: Host(`nocobase.local`)
          kind: Rule
          services:
            # 이 Service는 앞서 "애플리케이션 배포" 섹션에서 NocoBase 애플리케이션을 배포할 때 생성된 Service입니다.
            - name: nocobase
              port: 13000
    ```

2.  `kubectl` 명령을 실행하여 NocoBase 애플리케이션의 Ingress를 배포합니다.

```bash
kubectl apply -f nocobase-ingress.yaml
```

### Ingress-Nginx

대부분의 K8S 클러스터에 설치된 Ingress Controller 컴포넌트는 Ingress-Nginx입니다. 아래는 Ingress-Nginx 기반의 `nocobase-ingress.yaml` 파일입니다:

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
  name: nocobase-ingress
spec:
  rules:
    # 여기서 'nocobase.local'은 클러스터 IP를 가리키는 실제 도메인 이름으로 대체되어야 합니다.
    # 확인할 도메인이 없는 경우, 로컬 hosts 파일을 수정하여 nocobase.local이 클러스터 IP를 가리키도록 레코드를 추가하세요.
    # 브라우저에서 http://nocobase.local을 열면 클러스터 내 NocoBase 애플리케이션에 접근할 수 있습니다.
    - host: nocobase.local
      http:
        paths:
          - backend:
              serviceName: nocobase
              servicePort: 13000
```

## Helm Charts 사용하기

저희는 NocoBase 애플리케이션용 Helm Charts를 작성했습니다. Helm CLI를 사용하여 K8S에 NocoBase 애플리케이션 서비스를 배포할 수 있습니다.

### 준비 작업

작업 환경에 `kubectl`, `helm` 등의 클라이언트가 설치되어 있는지 확인하고, `kubectl`이 대상 클러스터에 올바르게 연결되는지 확인하세요.

### 저장소 추가

NocoBase Helm Charts 저장소를 추가합니다:

```bash
# NocoBase의 Helm Charts 저장소를 추가합니다.
helm repo add nocobase https://nocobase.github.io/helm-charts

# Helm 인덱스를 업데이트합니다.
helm repo update
```

### Helm 배포

1.  `values.yaml` 파일을 생성합니다.

    ```yaml
    persistent:
      # NocoBase 클러스터 공유 스토리지에 필요한 크기
      size: 10Gi
      # 클라우드 서비스 K8S에서 제공하는 스토리지 서비스 클래스
      # 여기서는 "애플리케이션 배포" 섹션과 동일하게 마스터 노드의 NFS 서비스를 사용하므로 명시적으로 비워둡니다.
      storageClassName: ""

    configMap:
      data:
        TZ: Asia/Shanghai
        # 아래 데이터베이스 및 Redis 설정은 "K8S 미들웨어 배포" 문서에 있는 클러스터 내 PostgreSQL 서비스와 Redis 서비스를 사용합니다.
        # 대상 환경에 이미 다른 데이터베이스 및 Redis 서비스가 있다면, 아래 해당 데이터베이스 및 Redis 관련 설정을 수정하면 됩니다.
        CACHE_DEFAULT_STORE: redis
        # 환경에 이미 있거나 직접 배포한 Redis 서비스를 사용합니다.
        CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
        PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
        LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
        # 환경에 이미 있거나 직접 배포한 PostgreSQL 서비스를 사용합니다.
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

        # ... 기타 환경 변수
    ```

2.  `helm install` 명령을 실행하여 설치를 시작합니다.

    ```bash
    helm install nocobase nocobase/nocobase --values values.yaml
    ```