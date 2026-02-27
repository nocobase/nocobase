---
pkg: '@nocobase/plugin-app-supervisor'
---

# Mode multi-environnement

## Introduction

Le mode multi-application en mémoire partagée présente des avantages de déploiement et d'exploitation. Mais quand le nombre d'applications et la complexité augmentent, une instance unique peut atteindre ses limites. Dans ce cas, adoptez un déploiement hybride multi-environnement.

Le système déploie une **application d'entrée** comme centre de gestion/ordonnancement, et plusieurs instances NocoBase comme environnements d'exécution indépendants. Les environnements sont isolés tout en collaborant.

Au niveau infrastructure, les environnements peuvent être déployés en processus distincts, conteneurs Docker, ou plusieurs Deployments Kubernetes.

## Déploiement

Dans ce mode :

- L'**application d'entrée (Supervisor)** gère centralement applications et environnements
- Les **applications Worker** exécutent réellement les charges métier
- Les configurations applications/environnements sont mises en cache via Redis
- Les commandes et synchronisations d'état entre Supervisor et Workers passent par Redis

La création d'environnements n'est pas encore fournie. Les Workers doivent être déployés et configurés manuellement.

### Dépendances d'architecture

Avant déploiement :

- **Redis**
  - Cache des configurations applications/environnements
  - Canal de communication de commandes entre Supervisor et Workers

- **Base de données**
  - Services de base utilisés par Supervisor et Workers

### Application d'entrée (Supervisor)

Le Supervisor gère la création d'applications, démarrage/arrêt, planification des environnements et proxy d'accès.

Variables d'environnement Supervisor :

```bash
# Application mode
APP_MODE=supervisor
# Application discovery adapter
APP_DISCOVERY_ADAPTER=remote
# Application process adapter
APP_PROCESS_ADAPTER=remote
# Redis for application and environment configuration cache
APP_SUPERVISOR_REDIS_URL=
# Command communication adapter
APP_COMMAND_ADPATER=redis
# Redis for command communication
APP_COMMAND_REDIS_URL=
```

### Application Worker

Le Worker héberge et exécute les instances NocoBase.

Variables d'environnement Worker :

```bash
# Application mode
APP_MODE=worker
# Application discovery adapter
APP_DISCOVERY_ADAPTER=remote
# Application process adapter
APP_PROCESS_ADAPTER=local
# Redis for application and environment configuration cache
APP_SUPERVISOR_REDIS_URL=
# Command communication adapter
APP_COMMAND_ADPATER=redis
# Redis for command communication
APP_COMMAND_REDIS_URL=
# Environment identifier
ENVIRONMENT_NAME=
# Environment access URL
ENVIRONMENT_URL=
# Environment proxy access URL
ENVIRONMENT_PROXY_URL=
```

### Exemple Docker Compose

Exemple de déploiement avec un Supervisor et deux Workers.

```yaml
networks:
  nocobase:
    driver: bridge

services:
  redis:
    networks:
      - nocobase
    image: redis/redis-stack-server:latest
  supervisor:
    container_name: nocobase-supervisor
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_supervisor
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=supervisor
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=remote
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-supervisor:/app/nocobase/storage
    ports:
      - '14000:80'
  worker_a:
    container_name: nocobase-worker-a
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_worker_a
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=worker
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=local
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT_NAME=env_a
      - ENVIRONMENT_URL=http://localhost:15000
      - ENVIRONMENT_PROXY_URL=http://worker_a
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-worker-a:/app/nocobase/storage
    ports:
      - '15000:80'
  worker_b:
    container_name: nocobase-worker-b
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_worker_b
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=worker
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=local
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT_NAME=env_b
      - ENVIRONMENT_URL=http://localhost:16000
      - ENVIRONMENT_PROXY_URL=http://worker_b
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-worker-b:/app/nocobase/storage
    ports:
      - '16000:80'
```

## Guide d'utilisation

Les opérations de base sont identiques au mode mémoire partagée, voir [mode mémoire partagée](./local.md). Ici, focus sur la configuration multi-environnement.

### Liste des environnements

Après déploiement, dans **App supervisor** > onglet **Environment**, vous voyez les environnements Worker enregistrés (identifiant, version, URL, statut). Les Workers envoient un heartbeat toutes les 2 minutes.

![](https://static-docs.nocobase.com/202512291830371.png)

### Création d'application

À la création, vous pouvez sélectionner un ou plusieurs environnements. Un seul suffit généralement. Choisissez-en plusieurs seulement en cas de [services splitting](/cluster-mode/services-splitting).

![](https://static-docs.nocobase.com/202512291835086.png)

### Liste des applications

La liste affiche l'environnement d'exécution et l'état de chaque application. Si une application est déployée sur plusieurs environnements, plusieurs états sont affichés.

![](https://static-docs.nocobase.com/202512291842216.png)

### Démarrage d'application

Le démarrage peut écrire des données d'initialisation en base. Pour éviter les conditions de course, les démarrages multi-environnements sont mis en file d'attente.

![](https://static-docs.nocobase.com/202512291841727.png)

### Proxy d'accès

Les applications Worker peuvent être accédées via le sous-chemin `/apps/:appName/admin` de l'application d'entrée.

![](https://static-docs.nocobase.com/202601082154230.png)

Si une application est déployée sur plusieurs environnements, il faut choisir l'environnement cible du proxy.

![](https://static-docs.nocobase.com/202601082155146.png)

Par défaut, le proxy utilise `ENVIRONMENT_URL` (doit être joignable depuis le réseau de l'application d'entrée). Pour une URL différente, utilisez `ENVIRONMENT_PROXY_URL`.
