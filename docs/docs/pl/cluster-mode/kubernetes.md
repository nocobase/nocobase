
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Wdrożenie w Kubernetes

Ten artykuł ma na celu szybkie przeprowadzenie Państwa przez proces wdrożenia NocoBase w trybie klastrowym w środowisku Kubernetes. Zakłada się, że są Państwo zaznajomieni ze środowiskiem Kubernetes i ukończyli Państwo kroki opisane w [Przygotowaniach](./preparations.md).

:::info{title="Wskazówka"}
Aby szybko zweryfikować proces wdrożenia w Kubernetes, środowisko operacyjne w tym artykule to klaster K3s z jednym węzłem (system operacyjny: Ubuntu). Ten przewodnik jest również odpowiedni dla standardowych klastrów Kubernetes. Jeśli napotkają Państwo jakiekolwiek rozbieżności podczas wdrażania w standardowym klastrze Kubernetes, prosimy o kontakt.
:::

## Środowisko klastrowe

Jeśli posiadają już Państwo środowisko klastrowe Kubernetes, mogą Państwo pominąć ten krok.

Proszę przygotować serwer z zainstalowanym systemem Debian / Ubuntu i uruchomić na nim klaster K3s w trybie pojedynczego węzła. Aby dowiedzieć się więcej o K3s, proszę odwiedzić [oficjalną stronę K3s](https://docs.k3s.io/zh/).

Kroki:

1.  Proszę zalogować się do serwera przez SSH.
2.  Proszę użyć oficjalnego skryptu do zainstalowania węzła głównego klastra K3s na serwerze.

```bash
# Po instalacji domyślny plik kubeconfig to /etc/rancher/k3s/k3s.yaml
curl -sfL https://get.k3s.io | sh -
```

```bash
# Proszę zweryfikować poprawność konfiguracji
kubectl get node
```

## Wdrożenie aplikacji w klastrze

Proszę wdrożyć aplikację NocoBase w trybie klastrowym w klastrze Kubernetes.

### Zmienne środowiskowe

Zazwyczaj zmienne środowiskowe powinny być oddzielone od pliku konfiguracyjnego wdrożenia aplikacji. W tym artykule używamy ConfigMap jako przykładu orkiestracji. W środowisku produkcyjnym mogą Państwo użyć Secrets do dalszego oddzielenia wrażliwych informacji.

Kroki:

1.  Proszę utworzyć plik `nocobase-cm.yaml`.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nocobase-config
data:
  TZ: Asia/Shanghai
  # Poniższe konfiguracje bazy danych i Redis wykorzystują usługi PostgreSQL i Redis w klastrze, opisane w dokumencie „Wdrożenie oprogramowania pośredniczącego w Kubernetes”.
  # Jeśli w Państwa środowisku istnieją już inne usługi bazy danych i Redis, proszę zmodyfikować poniższe odpowiednie konfiguracje bazy danych i Redis.
  CACHE_DEFAULT_STORE: redis
  # Proszę użyć istniejącej lub samodzielnie wdrożonej usługi Redis.
  CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
  PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
  LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
  # Proszę użyć istniejącej lub samodzielnie wdrożonej usługi PostgreSQL.
  DB_DATABASE: nocobase
  DB_DIALECT: postgres
  DB_HOST: "postgres-0.postgres-service"
  DB_PASSWORD: nocobase123
  DB_PORT: "5432"
  DB_UNDERSCORED: "true"
  DB_USER: nocobase
  # nazwa użytkownika platformy serwisowej
  NOCOBASE_PKG_USERNAME: "<your user>"
  # hasło platformy serwisowej
  NOCOBASE_PKG_PASSWORD: "<your password>"

  # ... inne zmienne środowiskowe
```

2.  Proszę uruchomić polecenie `kubectl`, aby wdrożyć ConfigMap.

```bash
kubectl apply -f nocobase-cm.yaml
```

### Współdzielona pamięć masowa

Różne węzły aplikacji NocoBase wdrożonej w trybie klastrowym muszą montować ten sam katalog pamięci masowej (`storage`). W tym celu należy utworzyć wolumin trwały (Persistent Volume), który obsługuje odczyt i zapis z wielu węzłów (ReadWriteMany). Zazwyczaj należy utworzyć dysk w chmurze na platformie dostawcy usług chmurowych i powiązać go jako PV, lub można zamontować współdzielony katalog pamięci masowej za pomocą innych metod, takich jak NFS.

### Wdrożenie aplikacji

Przy pierwszym wdrożeniu aplikacji należy zacząć od jednego węzła, a po jego zakończeniu skalować i uruchomić wiele węzłów.

1.  Proszę utworzyć plik `nocobase-apps.yaml`.

```yaml
# Proszę utworzyć PVC. Wiele Podów wdrożonych przez poniższy Deployment będzie montować ten sam katalog trwałej pamięci masowej za pośrednictwem tego PVC.
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
  storageClassName: "" # Przykład używa usługi NFS węzła głównego, dlatego jawnie ustawiono na puste, aby uniknąć użycia domyślnej StorageClass.
---
# Usługa aplikacji, która po powiązaniu z Ingress będzie świadczyć usługi poza klastrem.
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
# Deployment aplikacji, który może wdrożyć wiele kontenerów aplikacji.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nocobase
spec:
  replicas: 1 # Pierwsze wdrożenie tylko z jednym węzłem.
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
          # Zmienne środowiskowe ładowane z wcześniej wdrożonego ConfigMap.
          envFrom:
            - configMapRef:
                name: nocobase-config
          volumeMounts:
            - name: nocobase-data
              mountPath: /app/nocobase/storage
          # Proszę zadeklarować wymagania i limity zasobów dla działania usługi.
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          # Polecenie sondy żywotności. Klaster używa go do określenia, czy Pod wymaga ponownego uruchomienia.
          livenessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 60
          # Polecenie sondy gotowości. Klaster używa go do określenia, czy przekierować ruch Service do Podu.
          readinessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 30
      # Proszę zamontować trwałą pamięć masową za pośrednictwem PVC.
      volumes:
        - name: nocobase-data
          persistentVolumeClaim:
            claimName: nocobase-pvc
```

2.  Proszę uruchomić polecenie `kubectl`, aby wdrożyć usługę aplikacji NocoBase.

```bash
kubectl apply -f nocobase-apps.yaml
```

3.  Proszę zweryfikować status usługi aplikacji NocoBase.

```bash
# Proszę sprawdzić status Podów usługi NocoBase
kubectl get pods -l app=nocobase
```

Przykładowy wynik jest następujący. `STATUS` jako `Running` oznacza, że usługa została uruchomiona pomyślnie:

```text
NAME                        READY   STATUS    RESTARTS   AGE
nocobase-5558b774d7-w6swf   1/1     Running   0          7h6m
```

4.  Przy pierwszym uruchomieniu aplikacji należy ręcznie włączyć następujące wtyczki w interfejsie administracyjnym:

-   @nocobase/plugin-sync-adapter-redis
-   @nocobase/plugin-lock-adapter-redis

Następnie można przeprowadzić skalowanie. Na przykład, aby skalować do 4 węzłów:

```bash
kubectl scale deployment nocobase --replicas=4
```

## Zmiany w aplikacji

Zmiany w aplikacji odnoszą się do następujących sytuacji:

-   Aktualizacja wersji aplikacji
-   Instalacja nowych wtyczek
-   Aktywacja wtyczek

NocoBase nie obsługuje jeszcze automatycznej synchronizacji zmian w wielu instancjach klastra dla powyższych scenariuszy. Dlatego należy je obsłużyć ręcznie, wykonując poniższe kroki. Poniższe kroki dotyczą tylko zmian w usłudze aplikacji. Przed wprowadzeniem zmian proszę samodzielnie wykonać kopie zapasowe bazy danych i trwałej pamięci masowej.

### Stopniowa aktualizacja wersji aplikacji

1.  Proszę uruchomić polecenie `kubectl set image`, aby zmienić wersję obrazu kontenera Deploymentu.

    ```bash
    kubectl set image deployment/nocobase nocobase=nocobase/nocobase:1.7
    ```

2.  Proszę sprawdzić status stopniowej aktualizacji.

    ```bash
    # Proszę sprawdzić ogólny postęp stopniowej aktualizacji Deploymentu
    kubectl rollout status deployment/nocobase

    # Proszę sprawdzić status każdego Podu
    kubectl get pods -l app=nocobase
    ```

Jeśli podczas lub po aktualizacji wersji aplikacji wystąpią nieprawidłowości i konieczny będzie powrót do poprzedniej wersji, proszę wykonać poniższe polecenie, aby przywrócić poprzednią wersję obrazu kontenera:

```bash
kubectl rollout undo deployment/nocobase
```

### Płynne ponowne uruchomienie aplikacji

Po zainstalowaniu lub aktywowaniu nowych wtyczek należy odświeżyć konfigurację lub stan aplikacji. Mogą Państwo użyć poniższego polecenia, aby płynnie ponownie uruchomić każdy Pod.

1.  Proszę uruchomić polecenie `kubectl rollout restart`.

    ```bash
    kubectl rollout restart deployment/nocobase
    ```

2.  Proszę sprawdzić status stopniowego ponownego uruchamiania.

    ```bash
    # Proszę sprawdzić ogólny postęp ponownego uruchamiania Deploymentu
    kubectl rollout status deployment/nocobase

    # Proszę sprawdzić status każdego Podu
    kubectl get pods -l app=nocobase
    ```

## Brama aplikacji

Aby aplikacja wdrożona w klastrze Kubernetes była dostępna z zewnątrz, należy powiązać Ingress z usługą aplikacji. Środowisko klastrowe użyte w tym artykule to K3s, a domyślnym komponentem Ingress Controller zainstalowanym w K3s jest Traefik.

### Traefik IngressRoute

Kroki:

1.  Proszę utworzyć plik `nocobase-ingress.yaml`.

    ```yaml
    apiVersion: traefik.containo.us/v1alpha1
    kind: IngressRoute
    metadata:
      name: nocobase-ingress
    spec:
      entryPoints:
        - web
      routes:
        # Tutaj 'nocobase.local' należy zastąpić prawdziwą nazwą domeny wskazującą na adres IP klastra.
        # Jeśli nie mają Państwo domeny do weryfikacji, mogą Państwo zmodyfikować lokalny plik hosts, dodając wpis dla nocobase.local wskazujący na adres IP klastra.
        # Następnie mogą Państwo uzyskać dostęp do aplikacji NocoBase w klastrze, otwierając http://nocobase.local w przeglądarce.
        - match: Host(`nocobase.local`)
          kind: Rule
          services:
            # To jest usługa (Service) utworzona podczas wdrażania aplikacji NocoBase w sekcji „Wdrożenie aplikacji”.
            - name: nocobase
              port: 13000
    ```

2.  Proszę uruchomić polecenie `kubectl`, aby wdrożyć Ingress dla aplikacji NocoBase.

```bash
kubectl apply -f nocobase-ingress.yaml
```

### Ingress-Nginx

Większość klastrów Kubernetes ma zainstalowany komponent Ingress Controller, którym jest Ingress-Nginx. Poniżej znajduje się plik `nocobase-ingress.yaml` oparty na Ingress-Nginx:

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
  name: nocobase-ingress
spec:
  rules:
    # Tutaj 'nocobase.local' należy zastąpić prawdziwą nazwą domeny wskazującą na adres IP klastra.
    # Jeśli nie mają Państwo domeny do weryfikacji, mogą Państwo zmodyfikować lokalny plik hosts, dodając wpis dla nocobase.local wskazujący na adres IP klastra.
    # Następnie mogą Państwo uzyskać dostęp do aplikacji NocoBase w klastrze, otwierając http://nocobase.local w przeglądarce.
    - host: nocobase.local
      http:
        paths:
          - backend:
              serviceName: nocobase
              servicePort: 13000
```

## Korzystanie z Helm Charts

Przygotowaliśmy Helm Charts dla aplikacji NocoBase, co pozwala na wdrożenie usługi aplikacji NocoBase w Kubernetes za pomocą Helm CLI.

### Wymagania wstępne

Proszę upewnić się, że w Państwa środowisku operacyjnym zainstalowano klientów takich jak `kubectl` i `helm` oraz że `kubectl` może poprawnie połączyć się z docelowym klastrem.

### Dodanie repozytorium

Proszę dodać repozytorium Helm Charts NocoBase:

```bash
# Proszę dodać repozytorium Helm Charts NocoBase
helm repo add nocobase https://nocobase.github.io/helm-charts

# Proszę zaktualizować indeks Helm
helm repo update
```

### Wdrożenie za pomocą Helm

1.  Proszę utworzyć plik `values.yaml`.

    ```yaml
    persistent:
      # Wymagany rozmiar współdzielonej pamięci masowej klastra NocoBase
      size: 10Gi
      # Klasa pamięci masowej dostarczana przez usługę Kubernetes w chmurze
      # Podobnie jak w sekcji „Wdrożenie aplikacji”, jawnie ustawiono na puste, ponieważ używa usługi NFS węzła głównego.
      storageClassName: ""

    configMap:
      data:
        TZ: Asia/Shanghai
        # Poniższe konfiguracje bazy danych i Redis wykorzystują usługi PostgreSQL i Redis w klastrze, opisane w dokumencie „Wdrożenie oprogramowania pośredniczącego w Kubernetes”.
        # Jeśli w Państwa środowisku istnieją już inne usługi bazy danych i Redis, proszę zmodyfikować poniższe odpowiednie konfiguracje bazy danych i Redis.
        CACHE_DEFAULT_STORE: redis
        # Proszę użyć istniejącej lub samodzielnie wdrożonej usługi Redis.
        CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
        PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
        LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
        # Proszę użyć istniejącej lub samodzielnie wdrożonej usługi PostgreSQL.
        DB_DATABASE: nocobase
        DB_DIALECT: postgres
        DB_HOST: "postgres-0.postgres-service"
        DB_PASSWORD: nocobase123
        DB_PORT: "5432"
        DB_UNDERSCORED: "true"
        DB_USER: nocobase
        # nazwa użytkownika platformy serwisowej
        NOCOBASE_PKG_USERNAME: "<your user>"
        # hasło platformy serwisowej
        NOCOBASE_PKG_PASSWORD: "<your password>"

        # ... inne zmienne środowiskowe
    ```

2.  Proszę uruchomić polecenie `helm install`, aby rozpocząć instalację.

    ```bash
    helm install nocobase nocobase/nocobase --values values.yaml
    ```