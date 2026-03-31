# Kubernetes-Bereitstellung

Dieser Artikel führt Sie durch die schnelle Bereitstellung von NocoBase im Cluster-Modus in einer Kubernetes-Umgebung. Wir gehen davon aus, dass Sie mit der Kubernetes-Umgebung vertraut sind und die Schritte in den [Vorbereitungen](./preparations.md) bereits abgeschlossen haben.

:::info{title="Tipp"}
Um den Kubernetes-Bereitstellungsprozess schnell zu überprüfen, verwenden wir in diesem Artikel eine Einzelknoten-K3s-Cluster-Umgebung (Betriebssystem: Ubuntu). Diese Anleitung ist auch für Standard-Kubernetes-Cluster anwendbar. Sollten Sie bei der Bereitstellung in einem Standard-Kubernetes-Cluster auf Abweichungen stoßen, die hier nicht beschrieben sind, informieren Sie uns bitte.
:::

## Cluster-Umgebung

Wenn Sie bereits über eine Kubernetes-Cluster-Umgebung verfügen, können Sie diesen Schritt überspringen.

Bereiten Sie einen Server mit installiertem Debian / Ubuntu vor und betreiben Sie darauf einen K3s-Cluster im Einzelknoten-Modus. Um mehr über K3s zu erfahren, besuchen Sie die [offizielle K3s-Website](https://docs.k3s.io/).

Gehen Sie wie folgt vor:

1. Melden Sie sich per SSH auf dem Server an.
2. Installieren Sie den K3s-Cluster-Master-Knoten auf dem Server mithilfe des offiziellen Skripts.

```bash
# Nach der Installation ist die Standard-kubeconfig-Datei /etc/rancher/k3s/k3s.yaml
curl -sfL https://get.k3s.io | sh -
```

```bash
# Überprüfen Sie, ob die Konfiguration korrekt ist
kubectl get node
```

## Bereitstellung der Anwendung im Cluster

Stellen Sie die NocoBase-Anwendung im Cluster-Modus in einem Kubernetes-Cluster bereit.

### Umgebungsvariablen

Normalerweise sollten Umgebungsvariablen von der Konfigurationsdatei der Anwendungsbereitstellung getrennt werden. Dieser Artikel verwendet eine ConfigMap als Beispiel für die Orchestrierung. In einer Produktionsumgebung können Sie Secrets verwenden, um sensible Informationen weiter aufzuteilen.

Gehen Sie wie folgt vor:

1. Erstellen Sie eine Datei mit dem Namen `nocobase-cm.yaml`.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nocobase-config
data:
  TZ: Asia/Shanghai
  # Die unten stehenden Datenbank- und Redis-Konfigurationen verwenden die PostgreSQL- und Redis-Dienste im Cluster aus dem Dokument "K8S Middleware-Bereitstellung".
  # Wenn Ihre Umgebung bereits über bestehende Datenbank- und Redis-Dienste verfügt, passen Sie die entsprechenden Konfigurationen unten an.
  CACHE_DEFAULT_STORE: redis
  # Verwenden Sie einen bestehenden oder selbst bereitgestellten Redis-Dienst.
  CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
  PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
  LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
  # Verwenden Sie einen bestehenden oder selbst bereitgestellten PostgreSQL-Dienst.
  DB_DATABASE: nocobase
  DB_DIALECT: postgres
  DB_HOST: "postgres-0.postgres-service"
  DB_PASSWORD: nocobase123
  DB_PORT: "5432"
  DB_UNDERSCORED: "true"
  DB_USER: nocobase
  # Benutzername der Service-Plattform
  NOCOBASE_PKG_USERNAME: "<your user>"
  # Passwort der Service-Plattform
  NOCOBASE_PKG_PASSWORD: "<your password>"

  # ... weitere Umgebungsvariablen
```

2. Führen Sie den `kubectl`-Befehl aus, um die ConfigMap bereitzustellen.

```bash
kubectl apply -f nocobase-cm.yaml
```

### Gemeinsamer Speicher

Verschiedene Knoten einer NocoBase-Anwendung, die im Cluster-Modus bereitgestellt wird, müssen dasselbe Speicherverzeichnis (`storage`) mounten. Dazu müssen Sie ein Persistentes Volume (PV) erstellen, das Lese- und Schreibzugriff von mehreren Knoten (ReadWriteMany) unterstützt. Normalerweise erstellen Sie dazu eine Cloud-Disk auf der Plattform Ihres Cloud-Anbieters und binden diese als PV, oder Sie können ein gemeinsam genutztes Speicherverzeichnis über andere Methoden wie NFS mounten.

### Anwendungsbereitstellung

Bei der Erstbereitstellung der Anwendung beginnen Sie mit einem einzelnen Knoten. Nach Abschluss können Sie auf mehrere Knoten skalieren.

1. Erstellen Sie eine Datei mit dem Namen `nocobase-apps.yaml`.

```yaml
# Erstellen Sie einen PVC. Mehrere Pods, die durch das unten stehende Deployment bereitgestellt werden, mounten über diesen PVC dasselbe persistente Speicherverzeichnis.
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
  storageClassName: "" # Explizit leer gelassen, da das Beispiel den NFS-Dienst des Master-Knotens verwendet, um die Standard-StorageClass zu vermeiden.
---
# Der Service der Anwendung, der nach der Bindung an einen Ingress Dienste außerhalb des Clusters bereitstellt.
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
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Das Deployment der Anwendung, das mehrere Anwendungscontainer bereitstellen kann.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nocobase
spec:
  replicas: 1 # Erstbereitstellung mit nur einem Knoten.
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
          # Laden Sie Umgebungsvariablen aus der zuvor bereitgestellten ConfigMap.
          envFrom:
            - configMapRef:
                name: nocobase-config
          volumeMounts:
            - name: nocobase-data
              mountPath: /app/nocobase/storage
          # Deklarieren Sie Ressourcenanforderungen und -limits für den Dienst.
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          # Befehl für den Liveness-Probe. Der Cluster verwendet diesen, um zu bestimmen, ob der Pod neu gestartet werden muss.
          livenessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 60
          # Befehl für den Readiness-Probe. Der Cluster verwendet diesen, um zu bestimmen, ob der Service-Traffic zum Pod geleitet werden soll.
          readinessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 30
      # Mounten Sie persistenten Speicher über PVC.
      volumes:
        - name: nocobase-data
          persistentVolumeClaim:
            claimName: nocobase-pvc
```

2. Führen Sie den `kubectl`-Befehl aus, um den NocoBase-Anwendungsdienst bereitzustellen.

```bash
kubectl apply -f nocobase-apps.yaml
```

3. Überprüfen Sie den Status des NocoBase-Anwendungsdienstes.

```bash
# Überprüfen Sie den Pod-Status des NocoBase-Dienstes
kubectl get pods -l app=nocobase
```

Die Beispielausgabe sieht wie folgt aus. Ein `STATUS` von `Running` zeigt an, dass der Dienst erfolgreich gestartet wurde:

```text
NAME                        READY   STATUS    RESTARTS   AGE
nocobase-5558b774d7-w6swf   1/1     Running   0          7h6m
```

4. Beim ersten Start der Anwendung müssen Sie die folgenden **Plugins** in der Admin-Oberfläche manuell aktivieren:

- @nocobase/plugin-sync-adapter-redis
- @nocobase/plugin-lock-adapter-redis

Danach können Sie die Skalierung vornehmen. Zum Beispiel auf 4 Knoten skalieren Sie so:

```bash
kubectl scale deployment nocobase --replicas=4
```

## Anwendungsänderungen

Anwendungsänderungen beziehen sich auf die folgenden Situationen:

- Aktualisierung der Anwendungsversion
- Installation neuer **Plugins**
- Aktivierung von **Plugins**

NocoBase unterstützt derzeit noch keine automatische Synchronisierung von Änderungen über mehrere Cluster-Instanzen hinweg für die oben genannten Szenarien. Daher müssen Sie diese manuell gemäß den folgenden Schritten behandeln. Diese Schritte betreffen nur Änderungen am Anwendungsdienst. Bevor Sie Änderungen vornehmen, sichern Sie bitte Ihre Datenbank und den persistenten Speicher selbst.

### Rolling Upgrade der Anwendungsversion

1. Führen Sie den `kubectl set image`-Befehl aus, um die Container-Image-Version des Deployments zu ändern.

    ```bash
    kubectl set image deployment/nocobase nocobase=nocobase/nocobase:1.7
    ```

2. Überprüfen Sie den Status des Rolling Updates.

    ```bash
    # Überprüfen Sie den gesamten Rolling-Update-Fortschritt des Deployments
    kubectl rollout status deployment/nocobase

    # Überprüfen Sie den Status jedes Pods
    kubectl get pods -l app=nocobase
    ```

Sollten Sie während oder nach dem Upgrade der Anwendungsversion auf Probleme stoßen und ein Rollback der Version benötigen, führen Sie den folgenden Befehl aus, um die Container-Image-Version zurückzusetzen:

```bash
kubectl rollout undo deployment/nocobase
```

### Sanfter Neustart der Anwendung

Nach der Installation oder Aktivierung neuer **Plugins** müssen Sie die Anwendungskonfiguration oder den Status aktualisieren. Sie können den folgenden Befehl verwenden, um jeden Pod sanft neu zu starten.

1. Führen Sie den `kubectl rollout restart`-Befehl aus.

    ```bash
    kubectl rollout restart deployment/nocobase
    ```

2. Überprüfen Sie den Status des Rolling Restarts.

    ```bash
    # Überprüfen Sie den gesamten Rolling-Restart-Fortschritt des Deployments
    kubectl rollout status deployment/nocobase

    # Überprüfen Sie den Status jedes Pods
    kubectl get pods -l app=nocobase
    ```

## Anwendungs-Gateway

Damit eine in einem Kubernetes-Cluster bereitgestellte Anwendung von außen zugänglich ist, müssen Sie einen Ingress an den Service der Anwendung binden. Die in diesem Artikel verwendete Cluster-Umgebung ist K3s, das Traefik als Standard-Ingress-Controller-Komponente mitbringt.

### Traefik IngressRoute

Gehen Sie wie folgt vor:

1. Erstellen Sie eine Datei mit dem Namen `nocobase-ingress.yaml`.

    ```yaml
    apiVersion: traefik.containo.us/v1alpha1
    kind: IngressRoute
    metadata:
      name: nocobase-ingress
    spec:
      entryPoints:
        - web
      routes:
        # Hier sollte 'nocobase.local' durch einen echten Domainnamen ersetzt werden, der auf die IP des Clusters zeigt.
        # Wenn Sie keine Domain zur Überprüfung haben, können Sie Ihre lokale Hosts-Datei ändern und einen Eintrag für nocobase.local hinzufügen, der auf die IP des Clusters zeigt.
        # Sie können dann die NocoBase-Anwendung im Cluster aufrufen, indem Sie http://nocobase.local in Ihrem Browser öffnen.
        - match: Host(`nocobase.local`)
          kind: Rule
          services:
            # Dies ist der Service, der bei der Bereitstellung der NocoBase-Anwendung im Abschnitt "Anwendungsbereitstellung" erstellt wurde.
            - name: nocobase
              port: 13000
    ```

2. Führen Sie den `kubectl`-Befehl aus, um den Ingress für die NocoBase-Anwendung bereitzustellen.

```bash
kubectl apply -f nocobase-ingress.yaml
```

### Ingress-Nginx

Die meisten Kubernetes-Cluster verwenden Ingress-Nginx als Ingress-Controller. Unten finden Sie eine `nocobase-ingress.yaml`-Datei, die auf Ingress-Nginx basiert:

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
  name: nocobase-ingress
spec:
  rules:
    # Hier sollte 'nocobase.local' durch einen echten Domainnamen ersetzt werden, der auf die IP des Clusters zeigt.
    # Wenn Sie keine Domain zur Überprüfung haben, können Sie Ihre lokale Hosts-Datei ändern und einen Eintrag für nocobase.local hinzufügen, der auf die IP des Clusters zeigt.
    # Sie können dann die NocoBase-Anwendung im Cluster aufrufen, indem Sie http://nocobase.local in Ihrem Browser öffnen.
    - host: nocobase.local
      http:
        paths:
          - backend:
              serviceName: nocobase
              servicePort: 13000
```

## Verwendung von Helm Charts

Wir haben Helm Charts für die NocoBase-Anwendung erstellt, die es Ihnen ermöglichen, den NocoBase-Anwendungsdienst in Kubernetes mithilfe der Helm CLI bereitzustellen.

### Voraussetzungen

Stellen Sie sicher, dass Clients wie `kubectl` und `helm` in Ihrer Betriebsumgebung installiert sind und dass `kubectl` sich korrekt mit dem Ziel-Cluster verbinden kann.

### Repository hinzufügen

Fügen Sie das Repository der NocoBase Helm Charts hinzu:

```bash
# Fügen Sie das Repository der NocoBase Helm Charts hinzu
helm repo add nocobase https://nocobase.github.io/helm-charts

# Aktualisieren Sie den Helm-Index
helm repo update
```

### Helm-Bereitstellung

1.  Erstellen Sie eine Datei mit dem Namen `values.yaml`.

    ```yaml
    persistent:
      # Die benötigte Größe für den gemeinsam genutzten Speicher des NocoBase-Clusters
      size: 10Gi
      # Die von Kubernetes des Cloud-Dienstes bereitgestellte StorageClass.
      # Wie im Abschnitt "Anwendungsbereitstellung" ist dies explizit leer gelassen, da der NFS-Dienst des Master-Knotens verwendet wird.
      storageClassName: ""

    configMap:
      data:
        TZ: Asia/Shanghai
        # Die unten stehenden Datenbank- und Redis-Konfigurationen verwenden die PostgreSQL- und Redis-Dienste im Cluster aus dem Dokument "K8S Middleware-Bereitstellung".
        # Wenn Ihre Umgebung bereits über bestehende Datenbank- und Redis-Dienste verfügt, passen Sie die entsprechenden Konfigurationen unten an.
        CACHE_DEFAULT_STORE: redis
        # Verwenden Sie einen bestehenden oder selbst bereitgestellten Redis-Dienst.
        CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
        PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
        LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
        # Verwenden Sie einen bestehenden oder selbst bereitgestellten PostgreSQL-Dienst.
        DB_DATABASE: nocobase
        DB_DIALECT: postgres
        DB_HOST: "postgres-0.postgres-service"
        DB_PASSWORD: nocobase123
        DB_PORT: "5432"
        DB_UNDERSCORED: "true"
        DB_USER: nocobase
        # Benutzername der Service-Plattform
        NOCOBASE_PKG_USERNAME: "<your user>"
        # Passwort der Service-Plattform
        NOCOBASE_PKG_PASSWORD: "<your password>"

        # ... weitere Umgebungsvariablen
    ```

2.  Führen Sie den `helm install`-Befehl aus, um die Installation zu starten.

    ```bash
    helm install nocobase nocobase/nocobase --values values.yaml
    ```