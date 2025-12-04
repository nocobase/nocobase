
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Kubernetes-implementatie

Dit artikel begeleidt u bij het snel implementeren van NocoBase in clustermodus binnen een Kubernetes-omgeving. We gaan ervan uit dat u bekend bent met de Kubernetes-omgeving en de stappen in [Voorbereidingen](./preparations.md) hebt voltooid.

:::info{title="Tip"}
Om het Kubernetes-implementatieproces snel te kunnen verifiëren, gebruiken we in dit artikel een K3s-cluster met één node (besturingssysteem: Ubuntu) als werkomgeving. Deze handleiding is ook van toepassing op standaard Kubernetes-clusters. Mocht u afwijkingen tegenkomen bij de implementatie in een standaard Kubernetes-cluster, laat het ons dan weten.
:::

## Clusteromgeving

Als u al een Kubernetes-clusteromgeving hebt, kunt u deze stap overslaan.

Bereid een server voor met Debian / Ubuntu en draai hierop een K3s-cluster in single-node modus. Voor meer informatie over K3s kunt u de [officiële K3s-website](https://docs.k3s.io/) bezoeken.

Stappen:

1. Log in via SSH op de server.
2. Gebruik het officiële script om de K3s cluster master node op de server te installeren.

```bash
# Na installatie is het standaard kubeconfig-bestand /etc/rancher/k3s/k3s.yaml
curl -sfL https://get.k3s.io | sh -
```

```bash
# Controleer of de configuratie correct is
kubectl get node
```

## Implementatie van clusterapplicatie

Implementeer de NocoBase-applicatie in clustermodus op een Kubernetes-cluster.

### Omgevingsvariabelen

Normaal gesproken scheidt u omgevingsvariabelen van het configuratiebestand van de applicatie-implementatie. Dit artikel gebruikt een ConfigMap als voorbeeld. In een productieomgeving kunt u Secrets gebruiken om gevoelige informatie verder te scheiden.

Stappen:

1. Maak een `nocobase-cm.yaml`-bestand aan.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nocobase-config
data:
  TZ: Asia/Shanghai
  # De onderstaande database- en Redis-configuraties maken gebruik van de PostgreSQL- en Redis-services in het cluster, zoals beschreven in het document 'K8S Middleware Deployment'.
  # Als uw omgeving al bestaande database- en Redis-services heeft, pas dan de onderstaande configuraties dienovereenkomstig aan.
  CACHE_DEFAULT_STORE: redis
  # Gebruik een bestaande of zelf geïmplementeerde Redis-service.
  CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
  PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
  LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
  # Gebruik een bestaande of zelf geïmplementeerde PostgreSQL-service.
  DB_DATABASE: nocobase
  DB_DIALECT: postgres
  DB_HOST: "postgres-0.postgres-service"
  DB_PASSWORD: nocobase123
  DB_PORT: "5432"
  DB_UNDERSCORED: "true"
  DB_USER: nocobase
  # gebruikersnaam serviceplatform
  NOCOBASE_PKG_USERNAME: "<your user>"
  # wachtwoord serviceplatform
  NOCOBASE_PKG_PASSWORD: "<your password>"

  # ... andere omgevingsvariabelen
```

2. Voer het `kubectl`-commando uit om de ConfigMap te implementeren.

```bash
kubectl apply -f nocobase-cm.yaml
```

### Gedeelde opslag

Verschillende nodes van een NocoBase-applicatie die in clustermodus is geïmplementeerd, moeten dezelfde opslagmap (`storage`) koppelen. Hiervoor moet u een Persistent Volume (PV) aanmaken dat lees- en schrijftoegang vanaf meerdere nodes (ReadWriteMany) ondersteunt. Meestal maakt u een clouddisk aan op het platform van uw cloudprovider en koppelt u deze als een PV, of u kunt een gedeelde opslagmap koppelen via andere methoden zoals NFS.

### Applicatie-implementatie

Voor de initiële implementatie begint u met één node. Nadat deze is voltooid, kunt u opschalen naar meerdere nodes.

1. Maak een `nocobase-apps.yaml`-bestand aan.

```yaml
# Maak een PVC aan. Meerdere Pods die door de onderstaande Deployment worden geïmplementeerd, zullen via deze PVC dezelfde persistente opslagmap koppelen.
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
  storageClassName: "" # Expliciet ingesteld op leeg, aangezien het voorbeeld de NFS-service van de master node gebruikt, om de standaard StorageClass te vermijden.
---
# De Service van de applicatie, die services buiten het cluster levert nadat deze is gekoppeld aan een Ingress.
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
# De Deployment van de applicatie, die meerdere applicatiecontainers kan implementeren.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nocobase
spec:
  replicas: 1 # Initiële implementatie met slechts één node.
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
          # Laad omgevingsvariabelen vanuit de eerder geïmplementeerde ConfigMap.
          envFrom:
            - configMapRef:
                name: nocobase-config
          volumeMounts:
            - name: nocobase-data
              mountPath: /app/nocobase/storage
          # Declareer resourcevereisten en -limieten voor de service.
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          # Liveness probe-commando. Het cluster gebruikt dit om te bepalen of de Pod opnieuw moet worden opgestart.
          livenessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 60
          # Readiness probe-commando. Het cluster gebruikt dit om te bepalen of Service-verkeer naar de Pod moet worden geleid.
          readinessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 30
      # Koppel persistente opslag via PVC.
      volumes:
        - name: nocobase-data
          persistentVolumeClaim:
            claimName: nocobase-pvc
```

2. Voer het `kubectl`-commando uit om de NocoBase-applicatieservice te implementeren.

```bash
kubectl apply -f nocobase-apps.yaml
```

3. Controleer de status van de NocoBase-applicatieservice.

```bash
# Bekijk de Pod-status van de NocoBase-service
kubectl get pods -l app=nocobase
```

De voorbeeldoutput is als volgt. Een `STATUS` van `Running` geeft aan dat de service succesvol is gestart:

```text
NAME                        READY   STATUS    RESTARTS   AGE
nocobase-5558b774d7-w6swf   1/1     Running   0          7h6m
```

4. Bij de eerste opstart moet u de volgende **plugins** handmatig inschakelen in de admin-interface:

- @nocobase/plugin-sync-adapter-redis
- @nocobase/plugin-lock-adapter-redis

Daarna kunt u opschalen. Bijvoorbeeld, om op te schalen naar 4 nodes:

```bash
kubectl scale deployment nocobase --replicas=4
```

## Applicatiewijzigingen

Applicatiewijzigingen verwijzen naar de volgende situaties:

- De applicatieversie upgraden
- Nieuwe **plugins** installeren
- **Plugins** activeren

NocoBase ondersteunt nog geen automatische synchronisatie van wijzigingen over meerdere clusterinstanties voor de bovenstaande scenario's. Daarom moet u deze handmatig afhandelen door de onderstaande stappen te volgen. Deze stappen hebben alleen betrekking op wijzigingen in de applicatieservice. Voordat u wijzigingen aanbrengt, dient u zelf een back-up te maken van uw database en persistente opslag.

### Rolling upgrade van applicatieversie

1. Voer het `kubectl set image`-commando uit om de containerimageversie van de Deployment te wijzigen.

    ```bash
    kubectl set image deployment/nocobase nocobase=nocobase/nocobase:1.7
    ```

2. Controleer de status van de rolling update.

    ```bash
    # Controleer de algehele voortgang van de rolling update van de Deployment
    kubectl rollout status deployment/nocobase

    # Controleer de status van elke Pod
    kubectl get pods -l app=nocobase
    ```

Mocht u problemen ondervinden tijdens of na de upgrade van de applicatieversie en wilt u teruggaan naar een eerdere versie, voer dan het volgende commando uit om de containerimageversie terug te draaien:

```bash
kubectl rollout undo deployment/nocobase
```

### Graceful herstart van applicatie

Na het installeren of activeren van nieuwe **plugins** moet u de applicatieconfiguratie of -status vernieuwen. U kunt het volgende commando gebruiken om elke Pod graceful te herstarten.

1. Voer het `kubectl rollout restart`-commando uit.

    ```bash
    kubectl rollout restart deployment/nocobase
    ```

2. Controleer de status van de rolling restart.

    ```bash
    # Controleer de algehele voortgang van de rolling restart van de Deployment
    kubectl rollout status deployment/nocobase

    # Controleer de status van elke Pod
    kubectl get pods -l app=nocobase
    ```

## Applicatiegateway

Om een applicatie die in een Kubernetes-cluster is geïmplementeerd van buitenaf toegankelijk te maken, moet u een Ingress koppelen aan de Service van de applicatie. De clusteromgeving die in dit artikel wordt gebruikt, is K3s, dat Traefik als standaard Ingress Controller-component heeft geïnstalleerd.

### Traefik IngressRoute

Stappen:

1. Maak een `nocobase-ingress.yaml`-bestand aan.

    ```yaml
    apiVersion: traefik.containo.us/v1alpha1
    kind: IngressRoute
    metadata:
      name: nocobase-ingress
    spec:
      entryPoints:
        - web
      routes:
        # Hier moet 'nocobase.local' worden vervangen door een echte domeinnaam die naar het IP-adres van het cluster verwijst.
        # Als u geen domein hebt om te verifiëren, kunt u uw lokale hosts-bestand wijzigen om een record voor nocobase.local toe te voegen dat naar het IP-adres van het cluster verwijst.
        # U kunt de NocoBase-applicatie in het cluster openen door http://nocobase.local in uw browser te openen.
        - match: Host(`nocobase.local`)
          kind: Rule
          services:
            # Dit is de Service die is aangemaakt bij het implementeren van de NocoBase-applicatie in de sectie 'Applicatie-implementatie' hierboven.
            - name: nocobase
              port: 13000
    ```

2. Voer het `kubectl`-commando uit om de Ingress voor de NocoBase-applicatie te implementeren.

    ```bash
    kubectl apply -f nocobase-ingress.yaml
    ```

### Ingress-Nginx

De meeste Kubernetes-clusters gebruiken Ingress-Nginx als Ingress Controller. Hieronder vindt u een `nocobase-ingress.yaml`-bestand gebaseerd op Ingress-Nginx:

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
  name: nocobase-ingress
spec:
  rules:
    # Hier moet 'nocobase.local' worden vervangen door een echte domeinnaam die naar het IP-adres van het cluster verwijst.
    # Als u geen domein hebt om te verifiëren, kunt u uw lokale hosts-bestand wijzigen om een record voor nocobase.local toe te voegen dat naar het IP-adres van het cluster verwijst.
    # U kunt de NocoBase-applicatie in het cluster openen door http://nocobase.local in uw browser te openen.
    - host: nocobase.local
      http:
        paths:
          - backend:
              serviceName: nocobase
              servicePort: 13000
```

## Helm Charts gebruiken

We hebben Helm Charts voor de NocoBase-applicatie geschreven, waarmee u de NocoBase-applicatieservice in Kubernetes kunt implementeren met behulp van de Helm CLI.

### Vereisten

Zorg ervoor dat clients zoals `kubectl` en `helm` in uw werkomgeving zijn geïnstalleerd en dat `kubectl` correct verbinding kan maken met het doelcluster.

### Repository toevoegen

Voeg de NocoBase Helm Charts-repository toe:

```bash
# Voeg de NocoBase Helm Charts-repository toe
helm repo add nocobase https://nocobase.github.io/helm-charts

# Werk de Helm-index bij
helm repo update
```

### Helm-implementatie

1.  Maak een `values.yaml`-bestand aan.

    ```yaml
    persistent:
      # De vereiste grootte voor NocoBase cluster gedeelde opslag
      size: 10Gi
      # De storage class die wordt aangeboden door de Kubernetes-service van de cloudprovider
      # Net als in de sectie 'Applicatie-implementatie' is dit expliciet leeg gelaten omdat het de NFS-service van de master node gebruikt.
      storageClassName: ""

    configMap:
      data:
        TZ: Asia/Shanghai
        # De onderstaande database- en Redis-configuraties maken gebruik van de PostgreSQL- en Redis-services in het cluster, zoals beschreven in het document 'K8S Middleware Deployment'.
        # Als uw omgeving al bestaande database- en Redis-services heeft, pas dan de onderstaande configuraties dienovereenkomstig aan.
        CACHE_DEFAULT_STORE: redis
        # Gebruik een bestaande of zelf geïmplementeerde Redis-service.
        CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
        PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
        LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
        # Gebruik een bestaande of zelf geïmplementeerde PostgreSQL-service.
        DB_DATABASE: nocobase
        DB_DIALECT: postgres
        DB_HOST: "postgres-0.postgres-service"
        DB_PASSWORD: nocobase123
        DB_PORT: "5432"
        DB_UNDERSCORED: "true"
        DB_USER: nocobase
        # gebruikersnaam serviceplatform
        NOCOBASE_PKG_USERNAME: "<your user>"
        # wachtwoord serviceplatform
        NOCOBASE_PKG_PASSWORD: "<your password>"

        # ... andere omgevingsvariabelen
    ```

2.  Voer het `helm install`-commando uit om de installatie te starten.

    ```bash
    helm install nocobase nocobase/nocobase --values values.yaml
    ```