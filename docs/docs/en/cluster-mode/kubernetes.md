# Kubernetes Deployment

This article aims to guide users in quickly deploying NocoBase in cluster mode in a Kubernetes environment. It assumes that the reader is familiar with Kubernetes and has completed the steps in [Preparations](./preparations.md).

:::info{title="Tip"}
To quickly verify the Kubernetes deployment process, the operating environment in this article is a single-node K3s cluster (OS: Ubuntu). This guide is also applicable to standard Kubernetes clusters. If you encounter any discrepancies when deploying on a standard Kubernetes cluster, please let us know.
:::

## Cluster Environment

If you already have a Kubernetes cluster environment, you can skip this step.

Prepare a server with Debian / Ubuntu installed and run a K3s cluster in single-node mode on it. To learn more about K3s, visit the [official K3s website](https://docs.k3s.io/).

Steps:

1. SSH into the server.
2. Use the official script to install the K3s cluster master node on the server.

```bash
# After installation, the default kubeconfig file is /etc/rancher/k3s/k3s.yaml
curl -sfL https://get.k3s.io | sh -
```

```bash
# Verify that the configuration is correct
kubectl get node
```

## Cluster Application Deployment

Deploy the NocoBase application in cluster mode on a Kubernetes cluster.

### Environment Variables

Typically, environment variables should be separated from the application deployment configuration file. This article uses a ConfigMap as an example. In a production environment, you can use Secrets to further separate sensitive information.

Steps:

1. Create a `nocobase-cm.yaml` file.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nocobase-config
data:
  # Set your timezone, e.g., UTC, America/New_York
  TZ: UTC
  # The database and Redis configurations below use the PostgreSQL and Redis services in the cluster from the "Kubernetes Middleware Deployment" document.
  # If your environment already has existing database and Redis services, modify the corresponding configurations below.
  CACHE_DEFAULT_STORE: redis
  # Use an existing or self-deployed Redis service.
  CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
  PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
  LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
  # Use an existing or self-deployed PostgreSQL service.
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

  # ... other environment variables
```

2. Run the `kubectl` command to deploy the ConfigMap.

```bash
kubectl apply -f nocobase-cm.yaml
```

### Shared Storage

Different nodes of a NocoBase application deployed in cluster mode need to mount the same storage directory (`storage`). To achieve this, you need to create a Persistent Volume (PV) that supports read-write access from multiple nodes (ReadWriteMany). Typically, you would create a cloud disk on your cloud provider's platform and bind it as a PV, or you can mount a shared storage directory using other methods like NFS.

### Application Deployment

For the initial deployment, start with a single node. After it's complete, you can scale up to multiple nodes.

1. Create a `nocobase-apps.yaml` file.

```yaml
# Create a PVC. Multiple Pods deployed by the Deployment below will mount the same persistent storage directory through this PVC.
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
  storageClassName: "" # Explicitly set to empty as the example uses the master node's NFS service, avoiding the default StorageClass.
---
# The application's Service, which provides services outside the cluster after being bound to an Ingress.
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
# The application's Deployment, which can deploy multiple application containers.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nocobase
spec:
  replicas: 1 # Initial deployment with only one node.
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
          # Load environment variables from the previously deployed ConfigMap.
          envFrom:
            - configMapRef:
                name: nocobase-config
          volumeMounts:
            - name: nocobase-data
              mountPath: /app/nocobase/storage
          # Declare resource requests and limits for the service.
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          # Liveness probe command. The cluster uses this to determine if the Pod needs to be restarted.
          livenessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 60
          # Readiness probe command. The cluster uses this to determine whether to direct Service traffic to the Pod.
          readinessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 30
      # Mount persistent storage via PVC.
      volumes:
        - name: nocobase-data
          persistentVolumeClaim:
            claimName: nocobase-pvc
```

2. Run the `kubectl` command to deploy the NocoBase application service.

```bash
kubectl apply -f nocobase-apps.yaml
```

3. Verify the status of the NocoBase application service.

```bash
# Check the Pod status of the NocoBase service
kubectl get pods -l app=nocobase
```

The example output is as follows. A `STATUS` of `Running` indicates that the service has started successfully:

```text
NAME                        READY   STATUS    RESTARTS   AGE
nocobase-5558b774d7-w6swf   1/1     Running   0          7h6m
```

4. On the first startup, you need to manually enable the following plugins in the admin interface:

- @nocobase/plugin-sync-adapter-redis
- @nocobase/plugin-lock-adapter-redis

After that, you can scale up. For example, to scale to 4 nodes:

```bash
kubectl scale deployment nocobase --replicas=4
```

## Application Changes

Application changes refer to the following situations:

- Upgrading the application version
- Installing new plugins
- Activating plugins

NocoBase does not yet support automatic synchronization of changes across multiple instances in a cluster for the scenarios above. Therefore, you need to handle them manually by following the steps below. These steps only involve changes to the application service. Before making any changes, please back up your database and persistent storage yourself.

### Application Version Rolling Upgrade

1. Run the `kubectl set image` command to change the Deployment's container image version.

    ```bash
    kubectl set image deployment/nocobase nocobase=nocobase/nocobase:1.7
    ```

2. Check the rolling update status.

    ```bash
    # Check the overall rolling update progress of the Deployment
    kubectl rollout status deployment/nocobase

    # Check the status of each Pod
    kubectl get pods -l app=nocobase
    ```

If you encounter any issues during or after the application version upgrade and need to roll back, execute the following command to roll back the container image version:

```bash
kubectl rollout undo deployment/nocobase
```

### Graceful Application Restart

After installing or activating new plugins, you need to refresh the application configuration or state. You can use the following command to gracefully restart each Pod.

1. Run the `kubectl rollout restart` command.

    ```bash
    kubectl rollout restart deployment/nocobase
    ```

2. Check the rolling restart status.

    ```bash
    # Check the overall restart progress of the Deployment
    kubectl rollout status deployment/nocobase

    # Check the status of each Pod
    kubectl get pods -l app=nocobase
    ```

## Application Gateway

To make an application deployed in a Kubernetes cluster accessible from the outside, you need to bind an Ingress to the application's Service. The cluster environment used in this article is K3s, which comes with Traefik as the default Ingress Controller.

### Traefik IngressRoute

Steps:

1. Create a `nocobase-ingress.yaml` file.

    ```yaml
    apiVersion: traefik.containo.us/v1alpha1
    kind: IngressRoute
    metadata:
      name: nocobase-ingress
    spec:
      entryPoints:
        - web
      routes:
        # Here, 'nocobase.local' should be replaced with a real domain name pointing to the cluster's IP.
        # If you don't have a domain for verification, you can modify your local hosts file to add a record for nocobase.local pointing to the cluster's IP.
        # You can then access the NocoBase application in the cluster by opening http://nocobase.local in your browser.
        - match: Host(`nocobase.local`)
          kind: Rule
          services:
            # This is the Service created when deploying the nocobase application in the "Application Deployment" section above.
            - name: nocobase
              port: 13000
    ```

2. Run the `kubectl` command to deploy the Ingress for the NocoBase application.

    ```bash
    kubectl apply -f nocobase-ingress.yaml
    ```

### Ingress-Nginx

Most Kubernetes clusters use Ingress-Nginx as the Ingress Controller. Below is a `nocobase-ingress.yaml` file based on Ingress-Nginx:

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
  name: nocobase-ingress
spec:
  rules:
    # Here, 'nocobase.local' should be replaced with a real domain name pointing to the cluster's IP.
    # If you don't have a domain for verification, you can modify your local hosts file to add a record for nocobase.local pointing to the cluster's IP.
    # You can then access the NocoBase application in the cluster by opening http://nocobase.local in your browser.
    - host: nocobase.local
      http:
        paths:
          - backend:
              serviceName: nocobase
              servicePort: 13000
```

## Using Helm Charts

We have created Helm Charts for the NocoBase application, allowing you to deploy the NocoBase application service in Kubernetes using the Helm CLI.

### Prerequisites

Ensure that clients like `kubectl` and `helm` are installed in your operating environment and that `kubectl` can connect to the target cluster correctly.

### Add Repository

Add the NocoBase Helm Charts repository:

```bash
# Add the NocoBase Helm Charts repository
helm repo add nocobase https://nocobase.github.io/helm-charts

# Update the Helm index
helm repo update
```

### Helm Deployment

1.  Create a `values.yaml` file.

    ```yaml
    persistent:
      # The required size for NocoBase cluster shared storage
      size: 10Gi
      # The storage class provided by the cloud service's Kubernetes
      # Same as in the "Application Deployment" section, this is explicitly set to empty because it uses the master node's NFS service.
      storageClassName: ""

    configMap:
      data:
        # Set your timezone, e.g., UTC, America/New_York
        TZ: UTC
        # The database and Redis configurations below use the PostgreSQL and Redis services in the cluster from the "Kubernetes Middleware Deployment" document.
        # If your environment already has existing database and Redis services, modify the corresponding configurations below.
        CACHE_DEFAULT_STORE: redis
        # Use an existing or self-deployed Redis service.
        CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
        PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
        LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
        # Use an existing or self-deployed PostgreSQL service.
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

        # ... other environment variables
    ```

2.  Run the `helm install` command to start the installation.

    ```bash
    helm install nocobase nocobase/nocobase --values values.yaml
    ```