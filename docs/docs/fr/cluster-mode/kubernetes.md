# Déploiement Kubernetes

Ce document vous guide pour déployer rapidement NocoBase en mode cluster dans un environnement Kubernetes. Nous partons du principe que vous êtes familier avec Kubernetes et que vous avez effectué les étapes des [Préparatifs](./preparations.md).

:::info{title="Conseil"}
Pour une vérification rapide du processus de déploiement Kubernetes, l'environnement opérationnel de cet article est un cluster K3s à nœud unique (OS : Ubuntu). Ce guide est également valable pour les clusters Kubernetes standards. Si vous rencontrez des différences lors d'un déploiement sur un cluster Kubernetes standard, n'hésitez pas à nous en informer.
:::

## Environnement de cluster

Si vous disposez déjà d'un environnement de cluster Kubernetes, vous pouvez passer cette étape.

Préparez un serveur avec Debian / Ubuntu installé et exécutez-y un cluster K3s en mode nœud unique. Pour en savoir plus sur K3s, visitez le [site officiel de K3s](https://docs.k3s.io/zh/).

Voici les étapes à suivre :

1. Connectez-vous au serveur via SSH.
2. Utilisez le script officiel pour installer le nœud maître du cluster K3s sur le serveur.

```bash
# Après l'installation, le fichier kubeconfig par défaut est /etc/rancher/k3s/k3s.yaml
curl -sfL https://get.k3s.io | sh -
```

```bash
# Vérifiez que la configuration est correcte
kubectl get node
```

## Déploiement de l'application en cluster

Déployez l'application NocoBase en mode cluster sur un cluster Kubernetes.

### Variables d'environnement

Généralement, il est recommandé de séparer les variables d'environnement du fichier de configuration de déploiement de l'application. Cet article utilise un ConfigMap comme exemple d'orchestration. En production, vous pouvez utiliser des Secrets pour séparer davantage les informations sensibles.

Voici les étapes à suivre :

1. Créez un fichier `nocobase-cm.yaml`.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nocobase-config
data:
  TZ: Asia/Shanghai # Définissez votre fuseau horaire, par exemple, Europe/Paris
  # Les configurations de base de données et Redis ci-dessous utilisent les services PostgreSQL et Redis du cluster, comme décrit dans le document "Déploiement de middleware K8S".
  # Si votre environnement dispose déjà de services de base de données et Redis existants, modifiez simplement les configurations correspondantes ci-dessous.
  CACHE_DEFAULT_STORE: redis
  # Utilisez un service Redis existant ou déployé par vous-même.
  CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
  PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
  LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
  # Utilisez un service PostgreSQL existant ou déployé par vous-même.
  DB_DATABASE: nocobase
  DB_DIALECT: postgres
  DB_HOST: "postgres-0.postgres-service"
  DB_PASSWORD: nocobase123
  DB_PORT: "5432"
  DB_UNDERSCORED: "true"
  DB_USER: nocobase
  # nom d'utilisateur de la plateforme de service
  NOCOBASE_PKG_USERNAME: "<your user>"
  # mot de passe de la plateforme de service
  NOCOBASE_PKG_PASSWORD: "<your password>"

  # ... autres variables d'environnement
```

2. Exécutez la commande `kubectl` pour déployer le ConfigMap.

```bash
kubectl apply -f nocobase-cm.yaml
```

### Stockage partagé

Les différents nœuds d'une application NocoBase déployée en mode cluster doivent monter le même répertoire de stockage (`storage`). Pour cela, vous devez créer un volume persistant (Persistent Volume - PV) qui prend en charge l'accès en lecture-écriture depuis plusieurs nœuds (ReadWriteMany). Généralement, vous créez un disque cloud sur la plateforme de votre fournisseur de services cloud et le liez en tant que PV, ou vous pouvez monter un répertoire de stockage partagé en utilisant d'autres méthodes comme NFS.

### Déploiement de l'application

Pour le déploiement initial, commencez par un seul nœud. Une fois terminé, vous pourrez ensuite augmenter le nombre de nœuds.

1. Créez un fichier `nocobase-apps.yaml`.

```yaml
# Crée un PVC. Plusieurs Pods déployés par le déploiement ci-dessous monteront le même répertoire de stockage persistant via ce PVC.
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
  storageClassName: "" # Définissez explicitement à vide car l'exemple utilise le service NFS du nœud maître, évitant ainsi la StorageClass par défaut.
---
# Le Service de l'application, qui fournit des services en dehors du cluster après avoir été lié à un Ingress.
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
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Le déploiement de l'application, qui peut déployer plusieurs conteneurs d'application.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nocobase
spec:
  replicas: 1 # Déploiement initial avec un seul nœud.
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
          # Charge les variables d'environnement à partir du ConfigMap précédemment déployé.
          envFrom:
            - configMapRef:
                name: nocobase-config
          volumeMounts:
            - name: nocobase-data
              mountPath: /app/nocobase/storage
          # Déclare les requêtes et limites de ressources pour le service.
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          # Commande de sonde de liveness. Le cluster l'utilise pour déterminer si le Pod doit être redémarré.
          livenessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 60
          # Commande de sonde de readiness. Le cluster l'utilise pour déterminer s'il faut diriger le trafic du Service vers le Pod.
          readinessProbe:
            httpGet:
              path: /api/__health_check
              port: 13000
            initialDelaySeconds: 30
      # Monte le stockage persistant via le PVC.
      volumes:
        - name: nocobase-data
          persistentVolumeClaim:
            claimName: nocobase-pvc
```

2. Exécutez la commande `kubectl` pour déployer le service d'application NocoBase.

```bash
kubectl apply -f nocobase-apps.yaml
```

3. Vérifiez l'état du service d'application NocoBase.

```bash
# Vérifiez l'état des Pods du service NocoBase
kubectl get pods -l app=nocobase
```

Voici un exemple de sortie. Un `STATUS` à `Running` indique que le service a démarré avec succès :

```text
NAME                        READY   STATUS    RESTARTS   AGE
nocobase-5558b774d7-w6swf   1/1     Running   0          7h6m
```

4. Lors du premier démarrage de l'application, vous devrez activer manuellement les **plugins** suivants dans l'interface d'administration :

- @nocobase/plugin-sync-adapter-redis
- @nocobase/plugin-lock-adapter-redis

Après cela, vous pourrez procéder à la mise à l'échelle. Par exemple, pour passer à 4 nœuds :

```bash
kubectl scale deployment nocobase --replicas=4
```

## Modifications de l'application

Les modifications d'application désignent les situations suivantes :

- Mise à niveau de la version de l'application
- Installation de nouveaux **plugins**
- Activation de **plugins**

NocoBase ne prend pas encore en charge la synchronisation automatique des modifications entre plusieurs instances de cluster pour les scénarios ci-dessus. Vous devrez donc les gérer manuellement en suivant les étapes ci-dessous. Ces étapes ne concernent que les modifications du service d'application. Avant d'effectuer toute modification, veuillez sauvegarder votre base de données et votre stockage persistant.

### Mise à niveau progressive de la version de l'application

1. Exécutez la commande `kubectl set image` pour modifier la version de l'image du conteneur du déploiement.

    ```bash
    kubectl set image deployment/nocobase nocobase=nocobase/nocobase:1.7
    ```

2. Vérifiez l'état de la mise à jour progressive.

    ```bash
    # Vérifiez la progression globale de la mise à jour progressive du déploiement
    kubectl rollout status deployment/nocobase

    # Vérifiez l'état de chaque Pod
    kubectl get pods -l app=nocobase
    ```

Si vous rencontrez des problèmes pendant ou après la mise à niveau de la version de l'application et que vous devez revenir à une version précédente, exécutez la commande suivante pour annuler la version de l'image du conteneur :

```bash
kubectl rollout undo deployment/nocobase
```

### Redémarrage en douceur de l'application

Après l'installation ou l'activation de nouveaux **plugins**, vous devrez actualiser la configuration ou l'état de l'application. Vous pouvez utiliser la commande suivante pour redémarrer chaque Pod en douceur.

1. Exécutez la commande `kubectl rollout restart`.

    ```bash
    kubectl rollout restart deployment/nocobase
    ```

2. Vérifiez l'état du redémarrage progressif.

    ```bash
    # Vérifiez la progression globale du redémarrage du déploiement
    kubectl rollout status deployment/nocobase

    # Vérifiez l'état de chaque Pod
    kubectl get pods -l app=nocobase
    ```

## Passerelle d'application

Pour qu'une application déployée dans un cluster Kubernetes soit accessible depuis l'extérieur, vous devez lier un Ingress au Service de l'application. L'environnement de cluster utilisé dans cet article est K3s, qui est livré avec Traefik comme contrôleur Ingress par défaut.

### Traefik IngressRoute

Voici les étapes à suivre :

1. Créez un fichier `nocobase-ingress.yaml`.

    ```yaml
    apiVersion: traefik.containo.us/v1alpha1
    kind: IngressRoute
    metadata:
      name: nocobase-ingress
    spec:
      entryPoints:
        - web
      routes:
        # Ici, 'nocobase.local' doit être remplacé par un nom de domaine réel pointant vers l'adresse IP du cluster.
        # Si vous n'avez pas de domaine pour la vérification, vous pouvez modifier votre fichier hosts local pour ajouter une entrée pour nocobase.local pointant vers l'adresse IP du cluster.
        # Vous pourrez alors accéder à l'application NocoBase dans le cluster en ouvrant http://nocobase.local dans votre navigateur.
        - match: Host(`nocobase.local`)
          kind: Rule
          services:
            # Ce Service est celui créé lors du déploiement de l'application nocobase dans la section "Déploiement d'application" ci-dessus.
            - name: nocobase
              port: 13000
    ```

2. Exécutez la commande `kubectl` pour déployer l'Ingress de l'application NocoBase.

```bash
kubectl apply -f nocobase-ingress.yaml
```

### Ingress-Nginx

La plupart des clusters Kubernetes utilisent Ingress-Nginx comme contrôleur Ingress. Voici un fichier `nocobase-ingress.yaml` basé sur Ingress-Nginx :

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: nginx
  name: nocobase-ingress
spec:
  rules:
    # Ici, 'nocobase.local' doit être remplacé par un nom de domaine réel pointant vers l'adresse IP du cluster.
    # Si vous n'avez pas de domaine pour la vérification, vous pouvez modifier votre fichier hosts local pour ajouter une entrée pour nocobase.local pointant vers l'adresse IP du cluster.
    # Vous pourrez alors accéder à l'application NocoBase dans le cluster en ouvrant http://nocobase.local dans votre navigateur.
    - host: nocobase.local
      http:
        paths:
          - backend:
              serviceName: nocobase
              servicePort: 13000
```

## Utilisation des Charts Helm

Nous avons créé des Charts Helm pour l'application NocoBase, vous permettant de déployer le service d'application NocoBase dans Kubernetes à l'aide de l'interface de ligne de commande (CLI) Helm.

### Prérequis

Assurez-vous que les clients tels que `kubectl` et `helm` sont installés dans votre environnement d'exploitation et que `kubectl` peut se connecter correctement au cluster cible.

### Ajout du dépôt

Ajoutez le dépôt des Charts Helm de NocoBase :

```bash
# Ajoutez le dépôt des Charts Helm de NocoBase
helm repo add nocobase https://nocobase.github.io/helm-charts

# Mettez à jour l'index Helm
helm repo update
```

### Déploiement Helm

1.  Créez un fichier `values.yaml`.

    ```yaml
    persistent:
      # Taille requise pour le stockage partagé du cluster NocoBase
      size: 10Gi
      # Classe de stockage fournie par le service Kubernetes du fournisseur cloud
      # Comme dans la section "Déploiement d'application", ceci est explicitement défini à vide car il utilise le service NFS du nœud maître.
      storageClassName: ""

    configMap:
      data:
        TZ: Asia/Shanghai # Définissez votre fuseau horaire, par exemple, Europe/Paris
        # Les configurations de base de données et Redis ci-dessous utilisent les services PostgreSQL et Redis du cluster, comme décrit dans le document "Déploiement de middleware K8S".
        # Si votre environnement dispose déjà de services de base de données et Redis existants, modifiez simplement les configurations correspondantes ci-dessous.
        CACHE_DEFAULT_STORE: redis
        # Utilisez un service Redis existant ou déployé par vous-même.
        CACHE_REDIS_URL: "redis://redis-0.redis-service:6379/0"
        PUBSUB_ADAPTER_REDIS_URL: "redis://redis-0.redis-service:6379/1"
        LOCK_ADAPTER_REDIS_URL: "redis:/redis-0.redis-service:6379/2"
        # Utilisez un service PostgreSQL existant ou déployé par vous-même.
        DB_DATABASE: nocobase
        DB_DIALECT: postgres
        DB_HOST: "postgres-0.postgres-service"
        DB_PASSWORD: nocobase123
        DB_PORT: "5432"
        DB_UNDERSCORED: "true"
        DB_USER: nocobase
        # nom d'utilisateur de la plateforme de service
        NOCOBASE_PKG_USERNAME: "<your user>"
        # mot de passe de la plateforme de service
        NOCOBASE_PKG_PASSWORD: "<your password>"

        # ... autres variables d'environnement
    ```

2.  Exécutez la commande `helm install` pour lancer l'installation.

    ```bash
    helm install nocobase nocobase/nocobase --values values.yaml
    ```