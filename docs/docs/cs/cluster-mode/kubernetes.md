:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Nasazení v Kubernetes

Tento článek vás provede rychlým nasazením NocoBase v klastrovém režimu v prostředí Kubernetes. Předpokládá se, že jste obeznámeni s prostředím Kubernetes a dokončili jste kroky v [Přípravách](./preparations.md).

:::info{title="Tip"}
Pro rychlé ověření procesu nasazení v Kubernetes je operační prostředí v tomto článku jedinouzelový K3s klastr (OS: Ubuntu). Tento průvodce je použitelný i pro standardní klastry Kubernetes. Pokud při nasazení ve standardním klastru Kubernetes narazíte na odlišnosti od tohoto článku, dejte nám prosím vědět.
:::

## Prostředí klastru

Pokud již máte prostředí klastru Kubernetes, můžete tento krok přeskočit.

Připravte server s nainstalovaným Debianem / Ubuntu a spusťte na něm K3s klastr v režimu jednoho uzlu. Více informací o K3s naleznete na [oficiálních stránkách K3s](https://docs.k3s.io/zh/).

Kroky:

1. SSH přihlášení na server.
2. Na serveru použijte oficiální skript k instalaci hlavního uzlu K3s klastru.

```bash
# Po instalaci je výchozí soubor kubeconfig /etc/rancher/k3s/k3s.yaml
curl -sfL https://get.k3s.io | sh -
```

```bash
# Ověřte, zda je konfigurace správná
kubectl get node
```

## Nasazení aplikace v klastru

Nasaďte aplikaci NocoBase v klastrovém režimu na klastr Kubernetes.

### Proměnné prostředí

Proměnné prostředí by měly být obvykle odděleny od konfiguračního souboru nasazení aplikace. Tento článek používá ConfigMap jako příklad. V produkčním prostředí můžete použít Secrets k dalšímu oddělení citlivých informací.

Kroky:

1. Vytvořte soubor `nocobase-cm.yaml`.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nocobase-config
data:
  TZ: Asia/Shanghai
  # Níže uvedené konfigurace databáze a Redis používají služby PostgreSQL a Redis v klastru z dokumentu „Nasazení middleware v Kubernetes“.
  # Pokud vaše prostředí již má existující databázové a Redis služby, upravte níže odpovídající konfigurace.
  CACHE_DEFAULT_STORE: redis
  # Použijte existující nebo samostatně nasazenou službu Redis.
  CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
  PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
  LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
  # Použijte existující nebo samostatně nasazenou službu PostgreSQL.
  DB_DATABASE: nocobase
  DB_DIALECT: postgres
  DB_HOST: "postgres-0.postgres-service"
  DB_PASSWORD: nocobase123
  DB_PORT: "5432"
  DB_UNDERSCORED: "true"
  DB_USER: nocobase
  # uživatelské jméno servisní platformy
  NOCOBASE_PKG_USERNAME: "<your user>"
  # heslo servisní platformy
  NOCOBASE_PKG_PASSWORD: "<your password>"

  # ... další proměnné prostředí
```

2. Spusťte příkaz `kubectl` k nasazení ConfigMap.

```bash
kubectl apply -f nocobase-cm.yaml
```

### Sdílené úložiště

Různé uzly aplikace NocoBase nasazené v klastrovém režimu musí připojit stejný adresář úložiště (`storage`). K tomu je třeba vytvořit Persistent Volume (PV), který podporuje čtení a zápis z více uzlů (ReadWriteMany). Obvykle byste vytvořili cloudový disk na platformě vašeho poskytovatele cloudu a připojili jej jako PV, nebo můžete připojit sdílený adresář úložiště jinými metodami, jako je NFS.

### Nasazení aplikace

Pro počáteční nasazení začněte s jedním uzlem. Po dokončení můžete škálovat na více uzlů.

1. Vytvořte soubor `nocobase-apps.yaml`.

```yaml
# Vytvořte PVC. Více Podů nasazených níže uvedeným Deploymentem připojí stejný adresář trvalého úložiště prostřednictvím tohoto PVC.
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
  storageClassName: "" # Příklad používá službu NFS hlavního uzlu, proto je explicitně nastaveno na prázdné, aby se zabránilo použití výchozí StorageClass.
---
# Service aplikace, která po navázání na Ingress poskytuje služby mimo klastr.
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
# Deployment aplikace, který může nasadit více kontejnerů aplikace.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nocobase
spec:
  replicas: 1 # Počáteční nasazení pouze s jedním uzlem.
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
          # Načtěte proměnné prostředí z dříve nasazené ConfigMap.
          envFrom:
            - configMapRef:
                name: nocobase-config
          volumeMounts:
            - name: nocobase-data
              mountPath: /app/nocobase/storage
          # Deklarujte požadavky a limity na zdroje pro službu.
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          # Příkaz pro kontrolu životnosti (liveness probe). Klastr jej používá k určení, zda je třeba Pod restartovat.
          livenessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 60
          # Příkaz pro kontrolu připravenosti (readiness probe). Klastr jej používá k určení, zda má směrovat provoz Service do Podu.
          readinessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 30
      # Připojte trvalé úložiště přes PVC.
      volumes:
        - name: nocobase-data
          persistentVolumeClaim:
            claimName: nocobase-pvc
```

2. Spusťte příkaz `kubectl` k nasazení služby aplikace NocoBase.

```bash
kubectl apply -f nocobase-apps.yaml
```

3. Ověřte stav služby aplikace NocoBase.

```bash
# Zkontrolujte stav Podů služby NocoBase
kubectl get pods -l app=nocobase
```

Příklad výstupu je následující. `STATUS` `Running` znamená, že služba byla úspěšně spuštěna:

```text
NAME                        READY   STATUS    RESTARTS   AGE
nocobase-5558b774d7-w6swf   1/1     Running   0          7h6m
```

4. Při prvním spuštění musíte ručně povolit následující pluginy v administračním rozhraní:

- @nocobase/plugin-sync-adapter-redis
- @nocobase/plugin-lock-adapter-redis

Poté můžete škálovat. Například škálování na 4 uzly:

```bash
kubectl scale deployment nocobase --replicas=4
```

## Změny aplikace

Změny aplikace se týkají následujících situací:

- Upgrade verze aplikace
- Instalace nových pluginů
- Aktivace pluginů

NocoBase zatím nepodporuje automatickou synchronizaci změn napříč více instancemi v klastru pro výše uvedené scénáře. Proto je musíte řešit ručně podle níže uvedených kroků. Tyto kroky se týkají pouze změn služby aplikace. Před provedením jakýchkoli změn si prosím sami zálohujte databázi a trvalé úložiště.

### Průběžný upgrade verze aplikace

1. Spusťte příkaz `kubectl set image` pro změnu verze obrazu kontejneru Deploymentu.

    ```bash
    kubectl set image deployment/nocobase nocobase=nocobase/nocobase:1.7
    ```

2. Zkontrolujte stav průběžné aktualizace.

    ```bash
    # Zkontrolujte celkový průběh průběžné aktualizace Deploymentu
    kubectl rollout status deployment/nocobase

    # Zkontrolujte stav každého Podu
    kubectl get pods -l app=nocobase
    ```

Pokud narazíte na jakékoli problémy během nebo po upgradu verze aplikace a potřebujete se vrátit k předchozí verzi, spusťte následující příkaz pro vrácení verze obrazu kontejneru:

```bash
kubectl rollout undo deployment/nocobase
```

### Elegantní restart aplikace

Po instalaci nebo aktivaci nových pluginů je třeba aktualizovat konfiguraci nebo stav aplikace. Můžete použít následující příkaz k elegantnímu restartování každého Podu.

1. Spusťte příkaz `kubectl rollout restart`.

    ```bash
    kubectl rollout restart deployment/nocobase
    ```

2. Zkontrolujte stav průběžného restartu.

    ```bash
    # Zkontrolujte celkový průběh restartu Deploymentu
    kubectl rollout status deployment/nocobase

    # Zkontrolujte stav každého Podu
    kubectl get pods -l app=nocobase
    ```

## Aplikační brána

Aby byla aplikace nasazená v klastru Kubernetes přístupná zvenčí, je třeba k Service aplikace připojit Ingress. Prostředí klastru použité v tomto článku je K3s, který má Traefik jako výchozí Ingress Controller.

### Traefik IngressRoute

Kroky:

1. Vytvořte soubor `nocobase-ingress.yaml`.

    ```yaml
    apiVersion: traefik.containo.us/v1alpha1
    kind: IngressRoute
    metadata:
      name: nocobase-ingress
    spec:
      entryPoints:
        - web
      routes:
        # Zde by 'nocobase.local' mělo být nahrazeno skutečným názvem domény směřujícím na IP adresu klastru.
        # Pokud nemáte doménu pro ověření, můžete upravit svůj lokální soubor hosts a přidat záznam pro nocobase.local směřující na IP adresu klastru.
        # Poté můžete přistupovat k aplikaci NocoBase v klastru otevřením http://nocobase.local ve svém prohlížeči.
        - match: Host(`nocobase.local`)
          kind: Rule
          services:
            # Toto je Service vytvořená při nasazování aplikace nocobase v sekci „Nasazení aplikace“ výše.
            - name: nocobase
              port: 13000
    ```

2. Spusťte příkaz `kubectl` k nasazení Ingress pro aplikaci NocoBase.

```bash
kubectl apply -f nocobase-ingress.yaml
```

### Ingress-Nginx

Většina klastrů Kubernetes používá Ingress-Nginx jako Ingress Controller. Níže je soubor `nocobase-ingress.yaml` založený na Ingress-Nginx:

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
  name: nocobase-ingress
spec:
  rules:
    # Zde by 'nocobase.local' mělo být nahrazeno skutečným názvem domény směřujícím na IP adresu klastru.
    # Pokud nemáte doménu pro ověření, můžete upravit svůj lokální soubor hosts a přidat záznam pro nocobase.local směřující na IP adresu klastru.
    # Poté můžete přistupovat k aplikaci NocoBase v klastru otevřením http://nocobase.local ve svém prohlížeči.
    - host: nocobase.local
      http:
        paths:
          - backend:
              serviceName: nocobase
              servicePort: 13000
```

## Použití Helm Charts

Vytvořili jsme Helm Charts pro aplikaci NocoBase, což vám umožňuje nasadit službu aplikace NocoBase v Kubernetes pomocí Helm CLI.

### Předpoklady

Ujistěte se, že jsou ve vašem operačním prostředí nainstalovány klienti jako `kubectl` a `helm` a že se `kubectl` může správně připojit k cílovému klastru.

### Přidání repozitáře

Přidejte repozitář Helm Charts pro NocoBase:

```bash
# Přidejte repozitář Helm Charts pro NocoBase
helm repo add nocobase https://nocobase.github.io/helm-charts

# Aktualizujte index Helm
helm repo update
```

### Nasazení pomocí Helm

1.  Vytvořte soubor `values.yaml`.

    ```yaml
    persistent:
      # Požadovaná velikost pro sdílené úložiště klastru NocoBase
      size: 10Gi
      # Třída úložiště poskytovaná službou Kubernetes cloudového poskytovatele
      # Stejně jako v sekci „Nasazení aplikace“ je zde explicitně nastaveno na prázdné, protože používá službu NFS hlavního uzlu.
      storageClassName: ""

    configMap:
      data:
        TZ: Asia/Shanghai
        # Níže uvedené konfigurace databáze a Redis používají služby PostgreSQL a Redis v klastru z dokumentu „Nasazení middleware v Kubernetes“.
        # Pokud vaše prostředí již má existující databázové a Redis služby, upravte níže odpovídající konfigurace.
        CACHE_DEFAULT_STORE: redis
        # Použijte existující nebo samostatně nasazenou službu Redis.
        CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
        PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
        LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
        # Použijte existující nebo samostatně nasazenou službu PostgreSQL.
        DB_DATABASE: nocobase
        DB_DIALECT: postgres
        DB_HOST: "postgres-0.postgres-service"
        DB_PASSWORD: nocobase123
        DB_PORT: "5432"
        DB_UNDERSCORED: "true"
        DB_USER: nocobase
        # uživatelské jméno servisní platformy
        NOCOBASE_PKG_USERNAME: "<your user>"
        # heslo servisní platformy
        NOCOBASE_PKG_PASSWORD: "<your password>"

        # ... další proměnné prostředí
    ```

2.  Spusťte příkaz `helm install` pro zahájení instalace.

    ```bash
    helm install nocobase nocobase/nocobase --values values.yaml
    ```