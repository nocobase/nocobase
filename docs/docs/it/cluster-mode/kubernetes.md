# Distribuzione su Kubernetes

Questo articolo si propone di guidare gli utenti nella rapida distribuzione di NocoBase in modalità cluster in un ambiente Kubernetes. Si assume che il lettore abbia familiarità con l'ambiente Kubernetes e abbia completato i passaggi descritti in [Preparativi](./preparations.md).

:::info{title="Suggerimento"}
Per verificare rapidamente il processo di distribuzione su Kubernetes, l'ambiente operativo in questo articolo è un cluster K3s a nodo singolo (OS: Ubuntu). Questa guida è applicabile anche ai cluster Kubernetes standard. Se dovesse riscontrare delle discrepanze durante la distribuzione su un cluster Kubernetes standard, La preghiamo di comunicarcelo.
:::

## Ambiente Cluster

Se dispone già di un ambiente cluster Kubernetes, può saltare questo passaggio.

Prepari un server con Debian / Ubuntu installato e vi esegua un cluster K3s in modalità a nodo singolo. Per saperne di più su K3s, visiti il [sito web ufficiale di K3s](https://docs.k3s.io/).

Ecco i passaggi:

1.  Acceda al server tramite SSH.
2.  Utilizzi lo script ufficiale per installare il nodo master del cluster K3s sul server.

```bash
# Dopo l'installazione, il file kubeconfig predefinito è /etc/rancher/k3s/k3s.yaml
curl -sfL https://get.k3s.io | sh -
```

```bash
# Verifichi che la configurazione sia corretta
kubectl get node
```

## Distribuzione dell'Applicazione Cluster

Distribuisca l'applicazione NocoBase in modalità cluster su un cluster Kubernetes.

### Variabili d'Ambiente

Normalmente, le variabili d'ambiente dovrebbero essere separate dal file di configurazione della distribuzione dell'applicazione. Questo articolo utilizza un ConfigMap come esempio. In un ambiente di produzione, può utilizzare i Secrets per separare ulteriormente le informazioni sensibili.

Ecco i passaggi:

1.  Crei un file `nocobase-cm.yaml`.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nocobase-config
data:
  # Imposti il Suo fuso orario, ad esempio, UTC, Europe/Rome
  TZ: UTC
  # Le configurazioni di database e Redis seguenti utilizzano i servizi PostgreSQL e Redis presenti nel cluster, come descritto nel documento "Distribuzione Middleware su K8S".
  # Se il Suo ambiente dispone già di servizi database e Redis esistenti, modifichi le configurazioni corrispondenti qui sotto.
  CACHE_DEFAULT_STORE: redis
  # Utilizzi un servizio Redis esistente o auto-distribuito.
  CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
  PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
  LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
  # Utilizzi un servizio PostgreSQL esistente o auto-distribuito.
  DB_DATABASE: nocobase
  DB_DIALECT: postgres
  DB_HOST: "postgres-0.postgres-service"
  DB_PASSWORD: nocobase123
  DB_PORT: "5432"
  DB_UNDERSCORED: "true"
  DB_USER: nocobase
  # nome utente della piattaforma di servizio
  NOCOBASE_PKG_USERNAME: "<your user>"
  # password della piattaforma di servizio
  NOCOBASE_PKG_PASSWORD: "<your password>"

  # ... altre variabili d'ambiente
```

2.  Esegua il comando `kubectl` per distribuire il ConfigMap.

```bash
kubectl apply -f nocobase-cm.yaml
```

### Archiviazione Condivisa

I diversi nodi di un'applicazione NocoBase distribuita in modalità cluster devono montare la stessa directory di archiviazione (`storage`). A tal fine, è necessario creare un Volume Persistente (PV) che supporti l'accesso in lettura e scrittura da più nodi (ReadWriteMany). Tipicamente, si creerebbe un disco cloud sulla piattaforma del Suo fornitore di servizi cloud e lo si legherebbe come PV, oppure si può montare una directory di archiviazione condivisa utilizzando altri metodi come NFS.

### Distribuzione dell'Applicazione

Per la distribuzione iniziale, inizi con un singolo nodo. Una volta completata, potrà scalare a più nodi.

1.  Crei un file `nocobase-apps.yaml`.

```yaml
# Crei un PVC. I Pod multipli distribuiti dal Deployment sottostante monteranno la stessa directory di archiviazione persistente tramite questo PVC.
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
  storageClassName: "" # Impostato esplicitamente su vuoto poiché l'esempio utilizza il servizio NFS del nodo master, evitando la StorageClass predefinita.
---
# Il Service dell'applicazione, che fornisce servizi all'esterno del cluster dopo essere stato associato a un Ingress.
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
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Il Deployment dell'applicazione, che può distribuire più container dell'applicazione.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nocobase
spec:
  replicas: 1 # Distribuzione iniziale con un solo nodo.
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
          # Carica le variabili d'ambiente dal ConfigMap precedentemente distribuito.
          envFrom:
            - configMapRef:
                name: nocobase-config
          volumeMounts:
            - name: nocobase-data
              mountPath: /app/nocobase/storage
          # Dichiara le richieste e i limiti di risorse per l'esecuzione del servizio.
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          # Comando di probe di liveness. Il cluster lo utilizza per determinare se il Pod deve essere riavviato.
          livenessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 60
          # Comando di probe di readiness. Il cluster lo utilizza per determinare se indirizzare il traffico del Service al Pod.
          readinessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 30
      # Monta l'archiviazione persistente tramite PVC.
      volumes:
        - name: nocobase-data
          persistentVolumeClaim:
            claimName: nocobase-pvc
```

2.  Esegua il comando `kubectl` per distribuire il servizio dell'applicazione NocoBase.

```bash
kubectl apply -f nocobase-apps.yaml
```

3.  Verifichi lo stato del servizio dell'applicazione NocoBase.

```bash
# Controlli lo stato del Pod del servizio NocoBase
kubectl get pods -l app=nocobase
```

L'output di esempio è il seguente. Uno `STATUS` di `Running` indica che il servizio è stato avviato con successo:

```text
NAME                        READY   STATUS    RESTARTS   AGE
nocobase-5558b774d7-w6swf   1/1     Running   0          7h6m
```

4.  Al primo avvio, dovrà abilitare manualmente i seguenti plugin nell'interfaccia di amministrazione:

    -   @nocobase/plugin-sync-adapter-redis
    -   @nocobase/plugin-lock-adapter-redis

Successivamente, potrà scalare. Ad esempio, per scalare a 4 nodi:

```bash
kubectl scale deployment nocobase --replicas=4
```

## Modifiche all'Applicazione

Le modifiche all'applicazione si riferiscono alle seguenti situazioni:

-   Aggiornamento della versione dell'applicazione
-   Installazione di nuovi plugin
-   Attivazione di plugin

NocoBase non supporta ancora la sincronizzazione automatica delle modifiche tra più istanze in un cluster per gli scenari sopra descritti. Pertanto, dovrà gestirle manualmente seguendo i passaggi indicati di seguito. Questi passaggi riguardano solo le modifiche al servizio dell'applicazione. Prima di apportare qualsiasi modifica, La preghiamo di eseguire autonomamente il backup del Suo database e dell'archiviazione persistente.

### Aggiornamento Rolling della Versione dell'Applicazione

1.  Esegua il comando `kubectl set image` per modificare la versione dell'immagine del container del Deployment.

    ```bash
    kubectl set image deployment/nocobase nocobase=nocobase/nocobase:1.7
    ```

2.  Controlli lo stato dell'aggiornamento rolling.

    ```bash
    # Controlli l'avanzamento complessivo dell'aggiornamento rolling del Deployment
    kubectl rollout status deployment/nocobase

    # Controlli lo stato di ogni Pod
    kubectl get pods -l app=nocobase
    ```

Se dovesse riscontrare problemi durante o dopo l'aggiornamento della versione dell'applicazione e avesse bisogno di un rollback, esegua il seguente comando per ripristinare la versione dell'immagine del container:

```bash
kubectl rollout undo deployment/nocobase
```

### Riavvio Graceful dell'Applicazione

Dopo aver installato o attivato nuovi plugin, è necessario aggiornare la configurazione o lo stato dell'applicazione. Può utilizzare il seguente comando per riavviare in modo graceful ogni Pod.

1.  Esegua il comando `kubectl rollout restart`.

    ```bash
    kubectl rollout restart deployment/nocobase
    ```

2.  Controlli lo stato del riavvio rolling.

    ```bash
    # Controlli l'avanzamento complessivo del riavvio rolling del Deployment
    kubectl rollout status deployment/nocobase

    # Controlli lo stato di ogni Pod
    kubectl get pods -l app=nocobase
    ```

## Gateway dell'Applicazione

Per rendere un'applicazione distribuita in un cluster Kubernetes accessibile dall'esterno, è necessario associare un Ingress al Service dell'applicazione. L'ambiente cluster utilizzato in questo articolo è K3s, che include Traefik come Ingress Controller predefinito.

### Traefik IngressRoute

Ecco i passaggi:

1.  Crei un file `nocobase-ingress.yaml`.

    ```yaml
    apiVersion: traefik.containo.us/v1alpha1
    kind: IngressRoute
    metadata:
      name: nocobase-ingress
    spec:
      entryPoints:
        - web
      routes:
        # Qui, 'nocobase.local' dovrebbe essere sostituito con un nome di dominio reale che punta all'IP del cluster.
        # Se non dispone di un dominio per la verifica, può modificare il file hosts locale per aggiungere un record per nocobase.local che punta all'IP del cluster.
        # Potrà quindi accedere all'applicazione NocoBase nel cluster aprendo http://nocobase.local nel Suo browser.
        - match: Host(`nocobase.local`)
          kind: Rule
          services:
            # Questo è il Service creato durante la distribuzione dell'applicazione NocoBase nella sezione "Distribuzione dell'Applicazione" precedente.
            - name: nocobase
              port: 13000
    ```

2.  Esegua il comando `kubectl` per distribuire l'Ingress per l'applicazione NocoBase.

    ```bash
    kubectl apply -f nocobase-ingress.yaml
    ```

### Ingress-Nginx

La maggior parte dei cluster Kubernetes utilizza Ingress-Nginx come Ingress Controller. Di seguito è riportato un file `nocobase-ingress.yaml` basato su Ingress-Nginx:

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
  name: nocobase-ingress
spec:
  rules:
    # Qui, 'nocobase.local' dovrebbe essere sostituito con un nome di dominio reale che punta all'IP del cluster.
    # Se non dispone di un dominio per la verifica, può modificare il file hosts locale per aggiungere un record per nocobase.local che punta all'IP del cluster.
    # Potrà quindi accedere all'applicazione NocoBase nel cluster aprendo http://nocobase.local nel Suo browser.
    - host: nocobase.local
      http:
        paths:
          - backend:
              serviceName: nocobase
              servicePort: 13000
```

## Utilizzo di Helm Charts

Abbiamo creato gli Helm Charts per l'applicazione NocoBase, consentendoLe di distribuire il servizio dell'applicazione NocoBase in Kubernetes utilizzando la CLI di Helm.

### Prerequisiti

Si assicuri che client come `kubectl` e `helm` siano installati nel Suo ambiente operativo e che `kubectl` possa connettersi correttamente al cluster di destinazione.

### Aggiungere il Repository

Aggiunga il repository degli Helm Charts di NocoBase:

```bash
# Aggiunge il repository degli Helm Charts di NocoBase
helm repo add nocobase https://nocobase.github.io/helm-charts

# Aggiorna l'indice di Helm
helm repo update
```

### Distribuzione con Helm

1.  Crei un file `values.yaml`.

    ```yaml
    persistent:
      # Dimensione richiesta per l'archiviazione condivisa del cluster NocoBase
      size: 10Gi
      # La classe di archiviazione fornita dal servizio Kubernetes del cloud
      # Come nella sezione "Distribuzione dell'Applicazione", questo è esplicitamente impostato su vuoto perché utilizza il servizio NFS del nodo master.
      storageClassName: ""

    configMap:
      data:
        # Imposti il Suo fuso orario, ad esempio, UTC, Europe/Rome
        TZ: UTC
        # Le configurazioni di database e Redis seguenti utilizzano i servizi PostgreSQL e Redis presenti nel cluster, come descritto nel documento "Distribuzione Middleware su K8S".
        # Se il Suo ambiente dispone già di servizi database e Redis esistenti, modifichi le configurazioni corrispondenti qui sotto.
        CACHE_DEFAULT_STORE: redis
        # Utilizzi un servizio Redis esistente o auto-distribuito.
        CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
        PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
        LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
        # Utilizzi un servizio PostgreSQL esistente o auto-distribuito.
        DB_DATABASE: nocobase
        DB_DIALECT: postgres
        DB_HOST: "postgres-0.postgres-service"
        DB_PASSWORD: nocobase123
        DB_PORT: "5432"
        DB_UNDERSCORED: "true"
        DB_USER: nocobase
        # nome utente della piattaforma di servizio
        NOCOBASE_PKG_USERNAME: "<your user>"
        # password della piattaforma di servizio
        NOCOBASE_PKG_PASSWORD: "<your password>"

        # ... altre variabili d'ambiente
    ```

2.  Esegua il comando `helm install` per avviare l'installazione.

    ```bash
    helm install nocobase nocobase/nocobase --values values.yaml
    ```