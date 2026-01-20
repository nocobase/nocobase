
:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::


# Kubernetes デプロイ

本記事では、Kubernetes環境にNocoBaseをクラスターモードで迅速にデプロイする方法を解説します。読者の皆様がKubernetes環境に精通しており、[準備作業](./preparations.md)を完了していることを前提としています。

:::info{title="ヒント"}
Kubernetesのデプロイプロセスを迅速に検証するため、本記事ではシングルノードのK3Sクラスター（OS: Ubuntu）を動作環境としています。このガイドは標準的なKubernetesクラスターにも適用可能です。もし標準Kubernetesクラスターでのデプロイ時に本記事と異なる状況が発生した場合は、ぜひお知らせください。
:::

## クラスター環境

すでにKubernetesクラスター環境をお持ちの場合は、このステップをスキップしてください。

Debian / Ubuntuがインストールされたサーバーを1台用意し、その上でK3Sクラスターをシングルノードモードで実行します。K3Sの詳細については、[K3S公式サイト](https://docs.k3s.io/)をご覧ください。

手順は以下の通りです。

1.  サーバーにSSHでログインします。
2.  サーバー上で公式スクリプトを使用してK3Sクラスターのマスターノードをインストールします。

```bash
# インストール後、デフォルトのkubeconfigファイルは /etc/rancher/k3s/k3s.yaml です。
curl -sfL https://get.k3s.io | sh -
```

```bash
# 設定が正しいか確認します。
kubectl get node
```

## クラスターアプリケーションのデプロイ

KubernetesクラスターにNocoBaseアプリケーションをクラスターモードでデプロイします。

### 環境変数

通常、環境変数はアプリケーションのデプロイ設定ファイルから分離すべきです。本記事ではConfigMapを例として構成しますが、実際のプロダクション環境では、機密情報をさらに分離するためにSecretsを使用することもできます。

手順は以下の通りです。

1.  `nocobase-cm.yaml` ファイルを作成します。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nocobase-config
data:
  # タイムゾーンを設定します。例: UTC, Asia/Shanghai
  TZ: Asia/Shanghai
  # 以下のデータベースおよびRedisの設定は、「Kubernetesミドルウェアデプロイ」ドキュメントでクラスター内にデプロイされたPostgreSQLサービスとRedisサービスを使用しています。
  # ターゲット環境に既存のデータベースやRedisサービスがある場合は、以下の対応する設定を変更してください。
  CACHE_DEFAULT_STORE: redis
  # 既存または自身でデプロイしたRedisサービスを使用します。
  CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
  PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
  LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
  # 既存または自身でデプロイしたPostgreSQLサービスを使用します。
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

  # ... その他の環境変数
```

2.  `kubectl` コマンドを実行してConfigMapをデプロイします。

```bash
kubectl apply -f nocobase-cm.yaml
```

### 共有ストレージ

クラスターモードでデプロイされたNocoBaseアプリケーションの異なるノードは、同じストレージディレクトリ（`storage`）をマウントする必要があります。そのためには、複数のノードからの読み書き（ReadWriteMany）をサポートする永続ボリューム（Persistent Volume）を作成する必要があります。通常、クラウドプロバイダーのプラットフォームでクラウドディスクを作成し、PVとしてバインドするか、NFSなどの他の方法で共有ストレージディレクトリをマウントすることができます。

### アプリケーションのデプロイ

最初のデプロイでは、まず1つのノードから開始し、完了後に複数のノードにスケールアップしてください。

1.  `nocobase-apps.yaml` ファイルを作成します。

```yaml
# PVCを作成します。このDeploymentによってデプロイされる複数のPodは、このPVCを介して同じ永続ストレージディレクトリをマウントします。
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
  storageClassName: "" # 例ではマスターノードのNFSサービスを使用しているため、デフォルトのStorageClassの使用を避けるために明示的に空に設定しています。
---
# アプリケーションのService。Ingressにバインドされた後、クラスター外部にサービスを提供します。
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
# アプリケーションのDeployment。複数のアプリケーションコンテナをデプロイできます。
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nocobase
spec:
  replicas: 1 # 最初のデプロイではノードは1つのみです。
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
          # 環境変数は、以前にデプロイしたConfigMapからロードされます。
          envFrom:
            - configMapRef:
                name: nocobase-config
          volumeMounts:
            - name: nocobase-data
              mountPath: /app/nocobase/storage
          # サービスの実行リソース要求と制限を宣言します。
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          # サービス生存性プローブコマンド。クラスターはこのコマンドを使用して、Podを再起動する必要があるかどうかを判断します。
          livenessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 60
          # サービス可用性プローブコマンド。クラスターはこのコマンドを使用して、ServiceトラフィックをPodにルーティングするかどうかを判断します。
          readinessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 30
      # PVCを介して永続ストレージをマウントします。
      volumes:
        - name: nocobase-data
          persistentVolumeClaim:
            claimName: nocobase-pvc
```

2.  `kubectl` コマンドを実行してNocoBaseアプリケーションサービスをデプロイします。

```bash
kubectl apply -f nocobase-apps.yaml
```

3.  NocoBaseアプリケーションサービスのステータスを確認します。

```bash
# NocoBaseサービスのPodステータスを確認します。
kubectl get pods -l app=nocobase
```

出力例は以下の通りです。`STATUS`が`Running`の場合、サービスが正常に起動していることを示します。

```text
NAME                        READY   STATUS    RESTARTS   AGE
nocobase-5558b774d7-w6swf   1/1     Running   0          7h6m
```

4.  アプリケーションの初回起動時には、管理画面で以下のプラグインを手動で有効にする必要があります。

-   @nocobase/plugin-sync-adapter-redis
-   @nocobase/plugin-lock-adapter-redis

その後、スケールアップを行います。例えば、4つのノードにスケールアップするには、次のようにします。

```bash
kubectl scale deployment nocobase --replicas=4
```

## アプリケーションの変更

アプリケーションの変更とは、以下の状況を指します。

-   アプリケーションバージョンのアップグレード
-   新しいプラグインのインストール
-   プラグインの有効化

NocoBaseは、上記のシナリオにおけるクラスター内の複数インスタンス間での変更の自動同期をまだサポートしていません。そのため、以下の手順に従って手動で処理する必要があります。以下の手順はアプリケーションサービスの変更のみを対象としています。変更を行う前に、ご自身でデータベースと永続ストレージのバックアップを必ず行ってください。

### アプリケーションバージョンのローリングアップグレード

1.  `kubectl set image` コマンドを実行して、Deploymentのコンテナイメージバージョンを変更します。

    ```bash
    kubectl set image deployment/nocobase nocobase=nocobase/nocobase:1.7
    ```

2.  ローリングアップデートのステータスを確認します。

    ```bash
    # Deployment全体のローリングアップデートの進捗を確認します。
    kubectl rollout status deployment/nocobase

    # 各Podのステータスを確認します。
    kubectl get pods -l app=nocobase
    ```

アプリケーションバージョンのアップグレード中またはアップグレード後に異常が発見され、バージョンをロールバックする必要がある場合は、以下のコマンドを実行してコンテナイメージバージョンをロールバックしてください。

```bash
kubectl rollout undo deployment/nocobase
```

### アプリケーションのGraceful Restart

新しいプラグインをインストールまたは有効化した後、アプリケーションの設定や状態を更新する必要があります。以下のコマンドを使用して、各PodをGraceful Restartできます。

1.  `kubectl rollout restart` コマンドを実行します。

    ```bash
    kubectl rollout restart deployment/nocobase
    ```

2.  ローリングリスタートのステータスを確認します。

    ```bash
    # Deployment全体の再起動の進捗を確認します。
    kubectl rollout status deployment/nocobase

    # 各Podのステータスを確認します。
    kubectl get pods -l app=nocobase
    ```

## アプリケーションゲートウェイ

Kubernetesクラスターにデプロイされたアプリケーションを外部からアクセス可能にするには、アプリケーションのServiceにIngressをバインドする必要があります。本記事で使用しているクラスター環境はK3Sであり、K3SにはデフォルトでIngress ControllerコンポーネントとしてTraefikがインストールされています。

### Traefik IngressRoute

手順は以下の通りです。

1.  `nocobase-ingress.yaml` ファイルを作成します。

    ```yaml
    apiVersion: traefik.containo.us/v1alpha1
    kind: IngressRoute
    metadata:
      name: nocobase-ingress
    spec:
      entryPoints:
        - web
      routes:
        # ここで「nocobase.local」は、クラスターのIPを指す実際のドメイン名に置き換える必要があります。
        # 検証用のドメインがない場合は、ローカルのhostsファイルを変更し、nocobase.localがクラスターのIPを指すレコードを追加してください。
        # その後、ブラウザで http://nocobase.local を開くと、クラスター内のNocoBaseアプリケーションにアクセスできます。
        - match: Host(`nocobase.local`)
          kind: Rule
          services:
            # このServiceは、上記の「アプリケーションのデプロイ」セクションでnocobaseアプリケーションをデプロイした際に作成されたServiceです。
            - name: nocobase
              port: 13000
    ```

2.  `kubectl` コマンドを実行してNocoBaseアプリケーションのIngressをデプロイします。

    ```bash
    kubectl apply -f nocobase-ingress.yaml
    ```

### Ingress-Nginx

ほとんどのKubernetesクラスターでは、Ingress ControllerコンポーネントとしてIngress-Nginxがインストールされています。以下は、Ingress-Nginxに基づいた`nocobase-ingress.yaml`ファイルです。

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
  name: nocobase-ingress
spec:
  rules:
    # ここで「nocobase.local」は、クラスターのIPを指す実際のドメイン名に置き換える必要があります。
    # 検証用のドメインがない場合は、ローカルのhostsファイルを変更し、nocobase.localがクラスターのIPを指すレコードを追加してください。
    # その後、ブラウザで http://nocobase.local を開くと、クラスター内のNocoBaseアプリケーションにアクセスできます。
    - host: nocobase.local
      http:
        paths:
          - backend:
              serviceName: nocobase
              servicePort: 13000
```

## Helm Charts の使用

NocoBaseアプリケーション用のHelm Chartsを作成しました。Helm CLIを使用して、KubernetesにNocoBaseアプリケーションサービスをデプロイできます。

### 前提条件

動作環境に`kubectl`や`helm`などのクライアントがインストールされており、`kubectl`がターゲットクラスターに正しく接続できることを確認してください。

### リポジトリの追加

NocoBase Helm Chartsのリポジトリを追加します。

```bash
# NocoBaseのHelm Chartsリポジトリを追加します。
helm repo add nocobase https://nocobase.github.io/helm-charts

# Helmインデックスを更新します。
helm repo update
```

### Helmによるデプロイ

1.  `values.yaml` ファイルを作成します。

    ```yaml
    persistent:
      # NocoBaseクラスターの共有ストレージに必要なサイズ
      size: 10Gi
      # クラウドサービスのKubernetesが提供するストレージクラス
      # 「アプリケーションのデプロイ」セクションと同様に、マスターノードのNFSサービスを使用するため、明示的に空に設定しています。
      storageClassName: ""

    configMap:
      data:
        # タイムゾーンを設定します。例: UTC, Asia/Shanghai
        TZ: Asia/Shanghai
        # 以下のデータベースおよびRedisの設定は、「Kubernetesミドルウェアデプロイ」ドキュメントでクラスター内にデプロイされたPostgreSQLサービスとRedisサービスを使用しています。
        # ターゲット環境に既存のデータベースやRedisサービスがある場合は、以下の対応する設定を変更してください。
        CACHE_DEFAULT_STORE: redis
        # 既存または自身でデプロイしたRedisサービスを使用します。
        CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
        PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
        LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
        # 既存または自身でデプロイしたPostgreSQLサービスを使用します。
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

        # ... その他の環境変数
    ```

2.  `helm install` コマンドを実行してインストールを開始します。

    ```bash
    helm install nocobase nocobase/nocobase --values values.yaml
    ```