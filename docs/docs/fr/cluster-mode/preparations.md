:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Prérequis

Avant de déployer une application en mode cluster, vous devez effectuer les préparatifs suivants.

## Licence de plugin commercial

Pour fonctionner en mode cluster, une application NocoBase nécessite le support des plugins suivants :

| Fonctionnalité                 | Plugin                                                                              |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| Adaptateur de cache            | Intégré                                                                             |
| Adaptateur de signal de synchronisation | `@nocobase/plugin-pubsub-adapter-redis`                                             |
| Adaptateur de file d'attente de messages    | `@nocobase/plugin-queue-adapter-redis` ou `@nocobase/plugin-queue-adapter-rabbitmq` |
| Adaptateur de verrou distribué | `@nocobase/plugin-lock-adapter-redis`                                               |
| Allocateur d'ID de Worker      | `@nocobase/plugin-workerid-allocator-redis`                                         |

Tout d'abord, assurez-vous d'avoir obtenu les licences pour les plugins mentionnés ci-dessus (vous pouvez acheter les licences de plugin correspondantes via la plateforme de services de plugins commerciaux).

## Composants système

En plus des instances applicatives elles-mêmes, un déploiement en cluster nécessite également des composants système tels que la base de données, le middleware, le stockage partagé et l'équilibrage de charge. Chaque équipe peut choisir l'implémentation concrète de ces composants en fonction de son propre modèle d'exploitation.

### Base de données

Étant donné que le mode cluster actuel ne concerne que les instances d'application, la base de données ne prend en charge qu'un seul nœud pour le moment. Si vous utilisez une architecture de base de données telle que maître-esclave, vous devrez l'implémenter vous-même via un middleware et vous assurer qu'elle est transparente pour l'application NocoBase.

Si vous avez besoin d'un secours à chaud ou d'un plan de reprise après sinistre entre plusieurs zones de disponibilité ou régions, la stratégie de synchronisation et de bascule de la base de données doit être conçue et mise en œuvre par votre équipe d'exploitation.

### Middleware

Le mode cluster de NocoBase s'appuie sur plusieurs middlewares pour assurer la communication et la coordination entre les clusters, notamment :

- **Cache** : Utilise un middleware de cache distribué basé sur Redis pour améliorer la vitesse d'accès aux données.
- **Signal de synchronisation** : Utilise la fonctionnalité de stream de Redis pour la transmission des signaux de synchronisation entre les clusters.
- **File d'attente de messages** : Utilise un middleware de file d'attente de messages basé sur Redis ou RabbitMQ pour le traitement asynchrone des messages.
- **Verrou distribué** : Utilise un verrou distribué basé sur Redis pour sécuriser l'accès aux ressources partagées au sein du cluster.

Lorsque tous les middlewares utilisent Redis, vous pouvez démarrer un service Redis unique au sein du réseau interne du cluster (ou de Kubernetes). Vous pouvez également activer un service Redis distinct pour chaque fonctionnalité (cache, signal de synchronisation, file d'attente de messages et verrou distribué).

**Versions recommandées**

- Redis : >=8.0 ou une version de redis-stack incluant la fonctionnalité Bloom Filter.
- RabbitMQ : >=4.0

### Stockage partagé

NocoBase utilise le répertoire `storage` pour stocker les fichiers système, et le stockage partagé constitue également un composant obligatoire d'un déploiement en cluster. En mode multi-nœuds, vous pouvez choisir différentes implémentations selon votre environnement d'infrastructure, telles que des disques cloud, NFS ou EFS, afin de permettre un accès partagé entre plusieurs nœuds. Sans cela, les fichiers système ne seront pas synchronisés automatiquement et l'application ne pourra pas fonctionner correctement.

Lors d'un déploiement avec Kubernetes, veuillez consulter la section [Déploiement Kubernetes : Stockage partagé](./kubernetes#shared-storage).

#### Que trouve-t-on généralement dans le répertoire `storage` ?

Le contenu du répertoire `storage` varie selon les plugins activés et le mode de déploiement. D'après l'implémentation actuelle, on y trouve généralement :

| Chemin | Usage | Recommandation d'utilisation |
| --- | --- | --- |
| `storage/uploads` | Fichiers téléversés lorsque le mode de stockage local est utilisé | Dans les clusters de production, privilégiez un stockage objet tel que S3 / OSS / COS |
| `storage/plugins` | Paquets de plugins locaux installés, téléversés ou détectés à l'exécution | Si vous dépendez de plugins locaux, ce répertoire doit être partagé ; si les plugins sont déjà intégrés à l'image, cette dépendance peut être réduite |
| `storage/apps/<app>/jwt_secret.dat` | Secret de jeton par défaut généré automatiquement lorsque `APP_KEY` n'est pas configuré explicitement | Ne vous appuyez pas sur ce fichier en production ; configurez explicitement `APP_KEY` |
| `storage/apps/<app>/aes_key.dat` | Clé AES par défaut générée automatiquement lorsque `APP_AES_SECRET_KEY` n'est pas configuré explicitement | Ne vous appuyez pas sur ce fichier en production ; configurez explicitement `APP_AES_SECRET_KEY` |
| `storage/environment-variables/<app>/aes_key.dat` | Fichier de clé AES pour les scénarios liés au plugin de variables d'environnement | Il est recommandé de monter un fichier de clé en lecture seule |
| `storage/logs` | Répertoire de logs par défaut et certains journaux de migration | Il est recommandé d'intégrer une plateforme de logs externe à l'avenir |
| `storage/tmp` | Fichiers temporaires pour l'import, l'export, la migration, etc. | Peut être temporaire, mais s'il doit être réutilisé entre plusieurs nœuds, il doit être partagé, ou bien l'opération doit être limitée à un seul nœud d'administration |
| `storage/backups`, `storage/duplicator`, `storage/migration-manager` | Artefacts liés à la sauvegarde, à la restauration et à la migration | Ils doivent être considérés comme des répertoires d'exploitation, stockés de manière persistante et non modifiés de manière concurrente par plusieurs nœuds |

Le tableau ci-dessus n'est pas exhaustif, mais il illustre un point important : `storage` regroupe à la fois des fichiers métier, des fichiers de clés, des répertoires de plugins, des logs et des artefacts temporaires liés à l'exploitation. Par conséquent, dans un déploiement en cluster, la base habituelle consiste à partager et persister l'ensemble du répertoire `/app/nocobase/storage`.

#### Recommandations relatives au stockage

La cohérence du cluster dans NocoBase repose principalement sur la base de données, Redis, les files de messages et les verrous distribués, et non sur l'utilisation du système de fichiers partagé comme mécanisme de coordination à haute concurrence.

Par conséquent, il est recommandé :

- Pour les fichiers métier à forte fréquence tels que les pièces jointes, de privilégier un stockage objet. Il n'est pas recommandé de dépendre à long terme du stockage local dans les clusters de production.
- D'utiliser le stockage partagé principalement pour héberger le répertoire `storage`, et non comme service de stockage de fichiers à haut débit.
- D'effectuer les opérations telles que l'installation ou la mise à niveau de plugins, les sauvegardes, les restaurations et les migrations uniquement après avoir réduit le cluster à un seul nœud ; une fois l'opération terminée, le cluster peut être remis à l'échelle.

### Équilibrage de charge

Le mode cluster nécessite un équilibreur de charge pour distribuer les requêtes, effectuer les vérifications de santé des instances d'application et gérer le basculement en cas de défaillance. Cette partie doit être choisie et configurée en fonction des besoins opérationnels de votre équipe.

À titre d'exemple, pour un Nginx auto-hébergé, ajoutez le contenu suivant à votre fichier de configuration :

```
upstream myapp {
    server 172.31.0.1:13000; # Nœud interne 1
    server 172.31.0.2:13000; # Nœud interne 2
    server 172.31.0.3:13000; # Nœud interne 3
}

server {
    listen 80;

    location / {
        # Utilise l'upstream défini pour l'équilibrage de charge
        proxy_pass http://myapp;
        # ... Autres configurations
    }
}
```

Cela signifie que les requêtes sont redirigées et distribuées aux différents nœuds du serveur pour traitement.

Pour les middlewares d'équilibrage de charge fournis par d'autres fournisseurs de services cloud, veuillez consulter la documentation de configuration spécifique à chaque fournisseur.

Pour les déploiements à haute disponibilité, il est recommandé :

- D'exécuter au moins 2 instances applicatives au sein d'un même cluster et de laisser l'équilibreur de charge gérer le basculement des instances.
- Que la vérification d'état de l'équilibreur de charge reflète la disponibilité réelle de l'application, et pas seulement l'ouverture du port.
- Si vous avez besoin d'un secours à chaud entre plusieurs zones de disponibilité ou régions, il faut généralement déployer plusieurs clusters indépendants, et l'équipe d'exploitation doit prendre en charge la synchronisation et la bascule de la base de données, du stockage partagé et du reste de l'infrastructure.

## Configuration des variables d'environnement

Tous les nœuds du cluster doivent utiliser la même configuration de variables d'environnement. En plus des [variables d'environnement](/api/cli/env) de base de NocoBase, vous devez également configurer les variables d'environnement suivantes, liées aux middlewares.

### Secrets clés

En plus des variables d'environnement liées au middleware, tous les nœuds du cluster doivent également configurer explicitement les mêmes secrets clés :

```ini
APP_KEY=
APP_AES_SECRET_KEY=
# Ou utiliser un fichier de clé monté en lecture seule
# APP_AES_SECRET_KEY_PATH=
```

- `APP_KEY` est utilisé pour la signature des tokens / JWT. S'il n'est pas configuré explicitement, l'application utilise le fichier de secret par défaut situé dans `storage`.
- `APP_AES_SECRET_KEY` est utilisé pour déchiffrer les champs sensibles dans la base de données. S'il n'est pas configuré explicitement, l'application utilise également le fichier de secret par défaut situé dans `storage`.
- Dans des conteneurs éphémères ou des déploiements multi-nœuds, le fait de dépendre de fichiers de secrets locaux générés automatiquement peut rendre les tokens invalides après un redémarrage ou empêcher le déchiffrement des données historiques chiffrées.

:::info{title=Conseil}
`APP_AES_SECRET_KEY` doit être une clé AES-256 de 32 octets, représentée par 64 caractères hexadécimaux.

Dans les environnements cloud, il est recommandé de gérer centralement ces valeurs via des services tels que Secrets Manager, SSM Parameter Store, Kubernetes Secret ou un fichier de clé monté en lecture seule.
:::

### Mode multi-cœur

Lorsque l'application s'exécute sur un nœud multi-cœur, vous pouvez activer le mode multi-cœur du nœud :

```ini
# Active le mode multi-cœur de PM2
# CLUSTER_MODE=max # Désactivé par défaut, nécessite une configuration manuelle
```

Si vous déployez des pods d'application dans Kubernetes, vous pouvez ignorer cette configuration et contrôler le nombre d'instances d'application via le nombre de réplicas de pods.

### Cache

```ini
# Adaptateur de cache : en mode cluster, doit être défini sur redis (par défaut, si non spécifié, utilise la mémoire)
CACHE_DEFAULT_STORE=redis

# URL de connexion de l'adaptateur de cache Redis, doit être renseignée
CACHE_REDIS_URL=
```

### Signal de synchronisation

```ini
# URL de connexion de l'adaptateur de synchronisation Redis (par défaut, si non spécifiée : redis://localhost:6379/0)
PUBSUB_ADAPTER_REDIS_URL=
```

### Verrou distribué

```ini
# Adaptateur de verrou : en mode cluster, doit être défini sur redis (par défaut, si non spécifié, utilise un verrou local en mémoire)
LOCK_ADAPTER_DEFAULT=redis

# URL de connexion de l'adaptateur de verrou Redis (par défaut, si non spécifiée : redis://localhost:6379/0)
LOCK_ADAPTER_REDIS_URL=
```

### File d'attente de messages

```ini
# Active Redis comme adaptateur de file d'attente de messages (par défaut, si non spécifié, utilise l'adaptateur en mémoire)
QUEUE_ADAPTER=redis
# URL de connexion de l'adaptateur de file d'attente de messages Redis (par défaut, si non spécifiée : redis://localhost:6379/0)
QUEUE_ADAPTER_REDIS_URL=
```

### Allocateur d'ID de Worker

Certaines collections système de NocoBase utilisent des ID globalement uniques comme clés primaires. Pour éviter les conflits de clés primaires au sein d'un cluster, chaque instance d'application doit obtenir un ID de Worker unique via l'Allocateur d'ID de Worker. La plage actuelle des ID de Worker est de 0 à 31, ce qui signifie qu'une même application peut fonctionner sur un maximum de 32 nœuds simultanément. Pour plus de détails sur la conception des ID globalement uniques, consultez [@nocobase/snowflake-id](https://github.com/nocobase/nocobase/tree/main/packages/core/snowflake-id).

```ini
# URL de connexion Redis pour l'Allocateur d'ID de Worker.
# Si omise, un ID de Worker aléatoire sera attribué.
REDIS_URL=
```

:::info{title=Conseil}
Généralement, les adaptateurs peuvent tous utiliser la même instance Redis, mais il est préférable d'utiliser des bases de données différentes pour éviter d'éventuels conflits de clés, par exemple :

```ini
CACHE_REDIS_URL=redis://localhost:6379/0
PUBSUB_ADAPTER_REDIS_URL=redis://localhost:6379/1
LOCK_ADAPTER_REDIS_URL=redis://localhost:6379/2
QUEUE_ADAPTER_REDIS_URL=redis://localhost:6379/3
REDIS_URL=redis://localhost:6379/4
```

Actuellement, chaque plugin utilise ses propres variables d'environnement liées à Redis. À l'avenir, nous pourrions envisager d'utiliser `REDIS_URL` comme configuration de secours unifiée.

:::

Si vous utilisez Kubernetes pour gérer votre cluster, vous pouvez configurer les variables d'environnement ci-dessus dans un ConfigMap ou un Secret. Pour plus d'informations, veuillez consulter [Déploiement Kubernetes](./kubernetes).

Une fois tous les préparatifs ci-dessus terminés, vous pouvez passer aux [Opérations](./operations) pour continuer à gérer les instances de l'application.
