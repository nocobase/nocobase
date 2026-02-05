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

En dehors de l'instance d'application elle-même, les autres composants système peuvent être choisis par le personnel d'exploitation en fonction des besoins opérationnels de chaque équipe.

### Base de données

Étant donné que le mode cluster actuel ne concerne que les instances d'application, la base de données ne prend en charge qu'un seul nœud pour le moment. Si vous utilisez une architecture de base de données telle que maître-esclave, vous devrez l'implémenter vous-même via un middleware et vous assurer qu'elle est transparente pour l'application NocoBase.

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

NocoBase utilise le répertoire `storage` pour stocker les fichiers système. En mode multi-nœuds, vous devez monter un disque cloud (ou NFS) pour permettre un accès partagé entre les différents nœuds. Sans cela, le stockage local ne sera pas automatiquement synchronisé et l'application ne fonctionnera pas correctement.

Lors d'un déploiement avec Kubernetes, veuillez consulter la section [Déploiement Kubernetes : Stockage partagé](./kubernetes#shared-storage).

### Équilibrage de charge

Le mode cluster nécessite un équilibreur de charge pour distribuer les requêtes, effectuer les vérifications de santé des instances d'application et gérer le basculement en cas de défaillance. Cette partie doit être choisie et configurée en fonction des besoins opérationnels de votre équipe.

À titre d'exemple, pour un Nginx auto-hébergé, ajoutez le contenu suivant à votre fichier de configuration :

```
upstream myapp {
    # ip_hash; # Peut être utilisé pour la persistance de session. Une fois activé, les requêtes provenant du même client sont toujours envoyées au même serveur backend.
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

## Configuration des variables d'environnement

Tous les nœuds du cluster doivent utiliser la même configuration de variables d'environnement. En plus des [variables d'environnement](/api/cli/env) de base de NocoBase, vous devez également configurer les variables d'environnement suivantes, liées aux middlewares.

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