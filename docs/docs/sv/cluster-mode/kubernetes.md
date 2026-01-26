
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Kubernetes-distribution

Den här artikeln syftar till att snabbt guida er som användare att distribuera NocoBase i klusterläge i en Kubernetes-miljö. Vi förutsätter att ni är bekanta med Kubernetes-miljön och har slutfört stegen i [Förberedelser](./preparations.md).

:::info{title="Tips"}
För att snabbt verifiera distributionsprocessen i Kubernetes är driftsmiljön i den här artikeln ett K3s-kluster med en nod (operativsystem: Ubuntu). Den här guiden är också tillämplig för standard Kubernetes-kluster. Om ni stöter på avvikelser vid distribution i ett standard Kubernetes-kluster, vänligen meddela oss.
:::

## Klustermiljö

Om ni redan har en Kubernetes-klustermiljö kan ni hoppa över det här steget.

Förbered en server med Debian / Ubuntu installerat och kör ett K3s-kluster i en-nodsläge på den. För att lära er mer om K3s, besök [K3s officiella webbplats](https://docs.k3s.io/zh/).

Steg:

1. Logga in på servern via SSH.
2. Använd det officiella skriptet för att installera K3s-klustrets masternod på servern.

```bash
# Efter installationen är standard-kubeconfig-filen /etc/rancher/k3s/k3s.yaml
curl -sfL https://get.k3s.io | sh -
```

```bash
# Verifiera att konfigurationen är korrekt
kubectl get node
```

## Distribution av klusterapplikation

Distribuera NocoBase-applikationen i klusterläge i ett Kubernetes-kluster.

### Miljövariabler

Normalt bör miljövariabler separeras från applikationsdistributionskonfigurationsfilen. Den här artikeln använder en ConfigMap som ett exempel. I en produktionsmiljö kan ni använda Secrets för att ytterligare separera känslig information.

Steg:

1. Skapa filen `nocobase-cm.yaml`.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nocobase-config
data:
  TZ: Asia/Shanghai
  # Databas- och Redis-konfigurationerna nedan använder PostgreSQL- och Redis-tjänsterna i klustret från dokumentet "Kubernetes Middleware Deployment".
  # Om er miljö redan har befintliga databas- och Redis-tjänster, ändra motsvarande konfigurationer nedan.
  CACHE_DEFAULT_STORE: redis
  # Använd en befintlig eller självdistribuerad Redis-tjänst.
  CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
  PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
  LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
  # Använd en befintlig eller självdistribuerad PostgreSQL-tjänst.
  DB_DATABASE: nocobase
  DB_DIALECT: postgres
  DB_HOST: "postgres-0.postgres-service"
  DB_PASSWORD: nocobase123
  DB_PORT: "5432"
  DB_UNDERSCORED: "true"
  DB_USER: nocobase
  # användarnamn för tjänsteplattform
  NOCOBASE_PKG_USERNAME: "<your user>"
  # lösenord för tjänsteplattform
  NOCOBASE_PKG_PASSWORD: "<your password>"

  # ... övriga miljövariabler
```

2. Kör `kubectl`-kommandot för att distribuera ConfigMap.

```bash
kubectl apply -f nocobase-cm.yaml
```

### Delad lagring

Olika noder i en NocoBase-applikation distribuerad i klusterläge behöver montera samma lagringskatalog (`storage`). För att uppnå detta behöver ni skapa en Persistent Volume (PV) som stöder läs- och skrivåtkomst från flera noder (ReadWriteMany). Normalt skapar ni en molndisk på er molnleverantörs plattform och binder den som en PV, eller så kan ni montera en delad lagringskatalog med andra metoder som NFS.

### Applikationsdistribution

Vid den första distributionen börjar ni med en enda nod. När den är klar kan ni skala upp till flera noder.

1. Skapa filen `nocobase-apps.yaml`.

```yaml
# Skapa en PVC. Flera Poddar som distribueras av Deployment nedan kommer att montera samma persistenta lagringskatalog via denna PVC.
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
  storageClassName: "" # Expliceras som tom då exemplet använder masternodens NFS-tjänst, för att undvika standard StorageClass.
---
# Applikationens Service, som tillhandahåller tjänster utanför klustret efter att ha bundits till en Ingress.
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
# Applikationens Deployment, som kan distribuera flera applikationscontainrar.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nocobase
spec:
  replicas: 1 # Första distributionen med endast en nod.
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
          # Ladda miljövariabler från den tidigare distribuerade ConfigMap.
          envFrom:
            - configMapRef:
                name: nocobase-config
          volumeMounts:
            - name: nocobase-data
              mountPath: /app/nocobase/storage
          # Deklarera resursbegäranden och begränsningar för tjänsten.
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          # Liveness probe-kommando. Klustret använder detta för att avgöra om Podden behöver startas om.
          livenessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 60
          # Readiness probe-kommando. Klustret använder detta för att avgöra om Service-trafik ska dirigeras till Podden.
          readinessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 30
      # Montera persistent lagring via PVC.
      volumes:
        - name: nocobase-data
          persistentVolumeClaim:
            claimName: nocobase-pvc
```

2. Kör `kubectl`-kommandot för att distribuera NocoBase-applikationstjänsten.

```bash
kubectl apply -f nocobase-apps.yaml
```

3. Verifiera statusen för NocoBase-applikationstjänsten.

```bash
# Kontrollera Pod-statusen för NocoBase-tjänsten
kubectl get pods -l app=nocobase
```

Exempelutdata är som följer. En `STATUS` som är `Running` indikerar att tjänsten har startat framgångsrikt:

```text
NAME                        READY   STATUS    RESTARTS   AGE
nocobase-5558b774d7-w6swf   1/1     Running   0          7h6m
```

4. Vid den första uppstarten behöver ni manuellt aktivera följande plugin i administrationsgränssnittet:

- @nocobase/plugin-sync-adapter-redis
- @nocobase/plugin-lock-adapter-redis

Därefter kan ni skala upp. Till exempel, för att skala till 4 noder:

```bash
kubectl scale deployment nocobase --replicas=4
```

## Applikationsändringar

Applikationsändringar avser följande situationer:

- Uppgradering av applikationsversionen
- Installation av nya plugin
- Aktivering av plugin

NocoBase stöder ännu inte automatisk synkronisering av ändringar över flera instanser i ett kluster för ovanstående scenarier. Därför behöver ni hantera dem manuellt genom att följa stegen nedan. Dessa steg involverar endast ändringar av applikationstjänsten. Innan ni gör några ändringar, vänligen säkerhetskopiera er databas och persistenta lagring.

### Rullande uppgradering av applikationsversion

1. Kör `kubectl set image`-kommandot för att ändra Deploymentens containeravbildningsversion.

    ```bash
    kubectl set image deployment/nocobase nocobase=nocobase/nocobase:1.7
    ```

2. Kontrollera status för den rullande uppdateringen.

    ```bash
    # Kontrollera den övergripande framstegen för Deploymentens rullande uppdatering
    kubectl rollout status deployment/nocobase

    # Kontrollera statusen för varje Pod
    kubectl get pods -l app=nocobase
    ```

Om ni stöter på problem under eller efter uppgraderingen av applikationsversionen och behöver återställa, kör följande kommando för att återställa containeravbildningsversionen:

```bash
kubectl rollout undo deployment/nocobase
```

### Smidig omstart av applikationen

Efter installation eller aktivering av nya plugin behöver ni uppdatera applikationskonfigurationen eller -statusen. Ni kan använda följande kommando för att smidigt starta om varje Pod.

1. Kör `kubectl rollout restart`-kommandot.

    ```bash
    kubectl rollout restart deployment/nocobase
    ```

2. Kontrollera status för den rullande omstarten.

    ```bash
    # Kontrollera den övergripande framstegen för Deploymentens omstart
    kubectl rollout status deployment/nocobase

    # Kontrollera statusen för varje Pod
    kubectl get pods -l app=nocobase
    ```

## Applikationsgateway

För att en applikation distribuerad i ett Kubernetes-kluster ska kunna nås utifrån, behöver ni binda en Ingress till applikationens Service. Klustermiljön som används i den här artikeln är K3s, som levereras med Traefik som standard Ingress Controller-komponent.

### Traefik IngressRoute

Steg:

1. Skapa filen `nocobase-ingress.yaml`.

    ```yaml
    apiVersion: traefik.containo.us/v1alpha1
    kind: IngressRoute
    metadata:
      name: nocobase-ingress
    spec:
      entryPoints:
        - web
      routes:
        # Här bör 'nocobase.local' ersättas med ett verkligt domännamn som pekar mot klustrets IP-adress.
        # Om ni inte har en domän för verifiering kan ni ändra er lokala hosts-fil för att lägga till en post för nocobase.local som pekar mot klustrets IP-adress.
        # Ni kan sedan komma åt NocoBase-applikationen i klustret genom att öppna http://nocobase.local i er webbläsare.
        - match: Host(`nocobase.local`)
          kind: Rule
          services:
            # Detta är den Service som skapades vid distributionen av NocoBase-applikationen i avsnittet "Applikationsdistribution" ovan.
            - name: nocobase
              port: 13000
    ```

2. Kör `kubectl`-kommandot för att distribuera Ingress för NocoBase-applikationen.

```bash
kubectl apply -f nocobase-ingress.yaml
```

### Ingress-Nginx

De flesta Kubernetes-kluster använder Ingress-Nginx som Ingress Controller. Nedan följer en `nocobase-ingress.yaml`-fil baserad på Ingress-Nginx:

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
  name: nocobase-ingress
spec:
  rules:
    # Här bör 'nocobase.local' ersättas med ett verkligt domännamn som pekar mot klustrets IP-adress.
    # Om ni inte har en domän för verifiering kan ni ändra er lokala hosts-fil för att lägga till en post för nocobase.local som pekar mot klustrets IP-adress.
    # Ni kan sedan komma åt NocoBase-applikationen i klustret genom att öppna http://nocobase.local i er webbläsare.
    - host: nocobase.local
      http:
        paths:
          - backend:
              serviceName: nocobase
              servicePort: 13000
```

## Använda Helm Charts

Vi har skapat Helm Charts för NocoBase-applikationen, vilket gör att ni kan distribuera NocoBase-applikationstjänsten i Kubernetes med hjälp av Helm CLI.

### Förberedelser

Säkerställ att klienter som `kubectl` och `helm` är installerade i er driftsmiljö och att `kubectl` kan ansluta korrekt till målklustret.

### Lägg till lagringsplats

Lägg till NocoBase Helm Charts-lagringsplatsen:

```bash
# Lägg till NocoBase Helm Charts-lagringsplatsen
helm repo add nocobase https://nocobase.github.io/helm-charts

# Uppdatera Helm-indexet
helm repo update
```

### Helm-distribution

1. Skapa filen `values.yaml`.

    ```yaml
    persistent:
      # Den nödvändiga storleken för NocoBase-klustrets delade lagring
      size: 10Gi
      # Lagringsklassen som tillhandahålls av molntjänstens Kubernetes
      # Samma som i avsnittet "Applikationsdistribution" är detta explicit satt till tomt eftersom det använder masternodens NFS-tjänst.
      storageClassName: ""

    configMap:
      data:
        TZ: Asia/Shanghai
        # Databas- och Redis-konfigurationerna nedan använder PostgreSQL- och Redis-tjänsterna i klustret från dokumentet "Kubernetes Middleware Deployment".
        # Om er miljö redan har befintliga databas- och Redis-tjänster, ändra motsvarande konfigurationer nedan.
        CACHE_DEFAULT_STORE: redis
        # Använd en befintlig eller självdistribuerad Redis-tjänst.
        CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
        PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
        LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
        # Använd en befintlig eller självdistribuerad PostgreSQL-tjänst.
        DB_DATABASE: nocobase
        DB_DIALECT: postgres
        DB_HOST: "postgres-0.postgres-service"
        DB_PASSWORD: nocobase123
        DB_PORT: "5432"
        DB_UNDERSCORED: "true"
        DB_USER: nocobase
        # användarnamn för tjänsteplattform
        NOCOBASE_PKG_USERNAME: "<your user>"
        # lösenord för tjänsteplattform
        NOCOBASE_PKG_PASSWORD: "<your password>"

        # ... övriga miljövariabler
    ```

2. Kör `helm install`-kommandot för att påbörja installationen.

    ```bash
    helm install nocobase nocobase/nocobase --values values.yaml
    ```